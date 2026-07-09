// ── ArcGIS Feature Query Executor ──────────────────────────────────────
// Executes feature queries against ArcGIS REST services.
// Handles pagination, batching, viewport queries, GeoJSON/Esri JSON
// format negotiation, caching, and join-key batching.

import {
    getArcGisJson,
    postArcGisForm,
    ArcGisAuthError,
    ArcGisServiceError,
} from "./arcGisRestClient";
import { parseArcGisUrl, buildArcGisQueryUrl } from "./arcGisUrl";
import { checkHostPolicy } from "./arcGisHostPolicy";
import { parseArcGisResponse, type ParsedArcGisFeature } from "./arcGisResponseParser";
import { resolveArcGisError } from "./arcGisErrorResolver";
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
    timestamp: number;
    etag?: string;
}

const MAX_CACHE_SIZE = 50;
const queryCache = new Map<string, CacheEntry>();
const cacheInsertionOrder: string[] = [];

function buildCacheKey(
    layerUrl: string,
    where: string,
    outFields: string[],
    queryStrategy: ArcGisQueryStrategy,
    joinKeySignature?: string,
    viewport?: [number, number, number, number],
    outputSpatialReference?: number,
    layerId?: number
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
    ];
    return parts.filter(p => p.length > 0).join("|");
}

function getFromCache(key: string, cacheMinutes: number): ParsedArcGisFeature[] | null {
    if (cacheMinutes <= 0) return null;
    const entry = queryCache.get(key);
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > cacheMinutes * 60_000) {
        queryCache.delete(key);
        const idx = cacheInsertionOrder.indexOf(key);
        if (idx >= 0) cacheInsertionOrder.splice(idx, 1);
        return null;
    }
    return entry.features;
}

function putInCache(key: string, features: ParsedArcGisFeature[]): void {
    // Evict oldest entries if at capacity
    while (cacheInsertionOrder.length >= MAX_CACHE_SIZE) {
        const oldest = cacheInsertionOrder.shift();
        if (oldest) queryCache.delete(oldest);
    }
    queryCache.set(key, { features, timestamp: Date.now() });
    // Track insertion order for eviction
    const idx = cacheInsertionOrder.indexOf(key);
    if (idx >= 0) cacheInsertionOrder.splice(idx, 1);
    cacheInsertionOrder.push(key);
}

// ── Main Executor ─────────────────────────────────────────────────────

export async function executeArcGisFeatureQuery(
    request: ArcGisFeatureQueryRequest
): Promise<ArcGisFeatureQueryResult> {
    const warnings: string[] = [];
    const { signal } = request;

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
    const metadata = await loadLayerMetadata(layerUrl, signal);
    if (!metadata) {
        throw new Error(`Could not load layer metadata from ${layerUrl}`);
    }

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

    // 9. Build combined WHERE clause
    let where = request.where ?? "1=1";
    if (request.definitionExpression) {
        where = `(${request.definitionExpression}) AND (${where})`;
    }

    // 10. Build outFields
    const outFields = buildOutFields(request.outFields ?? [], objectIdField);

    // 11. Determine query strategy
    const isViewportQuery = request.viewportQuery && request.viewport !== undefined && request.viewport.length === 4;
    const isJoinQuery = request.joinKeys !== undefined && request.joinKeys.values.length > 0;
    let queryStrategy: ArcGisQueryStrategy;
    if (isJoinQuery) {
        queryStrategy = "joinKeys";
    } else if (isViewportQuery) {
        queryStrategy = "viewport";
    } else {
        queryStrategy = "pagination";
    }

    // 12. Build join-key signature for cache
    let joinKeySignature: string | undefined;
    if (isJoinQuery) {
        joinKeySignature = `${request.joinKeys!.field}:${request.joinKeys!.values.map(v => String(v)).sort().join(",")}`;
    }

    // 13. Check cache
    const cacheKey = buildCacheKey(
        layerUrl, where, outFields, queryStrategy,
        joinKeySignature, request.viewport, request.outputSpatialReference, request.layerId
    );
    const cached = getFromCache(cacheKey, request.cacheMinutes ?? 0);
    if (cached) {
        return {
            features: cached,
            metadata,
            requestCount: 0,
            truncated: false,
            objectIdField,
            geometryType: metadata.geometryType ?? "unknown",
            spatialReference: metadata.spatialReference ?? { wkid: 4326 },
            warnings: [],
            sourceUrl: layerUrl,
            usedCache: true,
            queryStrategy,
        };
    }

    // 14. Execute query based on strategy
    const maxFeatures = request.maxFeatures ?? 1000;
    const requestBatchSize = request.requestBatchSize ?? metadata.maxRecordCount ?? 1000;
    const supportsPagination = metadata.advancedQueryCapabilities?.supportsPagination ?? false;

    let allFeatures: ParsedArcGisFeature[] = [];
    let requestCount = 0;
    let truncated = false;

    try {
        if (isJoinQuery) {
            // Join-key batching strategy
            const result = await queryWithJoinKeys(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                request.joinKeys!,
                maxFeatures, requestBatchSize,
                metadata,
                signal
            );
            allFeatures = result.features;
            requestCount = result.requestCount;
            truncated = result.truncated;
        } else if (isViewportQuery && request.viewport) {
            // Viewport query with pagination
            const result = await queryViewport(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                request.viewport,
                maxFeatures, requestBatchSize,
                signal
            );
            requestCount++;
            allFeatures = result.features;
            truncated = result.exceededTransferLimit ?? false;

            // Paginate remaining viewport features
            if (truncated && supportsPagination && allFeatures.length < maxFeatures) {
                const paginated = await paginateQuery(
                    layerUrl, queryFormat, objectIdField,
                    where, outFields,
                    allFeatures.length, requestBatchSize, maxFeatures - allFeatures.length,
                    signal, request.viewport
                );
                allFeatures = allFeatures.concat(paginated.features);
                requestCount += paginated.requestCount;
                truncated = paginated.truncated;
            }
        } else if (supportsPagination) {
            // Standard paginated query
            const paginated = await paginateQuery(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                0, requestBatchSize, maxFeatures,
                signal
            );
            allFeatures = paginated.features;
            requestCount = paginated.requestCount;
            truncated = paginated.truncated;
        } else {
            // Non-paginated: use ID batching strategy
            const result = await queryWithIdBatching(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                maxFeatures, requestBatchSize,
                signal
            );
            allFeatures = result.features;
            requestCount = result.requestCount;
            truncated = result.truncated;
        }

        // Deduplicate by object ID
        allFeatures = deduplicateFeatures(allFeatures, objectIdField);

        // Cache results only on success
        if (request.cacheMinutes && request.cacheMinutes > 0) {
            putInCache(cacheKey, allFeatures);
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
        spatialReference: metadata.spatialReference ?? { wkid: 4326 },
        warnings,
        sourceUrl: layerUrl,
        usedCache: false,
        queryStrategy,
    };
}

// ── Helpers ───────────────────────────────────────────────────────────

async function loadLayerMetadata(
    layerUrl: string,
    signal?: AbortSignal
): Promise<ArcGisLayerMetadata | null> {
    try {
        return await getArcGisJson<ArcGisLayerMetadata>(`${layerUrl}?f=pjson`, { signal });
    } catch {
        return null;
    }
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
}

async function queryBatch(
    layerUrl: string,
    format: "geojson" | "json",
    objectIdField: string,
    where: string,
    outFields: string[],
    pagination: { offset: number; limit: number },
    signal?: AbortSignal,
    viewport?: [number, number, number, number]
): Promise<BatchResult> {
    const queryUrl = buildArcGisQueryUrl(layerUrl);

    if (format === "geojson") {
        const params: Record<string, string> = {
            f: "geojson",
            where,
            outFields: outFields.join(","),
            resultOffset: String(pagination.offset),
            resultRecordCount: String(pagination.limit),
            outSR: "4326",
            returnGeometry: "true",
        };
        if (viewport) {
            params.geometry = JSON.stringify({
                xmin: viewport[0], ymin: viewport[1],
                xmax: viewport[2], ymax: viewport[3],
                spatialReference: { wkid: 4326 },
            });
            params.geometryType = "esriGeometryEnvelope";
            params.inSR = "4326";
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
        };
    }

    // Esri JSON format
    const params: Record<string, string> = {
        f: "json",
        where,
        outFields: outFields.join(","),
        resultOffset: String(pagination.offset),
        resultRecordCount: String(pagination.limit),
        outSR: "4326",
        returnGeometry: "true",
    };
    if (viewport) {
        params.geometry = JSON.stringify({
            xmin: viewport[0], ymin: viewport[1],
            xmax: viewport[2], ymax: viewport[3],
            spatialReference: { wkid: 4326 },
        });
        params.geometryType = "esriGeometryEnvelope";
        params.inSR = "4326";
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
    viewport?: [number, number, number, number]
): Promise<{ features: ParsedArcGisFeature[]; requestCount: number; truncated: boolean }> {
    const allFeatures: ParsedArcGisFeature[] = [];
    let requestCount = 0;
    let offset = startOffset;
    let truncated = false;
    const seen = new Set<string | number>();

    while (allFeatures.length < maxTotal) {
        // Check abort before each page
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const remaining = maxTotal - allFeatures.length;
        const limit = Math.min(batchSize, remaining);

        const result = await queryBatch(layerUrl, format, objectIdField, where, outFields, { offset, limit }, signal, viewport);
        requestCount++;

        if (result.features.length === 0) break;

        for (const f of result.features) {
            const oid = f.objectId;
            if (oid !== undefined && seen.has(oid)) continue;
            if (oid !== undefined) seen.add(oid);
            allFeatures.push(f);
        }

        truncated = result.exceededTransferLimit ?? false;

        offset += result.features.length;

        // Stop conditions
        if (!truncated || result.features.length < limit) break;
    }

    return { features: allFeatures, requestCount, truncated };
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
    signal?: AbortSignal
): Promise<BatchResult> {
    return queryBatch(
        layerUrl, format, objectIdField,
        where, outFields,
        { offset: 0, limit: Math.min(batchSize, maxFeatures) },
        signal, viewport
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
    signal?: AbortSignal
): Promise<{ features: ParsedArcGisFeature[]; requestCount: number; truncated: boolean }> {
    // 1. Collect distinct, nonblank, normalized join values
    const rawValues = joinKeys.values
        .filter(v => v !== null && v !== undefined && String(v).trim() !== "");
    const uniqueValues = [...new Set(rawValues.map(v => String(v).trim()))];

    if (uniqueValues.length === 0) {
        return { features: [], requestCount: 0, truncated: false };
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

    for (const batch of valueBatches) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const whereIn = buildInWhereClause(joinKeys.field, fieldType, batch);
        const batchWhere = where === "1=1" ? whereIn : `(${where}) AND ${whereIn}`;

        const result = await queryBatch(
            layerUrl, format, objectIdField,
            batchWhere, outFields,
            { offset: 0, limit: batchSize },
            signal
        );
        requestCount++;

        for (const f of result.features) {
            const oid = f.objectId;
            if (oid !== undefined && seen.has(oid)) continue;
            if (oid !== undefined) seen.add(oid);
            allFeatures.push(f);
            if (allFeatures.length >= maxFeatures) break;
        }
        if (allFeatures.length >= maxFeatures) break;
    }

    return { features: allFeatures, requestCount, truncated: allFeatures.length >= maxFeatures };
}

async function queryWithIdBatching(
    layerUrl: string,
    format: "geojson" | "json",
    objectIdField: string,
    where: string,
    outFields: string[],
    maxFeatures: number,
    batchSize: number,
    signal?: AbortSignal
): Promise<{ features: ParsedArcGisFeature[]; requestCount: number; truncated: boolean }> {
    let requestCount = 0;

    // Step 1: Get all object IDs
    const queryUrl = buildArcGisQueryUrl(layerUrl);
    const idParams: Record<string, string> = {
        f: "json",
        where,
        returnIdsOnly: "true",
    };

    const idResponse = await postArcGisForm<{ objectIds?: number[]; objectIdFieldName?: string; error?: Record<string, unknown> }>(queryUrl, idParams, { signal });
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
        return { features: [], requestCount, truncated: false };
    }

    const allIds = idResponse.objectIds.slice(0, maxFeatures);
    const oidField = idResponse.objectIdFieldName ?? objectIdField;
    const truncated = idResponse.objectIds.length > maxFeatures;

    // Step 2: Batch the IDs and query each batch
    const allFeatures: ParsedArcGisFeature[] = [];
    const idBatches: number[][] = [];
    for (let i = 0; i < allIds.length; i += batchSize) {
        idBatches.push(allIds.slice(i, i + batchSize));
    }

    for (const batch of idBatches) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const whereIn = buildInWhereClause(oidField, "oid", batch);
        const batchWhere = `(${where}) AND ${whereIn}`;

        const result = await queryBatch(layerUrl, format, objectIdField, batchWhere, outFields, { offset: 0, limit: batch.length }, signal);
        requestCount++;

        for (const f of result.features) {
            allFeatures.push(f);
        }
    }

    return { features: allFeatures, requestCount, truncated };
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
            key = `nooid:${JSON.stringify(f.attributes)}`;
        }
        if (!seen.has(key)) {
            seen.set(key, f);
        }
    }
    return [...seen.values()];
}
