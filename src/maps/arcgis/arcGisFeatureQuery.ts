// ── ArcGIS Feature Query Executor ──────────────────────────────────────
// Executes feature queries against ArcGIS REST services.
// Handles pagination, batching, viewport queries, GeoJSON/Esri JSON
// format negotiation, caching, and join-key batching.

import {
    getArcGisJson,
    postArcGisForm,
    ArcGisServiceError,
} from "./arcGisRestClient";
import { parseArcGisUrl, buildArcGisQueryUrl } from "./arcGisUrl";
import { checkHostPolicy } from "./arcGisHostPolicy";
import { parseArcGisResponse, type ParsedArcGisFeature } from "./arcGisResponseParser";
import { buildInWhereClause, inferArcGisFieldType } from "./arcGisWhereBuilder";
import type { ArcGisFieldType } from "./arcGisWhereBuilder";
import type { ArcGisLayerMetadata, ArcGisQueryResponse, ArcGisGeoJsonResponse } from "./arcGisServiceTypes";
import type { MapJoinNormalization } from "../../schema/mapSchema";
import { normalizeJoinKey } from "../join/mapJoinNormalizer";

// ── Types ─────────────────────────────────────────────────────────────

export interface ArcGisJoinKeyQuery {
    field: string;
    values: unknown[];
    normalization?: MapJoinNormalization[];
}

export type ArcGisQueryStrategy =
    | "pagination"
    | "objectIds"
    | "joinKeys"
    | "viewport";

export interface ArcGisFeatureQueryRequest {
    /** Target ArcGIS REST service URL (layer or service root) */
    url: string;
    /** Layer ID in the service (only needed for service-root URLs) */
    layerId?: number;
    /** WHERE clause filter */
    where?: string;
    /** Definition expression for layer-level filtering */
    definitionExpression?: string;
    /** Fields to include in results */
    outFields?: string[];
    /** Max features to return */
    maxFeatures?: number;
    /** Records per request */
    requestBatchSize?: number;
    /** Bounding box for viewport query [west, south, east, north] */
    viewport?: [number, number, number, number];
    /** Whether to use viewport query */
    viewportQuery?: boolean;
    /** Signal for cancellation */
    signal?: AbortSignal;
    /** Cache minutes (0 = no caching) */
    cacheMinutes?: number;
    /** Refresh interval in minutes */
    refreshIntervalMinutes?: number;
    /** Join-key batching configuration */
    joinKeys?: ArcGisJoinKeyQuery;
    /** Explicit query strategy override */
    queryStrategy?: "auto" | "keyBatches";
    /** Output spatial reference WKID */
    outputSpatialReference?: number;
    /** Whether to collect service renderer fields from metadata */
    useServiceRenderer?: boolean;
    /** Whether to collect service label fields from metadata */
    useServiceLabels?: boolean;
}

export interface ArcGisFeatureQueryResult {
    features: ParsedArcGisFeature[];
    metadata: ArcGisLayerMetadata | null;
    requestCount: number;
    truncated: boolean;
    objectIdField: string;
    geometryType: string;
    spatialReference: { wkid: number };
    warnings: string[];
    sourceUrl: string;
    usedCache: boolean;
    queryStrategy: ArcGisQueryStrategy;
}

// ── Cache ─────────────────────────────────────────────────────────────

interface CacheEntry {
    features: ParsedArcGisFeature[];
    warnings: string[];
    timestamp: number;
    truncated: boolean;
}

const MAX_CACHE_SIZE = 50;
const MAX_CACHE_FEATURES = 100_000;
const queryCache = new Map<string, CacheEntry>();
const cacheInsertionOrder: string[] = [];
let cachedFeatureCount = 0;
const metadataCache = new Map<string, { metadata: ArcGisLayerMetadata; timestamp: number }>();
const MAX_METADATA_CACHE_SIZE = 50;

interface InFlightQuery {
    controller: AbortController;
    consumers: Set<symbol>;
    settled: boolean;
    promise: Promise<ArcGisFeatureQueryResult>;
}

const inFlightQueries = new Map<string, InFlightQuery>();

function buildCacheKey(
    layerUrl: string,
    where: string,
    outFields: string[],
    queryStrategy: ArcGisQueryStrategy,
    joinKeySignature?: string,
    viewport?: [number, number, number, number],
    outputSpatialReference?: number,
    layerId?: number,
    maxFeatures?: number,
): string {
    const vp = viewport
        ? `vp:${viewport.map(c => Math.round(c * 10000) / 10000).join(",")}`
        : "";
    const parts = [
        layerUrl,
        `w:${where}`,
        `of:${[...outFields].sort().join(",")}`,
        `qs:${queryStrategy}`,
        joinKeySignature ? `jk:${joinKeySignature}` : "",
        vp,
        outputSpatialReference ? `sr:${outputSpatialReference}` : "",
        layerId !== undefined ? `lid:${layerId}` : "",
        maxFeatures !== undefined ? `max:${maxFeatures}` : "",
    ];
    return parts.filter(p => p.length > 0).join("|");
}

function getFromCache(key: string, cacheMinutes: number): CacheEntry | null {
    if (cacheMinutes <= 0) return null;
    const entry = queryCache.get(key);
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > cacheMinutes * 60_000) {
        queryCache.delete(key);
        cachedFeatureCount -= entry.features.length;
        const idx = cacheInsertionOrder.indexOf(key);
        if (idx >= 0) cacheInsertionOrder.splice(idx, 1);
        return null;
    }
    return entry;
}

function putInCache(key: string, features: ParsedArcGisFeature[], warnings: string[], truncated: boolean): void {
    if (features.length > MAX_CACHE_FEATURES) return;
    const existing = queryCache.get(key);
    if (existing) {
        queryCache.delete(key);
        cachedFeatureCount -= existing.features.length;
        const index = cacheInsertionOrder.indexOf(key);
        if (index >= 0) cacheInsertionOrder.splice(index, 1);
    }
    while (
        cacheInsertionOrder.length >= MAX_CACHE_SIZE ||
        cachedFeatureCount + features.length > MAX_CACHE_FEATURES
    ) {
        const oldest = cacheInsertionOrder.shift();
        if (!oldest) break;
        const removed = queryCache.get(oldest);
        if (removed) cachedFeatureCount -= removed.features.length;
        queryCache.delete(oldest);
    }
    queryCache.set(key, { features, warnings, truncated, timestamp: Date.now() });
    cachedFeatureCount += features.length;
    cacheInsertionOrder.push(key);
}

// ── Main Executor ─────────────────────────────────────────────────────

export async function executeArcGisFeatureQuery(
    request: ArcGisFeatureQueryRequest
): Promise<ArcGisFeatureQueryResult> {
    if (request.signal?.aborted)
        throw request.signal.reason ?? new DOMException("Aborted", "AbortError");
    const key = inFlightQueryKey(request);
    let shared = inFlightQueries.get(key);
    if (!shared) {
        const controller = new AbortController();
        shared = {
            controller,
            consumers: new Set(),
            settled: false,
            promise: undefined as unknown as Promise<ArcGisFeatureQueryResult>,
        };
        const current = shared;
        current.promise = executeArcGisFeatureQueryUnshared({ ...request, signal: controller.signal }).then(
            value => {
                current.settled = true;
                if (inFlightQueries.get(key) === current) inFlightQueries.delete(key);
                return value;
            },
            error => {
                current.settled = true;
                if (inFlightQueries.get(key) === current) inFlightQueries.delete(key);
                throw error;
            },
        );
        inFlightQueries.set(key, current);
        shared = current;
    }
    return subscribeToInFlightQuery(key, shared, request.signal);
}

function inFlightQueryKey(request: ArcGisFeatureQueryRequest): string {
    const normalizedJoinValues = request.joinKeys
        ? [...new Set(request.joinKeys.values
            .map(value => normalizeJoinKey(value, request.joinKeys?.normalization ?? ["trim", "upper"]))
            .filter((value): value is string => value !== null))].sort()
        : undefined;
    let normalizedUrl = request.url;
    try {
        normalizedUrl = parseArcGisUrl(request.url).normalizedUrl;
    } catch {
        // Validation in the executor remains the source of the public error.
    }
    return JSON.stringify({
        url: normalizedUrl,
        layerId: request.layerId,
        where: request.where ?? "1=1",
        definitionExpression: request.definitionExpression,
        outFields: [...(request.outFields ?? [])].sort(),
        maxFeatures: request.maxFeatures,
        requestBatchSize: request.requestBatchSize,
        viewport: request.viewport?.map(value => Math.round(value * 10_000) / 10_000),
        viewportQuery: request.viewportQuery === true,
        cacheMinutes: request.cacheMinutes ?? 0,
        refreshIntervalMinutes: request.refreshIntervalMinutes,
        joinKeys: request.joinKeys ? {
            field: request.joinKeys.field,
            values: normalizedJoinValues,
            normalization: request.joinKeys.normalization,
        } : undefined,
        queryStrategy: request.queryStrategy,
        outputSpatialReference: request.outputSpatialReference ?? 4326,
        useServiceRenderer: request.useServiceRenderer === true,
        useServiceLabels: request.useServiceLabels === true,
    });
}

function subscribeToInFlightQuery(
    key: string,
    shared: InFlightQuery,
    signal?: AbortSignal,
): Promise<ArcGisFeatureQueryResult> {
    return new Promise((resolve, reject) => {
        const consumer = Symbol(key);
        let settled = false;
        const release = () => {
            shared.consumers.delete(consumer);
            if (!shared.settled && shared.consumers.size === 0) {
                if (inFlightQueries.get(key) === shared) inFlightQueries.delete(key);
                shared.controller.abort(new DOMException("All query consumers cancelled.", "AbortError"));
            }
        };
        const finish = (callback: () => void) => {
            if (settled) return;
            settled = true;
            signal?.removeEventListener("abort", onAbort);
            release();
            callback();
        };
        const onAbort = () => finish(() => reject(
            signal?.reason ?? new DOMException("Aborted", "AbortError"),
        ));

        if (signal?.aborted) {
            onAbort();
            return;
        }
        shared.consumers.add(consumer);
        signal?.addEventListener("abort", onAbort, { once: true });
        shared.promise.then(
            value => finish(() => resolve(value)),
            error => finish(() => reject(error)),
        );
    });
}

function positiveInteger(value: number | undefined, fallback: number, maximum: number): number {
    const numeric = Number(value);
    return Number.isFinite(numeric)
        ? Math.max(1, Math.min(maximum, Math.floor(numeric)))
        : fallback;
}

async function executeArcGisFeatureQueryUnshared(
    request: ArcGisFeatureQueryRequest,
): Promise<ArcGisFeatureQueryResult> {
    const warnings: string[] = [];
    const { signal } = request;
    const cacheMinutes = Math.max(0, Math.min(24 * 60, request.cacheMinutes ?? 0));
    const outputSpatialReference = request.outputSpatialReference ?? 4326;
    if (outputSpatialReference !== 4326) {
        throw new Error(`Only output spatial reference 4326 is supported. Requested: ${outputSpatialReference}.`);
    }

    // 1. Normalize URL
    const parsed = parseArcGisUrl(request.url);
    if (parsed.serviceType === "unknown") {
        throw new Error("Not a recognized ArcGIS REST service URL.");
    }

    // 2. Determine the actual layer URL
    let layerUrl: string;
    if (parsed.isLayer) {
        layerUrl = parsed.normalizedUrl;
    } else if (request.layerId !== undefined) {
        layerUrl = `${parsed.normalizedUrl}/${request.layerId}`;
    } else {
        throw new Error("A layer ID is required for service-root URLs. Set layerId or use a direct layer URL.");
    }

    // 3. Validate HTTPS
    const urlObj = new URL(layerUrl);
    if (urlObj.protocol !== "https:") {
        throw new Error("Only HTTPS ArcGIS services are supported.");
    }

    // 4. Check host policy
    const hostPolicy = checkHostPolicy(layerUrl);
    if (!hostPolicy.allowed) {
        throw new Error(hostPolicy.reason ?? `Host not permitted: ${hostPolicy.host}`);
    }

    // 5. Load layer metadata (single metadata path)
    const metadata = await loadLayerMetadata(layerUrl, signal, cacheMinutes);

    // 6. Verify query capability
    const caps = (metadata.capabilities ?? "").toLowerCase();
    if (!caps.includes("query")) {
        throw new Error(`Layer "${metadata.name}" does not support query operations.`);
    }

    // 7. Determine object-ID field from metadata
    const objectIdField = metadata.objectIdField ?? "OBJECTID";

    // 8. Determine supported query formats
    const supportedFormats = (metadata.supportedQueryFormats ?? "JSON").toUpperCase();
    const supportsGeoJson = supportedFormats.includes("GEOJSON");
    const queryFormat = supportsGeoJson ? "geojson" : "json";
    const supportsPagination = metadata.advancedQueryCapabilities?.supportsPagination ?? false;

    // 9. Build combined WHERE clause
    let where = request.where ?? "1=1";
    if (request.definitionExpression) {
        where = `(${request.definitionExpression}) AND (${where})`;
    }

    // 10. Collect opt-in service renderer/label fields before building outFields.
    const metadataFields = collectMetadataQueryFields(metadata, {
        renderer: request.useServiceRenderer === true,
        labels: request.useServiceLabels === true,
    });

    const normalizedJoinValues = request.joinKeys
        ? [...new Set(request.joinKeys.values
            .map(value => normalizeJoinKey(value, request.joinKeys?.normalization ?? ["trim", "upper"]))
            .filter((value): value is string => value !== null))]
        : [];
    const joinKeys = request.joinKeys ? { ...request.joinKeys, values: normalizedJoinValues } : undefined;

    const requestedFields = [
        ...(request.outFields ?? []),
        ...metadataFields,
        ...(joinKeys ? [joinKeys.field] : []),
    ];
    const outFields = buildOutFields(requestedFields, objectIdField);

    // 11. Determine query strategy
    const isViewportQuery = request.viewportQuery && request.viewport !== undefined && request.viewport.length === 4;
    const joinStrategyAllowed = request.queryStrategy === undefined ||
        request.queryStrategy === "auto" || request.queryStrategy === "keyBatches";
    const hasJoinConfiguration = joinKeys !== undefined && joinStrategyAllowed;
    const isJoinQuery = hasJoinConfiguration && joinKeys.values.length > 0;
    let queryStrategy: ArcGisQueryStrategy;
    if (isJoinQuery) {
        queryStrategy = "joinKeys";
    } else if (isViewportQuery) {
        queryStrategy = "viewport";
    } else {
        queryStrategy = supportsPagination ? "pagination" : "objectIds";
    }

    // 12. Build join-key signature for cache
    let joinKeySignature: string | undefined;
    if (isJoinQuery) {
        joinKeySignature = `${joinKeys!.field}:${[...normalizedJoinValues].sort().join(",")}`;
    }

    const maxFeatures = positiveInteger(request.maxFeatures, 1000, 100_000);
    const requestBatchSize = positiveInteger(
        request.requestBatchSize,
        positiveInteger(metadata.maxRecordCount, 1000, 10_000),
        10_000,
    );

    // 13. Check cache
    const cacheKey = buildCacheKey(
        layerUrl, where, outFields, queryStrategy,
        joinKeySignature, request.viewport, outputSpatialReference, request.layerId,
        maxFeatures,
    );
    const cached = getFromCache(cacheKey, cacheMinutes);
    if (cached) {
        return {
            features: cached.features,
            metadata,
            requestCount: 0,
            truncated: cached.truncated,
            objectIdField,
            geometryType: metadata.geometryType ?? "unknown",
            spatialReference: { wkid: outputSpatialReference },
            warnings: cached.warnings,
            sourceUrl: layerUrl,
            usedCache: true,
            queryStrategy,
        };
    }

    // 14. Execute query based on strategy
    let allFeatures: ParsedArcGisFeature[] = [];
    let requestCount = 0;
    let truncated = false;

    if (hasJoinConfiguration && normalizedJoinValues.length === 0) {
        return {
            features: [], metadata, requestCount: 0, truncated: false, objectIdField,
            geometryType: metadata.geometryType ?? "unknown",
            spatialReference: { wkid: outputSpatialReference }, warnings, sourceUrl: layerUrl,
            usedCache: false, queryStrategy: "joinKeys",
        };
    }

    try {
        if (isJoinQuery) {
            // Join-key batching strategy
            const result = await queryWithJoinKeys(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                joinKeys!,
                maxFeatures, requestBatchSize,
                metadata,
                signal,
                outputSpatialReference
            );
            allFeatures = result.features;
            requestCount = result.requestCount;
            truncated = result.truncated;
            warnings.push(...result.warnings);
        } else if (isViewportQuery && request.viewport) {
            // Viewport query with pagination
            const result = await queryViewport(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                request.viewport,
                maxFeatures, requestBatchSize,
                signal,
                outputSpatialReference
            );
            requestCount++;
            allFeatures = result.features.slice(0, maxFeatures);
            truncated = (result.exceededTransferLimit ?? false) || result.features.length > maxFeatures;
            warnings.push(...result.warnings);

            // Paginate remaining viewport features
            if (truncated && supportsPagination && allFeatures.length < maxFeatures) {
                const paginated = await paginateQuery(
                    layerUrl, queryFormat, objectIdField,
                    where, outFields,
                    allFeatures.length, requestBatchSize, maxFeatures - allFeatures.length,
                    signal, request.viewport, outputSpatialReference
                );
                allFeatures = allFeatures.concat(paginated.features);
                requestCount += paginated.requestCount;
                truncated = paginated.truncated;
                warnings.push(...paginated.warnings);
            }
        } else if (supportsPagination) {
            // Standard paginated query
            const paginated = await paginateQuery(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                0, requestBatchSize, maxFeatures,
                signal, undefined, outputSpatialReference
            );
            allFeatures = paginated.features;
            requestCount = paginated.requestCount;
            truncated = paginated.truncated;
            warnings.push(...paginated.warnings);
        } else {
            // Non-paginated: use ID batching strategy
            const result = await queryWithIdBatching(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                maxFeatures, requestBatchSize,
                signal, outputSpatialReference
            );
            allFeatures = result.features;
            requestCount = result.requestCount;
            truncated = result.truncated;
            warnings.push(...result.warnings);
        }

        // Deduplicate by object ID
        allFeatures = deduplicateFeatures(allFeatures, objectIdField).slice(0, maxFeatures);

        // Cache results only on success
        if (cacheMinutes > 0) {
            putInCache(cacheKey, allFeatures, warnings, truncated);
        }
    } catch (err) {
        // Do not cache failures or aborted requests
        if (signal?.aborted) {
            throw err;
        }
        // Re-throw with context
        throw err;
    }

    return {
        features: allFeatures,
        metadata,
        requestCount,
        truncated,
        objectIdField,
        geometryType: metadata.geometryType ?? "unknown",
        spatialReference: { wkid: outputSpatialReference },
        warnings,
        sourceUrl: layerUrl,
        usedCache: false,
        queryStrategy,
    };
}

// ── Helpers ───────────────────────────────────────────────────────────

async function loadLayerMetadata(
    layerUrl: string,
    signal?: AbortSignal,
    cacheMinutes = 0,
): Promise<ArcGisLayerMetadata> {
    const cached = metadataCache.get(layerUrl);
    if (cached && cacheMinutes > 0 && Date.now() - cached.timestamp <= cacheMinutes * 60_000) {
        metadataCache.delete(layerUrl);
        metadataCache.set(layerUrl, cached);
        return cached.metadata;
    }
    if (cached) metadataCache.delete(layerUrl);
    const metadata = await getArcGisJson<ArcGisLayerMetadata>(`${layerUrl}?f=pjson`, { signal });
    if (cacheMinutes > 0) {
        metadataCache.set(layerUrl, { metadata, timestamp: Date.now() });
        while (metadataCache.size > MAX_METADATA_CACHE_SIZE) {
            const oldest = metadataCache.keys().next().value as string | undefined;
            if (oldest === undefined) break;
            metadataCache.delete(oldest);
        }
    }
    return metadata;
}

export function collectMetadataQueryFields(
    metadata: ArcGisLayerMetadata,
    options: { renderer: boolean; labels: boolean }
): string[] {
    const actualFields = new Map(
        (metadata.fields ?? []).map(field => [field.name.toLowerCase(), field.name] as const)
    );
    const candidates = new Set<string>();
    const add = (value: unknown) => {
        if (typeof value !== "string" || value.trim().length === 0) return;
        const actual = actualFields.get(value.trim().toLowerCase());
        if (actual) candidates.add(actual);
    };

    if (options.renderer) {
        const renderer = metadata.drawingInfo?.renderer;
        add(renderer?.field);
        add(renderer?.field1);
        add(renderer?.field2);
        add(renderer?.field3);
        add(renderer?.normalizationField);
        add(renderer?.sizeInfo?.field);
        add(renderer?.colorInfo?.field);
        for (const visualVariable of renderer?.visualVariables ?? []) add(visualVariable.field);
    }

    if (options.labels) {
        for (const label of metadata.drawingInfo?.labelingInfo ?? []) {
            const expression = label.labelExpressionInfo?.expression ?? label.labelExpression ?? "";
            const patterns = [
                /\[([^\]]+)\]/g,
                /\$feature\.([A-Za-z_][A-Za-z0-9_]*)/g,
                /\$feature\[\s*["']([^"']+)["']\s*\]/g,
            ];
            for (const pattern of patterns) {
                for (const match of expression.matchAll(pattern)) add(match[1]);
            }
        }
    }

    return [...candidates];
}

function buildOutFields(userFields: string[], objectIdField: string): string[] {
    const fields = new Set<string>([objectIdField]);
    for (const f of userFields) {
        if (f && f.length > 0) fields.add(f);
    }
    return [...fields];
}

interface BatchResult {
    features: ParsedArcGisFeature[];
    exceededTransferLimit?: boolean;
    warnings: string[];
}

async function queryBatch(
    layerUrl: string,
    format: "geojson" | "json",
    objectIdField: string,
    where: string,
    outFields: string[],
    pagination: { offset: number; limit: number },
    signal?: AbortSignal,
    viewport?: [number, number, number, number],
    outputSpatialReference = 4326
): Promise<BatchResult> {
    const queryUrl = buildArcGisQueryUrl(layerUrl);

    if (format === "geojson") {
        const params: Record<string, string> = {
            f: "geojson",
            where,
            outFields: outFields.join(","),
            resultOffset: String(pagination.offset),
            resultRecordCount: String(pagination.limit),
            outSR: String(outputSpatialReference),
            returnGeometry: "true",
        };
        if (viewport) {
            params.geometry = JSON.stringify({
                xmin: viewport[0], ymin: viewport[1],
                xmax: viewport[2], ymax: viewport[3],
                spatialReference: { wkid: outputSpatialReference },
            });
            params.geometryType = "esriGeometryEnvelope";
            params.inSR = String(outputSpatialReference);
            params.spatialRel = "esriSpatialRelIntersects";
        }

        const response = await postArcGisForm<ArcGisGeoJsonResponse>(queryUrl, params, { signal });
        if (response.error) {
            throw new ArcGisServiceError(response.error.code, response.error.message ?? "Query error", queryUrl, response.error.details ?? []);
        }

        const parsed = parseArcGisResponse(response, "geojson", objectIdField);
        return {
            features: parsed.features,
            exceededTransferLimit: parsed.exceededTransferLimit,
            warnings: parsed.warnings,
        };
    }

    // Esri JSON format
    const params: Record<string, string> = {
        f: "json",
        where,
        outFields: outFields.join(","),
        resultOffset: String(pagination.offset),
        resultRecordCount: String(pagination.limit),
        outSR: String(outputSpatialReference),
        returnGeometry: "true",
    };
    if (viewport) {
        params.geometry = JSON.stringify({
            xmin: viewport[0], ymin: viewport[1],
            xmax: viewport[2], ymax: viewport[3],
            spatialReference: { wkid: outputSpatialReference },
        });
        params.geometryType = "esriGeometryEnvelope";
        params.inSR = String(outputSpatialReference);
        params.spatialRel = "esriSpatialRelIntersects";
    }

    const response = await postArcGisForm<ArcGisQueryResponse>(queryUrl, params, { signal });
    if (response.error) {
        throw new ArcGisServiceError(response.error.code, response.error.message ?? "Query error", queryUrl, response.error.details ?? []);
    }

    const parsed = parseArcGisResponse(response, "json", objectIdField);
    return {
        features: parsed.features,
        exceededTransferLimit: parsed.exceededTransferLimit,
        warnings: parsed.warnings,
    };
}

async function paginateQuery(
    layerUrl: string,
    format: "geojson" | "json",
    objectIdField: string,
    where: string,
    outFields: string[],
    startOffset: number,
    batchSize: number,
    maxTotal: number,
    signal?: AbortSignal,
    viewport?: [number, number, number, number],
    outputSpatialReference = 4326
): Promise<{ features: ParsedArcGisFeature[]; requestCount: number; truncated: boolean; warnings: string[] }> {
    const allFeatures: ParsedArcGisFeature[] = [];
    let requestCount = 0;
    let offset = startOffset;
    let truncated = false;
    const seen = new Set<string | number>();
    const warnings: string[] = [];

    while (allFeatures.length < maxTotal) {
        // Check abort before each page
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const remaining = maxTotal - allFeatures.length;
        const limit = Math.min(batchSize, remaining);

        const result = await queryBatch(layerUrl, format, objectIdField, where, outFields, { offset, limit }, signal, viewport, outputSpatialReference);
        requestCount++;
        warnings.push(...result.warnings);

        if (result.features.length === 0) break;

        const before = allFeatures.length;
        for (const f of result.features) {
            const oid = f.objectId;
            if (oid !== undefined && seen.has(oid)) continue;
            if (oid !== undefined) seen.add(oid);
            allFeatures.push(f);
            if (allFeatures.length >= maxTotal) break;
        }

        truncated = result.exceededTransferLimit ?? false;

        offset += result.features.length;

        if (allFeatures.length === before && truncated) {
            warnings.push("ArcGIS pagination stopped because the service repeated a page without returning new object IDs.");
            break;
        }

        // Stop conditions
        if (!truncated || result.features.length < limit) break;
    }

    return { features: allFeatures, requestCount, truncated, warnings };
}

async function queryViewport(
    layerUrl: string,
    format: "geojson" | "json",
    objectIdField: string,
    where: string,
    outFields: string[],
    viewport: [number, number, number, number],
    maxFeatures: number,
    batchSize: number,
    signal?: AbortSignal,
    outputSpatialReference = 4326
): Promise<BatchResult> {
    return queryBatch(
        layerUrl, format, objectIdField,
        where, outFields,
        { offset: 0, limit: Math.min(batchSize, maxFeatures) },
        signal, viewport, outputSpatialReference
    );
}

/**
 * Join-key batching: builds IN-clause queries from normalized join values
 * and queries only matching features from the ArcGIS service.
 */
async function queryWithJoinKeys(
    layerUrl: string,
    format: "geojson" | "json",
    objectIdField: string,
    where: string,
    outFields: string[],
    joinKeys: ArcGisJoinKeyQuery,
    maxFeatures: number,
    batchSize: number,
    metadata: ArcGisLayerMetadata,
    signal?: AbortSignal,
    outputSpatialReference = 4326
): Promise<{ features: ParsedArcGisFeature[]; requestCount: number; truncated: boolean; warnings: string[] }> {
    // Values were normalized before cache signature and batching.
    const uniqueValues = [...new Set(joinKeys.values
        .map(value => normalizeJoinKey(value, joinKeys.normalization ?? ["trim", "upper"]))
        .filter((value): value is string => value !== null))];

    if (uniqueValues.length === 0) {
        return { features: [], requestCount: 0, truncated: false, warnings: [] };
    }

    // 2. Determine field type from metadata
    const fieldInfo = metadata.fields?.find(
        f => f.name.toLowerCase() === joinKeys.field.toLowerCase()
    );
    const fieldType: ArcGisFieldType = fieldInfo?.type
        ? inferArcGisFieldType(fieldInfo.type)
        : "string";

    // 3. Build safe IN clause batches
    const valueBatches: unknown[][] = [];
    for (let i = 0; i < uniqueValues.length; i += batchSize) {
        valueBatches.push(uniqueValues.slice(i, i + batchSize));
    }

    // 4. Query each batch
    const allFeatures: ParsedArcGisFeature[] = [];
    let requestCount = 0;
    const seen = new Set<string | number>();
    const warnings: string[] = [];
    const supportsPagination = metadata.advancedQueryCapabilities?.supportsPagination ?? false;
    let serviceTruncated = false;

    for (const batch of valueBatches) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const whereIn = buildInWhereClause(joinKeys.field, fieldType, batch);
        const batchWhere = where === "1=1" ? whereIn : `(${where}) AND ${whereIn}`;

        const remaining = maxFeatures - allFeatures.length;
        if (remaining <= 0) break;
        const result = supportsPagination
            ? await paginateQuery(
                layerUrl, format, objectIdField, batchWhere, outFields,
                0, batchSize, remaining, signal, undefined, outputSpatialReference
            )
            : await queryWithIdBatching(
                layerUrl, format, objectIdField, batchWhere, outFields,
                remaining, batchSize, signal, outputSpatialReference
            );
        requestCount += result.requestCount;
        warnings.push(...result.warnings);
        serviceTruncated = serviceTruncated || result.truncated;

        for (const f of result.features) {
            const oid = f.objectId;
            if (oid !== undefined && seen.has(oid)) continue;
            if (oid !== undefined) seen.add(oid);
            allFeatures.push(f);
            if (allFeatures.length >= maxFeatures) break;
        }
        if (allFeatures.length >= maxFeatures) break;
    }

    return {
        features: allFeatures,
        requestCount,
        truncated: serviceTruncated || allFeatures.length >= maxFeatures,
        warnings,
    };
}

async function queryWithIdBatching(
    layerUrl: string,
    format: "geojson" | "json",
    objectIdField: string,
    where: string,
    outFields: string[],
    maxFeatures: number,
    batchSize: number,
    signal?: AbortSignal,
    outputSpatialReference = 4326
): Promise<{ features: ParsedArcGisFeature[]; requestCount: number; truncated: boolean; warnings: string[] }> {
    let requestCount = 0;

    // Step 1: Get all object IDs
    const queryUrl = buildArcGisQueryUrl(layerUrl);
    const idParams: Record<string, string> = {
        f: "json",
        where,
        returnIdsOnly: "true",
    };

    const idResponse = await postArcGisForm<{ objectIds?: Array<string | number>; objectIdFieldName?: string; error?: Record<string, unknown> }>(queryUrl, idParams, { signal });
    requestCount++;

    // Check for ArcGIS error in response
    if (idResponse.error) {
        throw Object.assign(new Error("ArcGIS service returned an error in ID query."), {
            arcGisError: idResponse.error,
            sourceUrl: queryUrl,
            format: "json",
        });
    }

    if (!idResponse.objectIds || idResponse.objectIds.length === 0) {
        return { features: [], requestCount, truncated: false, warnings: [] };
    }

    const allIds = idResponse.objectIds.slice(0, maxFeatures);
    const oidField = idResponse.objectIdFieldName ?? objectIdField;
    const truncated = idResponse.objectIds.length > maxFeatures;

    // Step 2: Batch the IDs and query each batch
    const allFeatures: ParsedArcGisFeature[] = [];
    const idBatches: Array<Array<string | number>> = [];
    const warnings: string[] = [];
    for (let i = 0; i < allIds.length; i += batchSize) {
        idBatches.push(allIds.slice(i, i + batchSize));
    }

    for (const batch of idBatches) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const whereIn = buildInWhereClause(oidField, "oid", batch);
        const batchWhere = `(${where}) AND ${whereIn}`;

        const result = await queryBatch(
            layerUrl, format, objectIdField, batchWhere, outFields,
            { offset: 0, limit: batch.length }, signal, undefined, outputSpatialReference
        );
        requestCount++;
        warnings.push(...result.warnings);

        for (const f of result.features) {
            allFeatures.push(f);
            if (allFeatures.length >= maxFeatures) break;
        }
        if (allFeatures.length >= maxFeatures) break;
    }

    return { features: allFeatures.slice(0, maxFeatures), requestCount, truncated, warnings };
}

function deduplicateFeatures(
    features: ParsedArcGisFeature[],
    objectIdField: string
): ParsedArcGisFeature[] {
    const seen = new Map<string, ParsedArcGisFeature>();
    for (const f of features) {
        // Try objectId first, then attribute OID, then stringify
        let key: string | undefined;
        if (f.objectId !== undefined) {
            key = String(f.objectId);
        } else {
            const attrOid = f.attributes[objectIdField];
            if (attrOid !== undefined && attrOid !== null) {
                key = String(attrOid);
            }
        }
        // Fallback: use JSON serialization only for features without OID
        if (key === undefined) {
            key = `nooid:${JSON.stringify([f.attributes, f.geometry])}`;
        }
        if (!seen.has(key)) {
            seen.set(key, f);
        }
    }
    return [...seen.values()];
}
