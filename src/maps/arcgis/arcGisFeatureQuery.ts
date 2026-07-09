// ── ArcGIS Feature Query Executor ──────────────────────────────────────
// Executes feature queries against ArcGIS REST services.
// Handles pagination, batching, viewport queries, GeoJSON/Esri JSON
// format negotiation, and caching.

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

// ── Types ─────────────────────────────────────────────────────────────

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
}

// ── Cache ─────────────────────────────────────────────────────────────

interface CacheEntry {
    features: ParsedArcGisFeature[];
    timestamp: number;
    etag?: string;
}

const queryCache = new Map<string, CacheEntry>();

function buildCacheKey(
    layerUrl: string,
    where: string,
    definitionExpression: string,
    outFields: string[],
    viewport?: [number, number, number, number]
): string {
    const vp = viewport
        ? `vp:${viewport.map(c => Math.round(c * 1000) / 1000).join(",")}`
        : "";
    return [
        layerUrl,
        `w:${where}`,
        `df:${definitionExpression}`,
        `of:${[...outFields].sort().join(",")}`,
        vp,
    ].join("|");
}

function getFromCache(key: string, cacheMinutes: number): ParsedArcGisFeature[] | null {
    if (cacheMinutes <= 0) return null;
    const entry = queryCache.get(key);
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > cacheMinutes * 60_000) {
        queryCache.delete(key);
        return null;
    }
    return entry.features;
}

function putInCache(key: string, features: ParsedArcGisFeature[]): void {
    queryCache.set(key, { features, timestamp: Date.now() });
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

    // 5. Load layer metadata
    const metadata = await loadLayerMetadata(layerUrl, signal);
    if (!metadata) {
        throw new Error(`Could not load layer metadata from ${layerUrl}`);
    }

    // 6. Verify query capability
    const caps = (metadata.capabilities ?? "").toLowerCase();
    if (!caps.includes("query")) {
        throw new Error(`Layer "${metadata.name}" does not support query operations.`);
    }

    // 7. Determine object-ID field
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

    // 11. Check cache
    const cacheKey = buildCacheKey(layerUrl, where, request.definitionExpression ?? "", outFields, request.viewport);
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
            warnings: ["Returned from cache."],
            sourceUrl: layerUrl,
        };
    }

    // 12. Execute query
    const maxFeatures = request.maxFeatures ?? 1000;
    const requestBatchSize = request.requestBatchSize ?? metadata.maxRecordCount ?? 1000;
    const supportsPagination = metadata.advancedQueryCapabilities?.supportsPagination ?? false;
    const isViewportQuery = request.viewportQuery && request.viewport !== undefined;

    let allFeatures: ParsedArcGisFeature[] = [];
    let requestCount = 0;
    let truncated = false;

    if (isViewportQuery && request.viewport) {
        // Viewport query
        const result = await queryBatch(
            layerUrl, queryFormat, objectIdField,
            where, outFields,
            { offset: 0, limit: Math.min(requestBatchSize, maxFeatures) },
            signal, request.viewport
        );
        requestCount++;
        allFeatures = result.features;
        truncated = result.exceededTransferLimit ?? false;

        if (truncated && supportsPagination && allFeatures.length < maxFeatures) {
            // Paginate remaining
            const paginated = await paginateQuery(
                layerUrl, queryFormat, objectIdField,
                where, outFields,
                allFeatures.length, requestBatchSize, maxFeatures - allFeatures.length,
                signal
            );
            allFeatures = allFeatures.concat(paginated.features);
            requestCount += paginated.requestCount;
            truncated = paginated.truncated;
        }
    } else if (supportsPagination) {
        // Paginated query
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

    // Cache results
    if (request.cacheMinutes && request.cacheMinutes > 0) {
        putInCache(cacheKey, allFeatures);
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

        const parsed = parseArcGisResponse(response, "geojson");
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

    const parsed = parseArcGisResponse(response, "json");
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
    signal?: AbortSignal
): Promise<{ features: ParsedArcGisFeature[]; requestCount: number; truncated: boolean }> {
    const allFeatures: ParsedArcGisFeature[] = [];
    let requestCount = 0;
    let offset = startOffset;
    let truncated = false;
    const seen = new Set<string | number>();

    while (allFeatures.length < maxTotal) {
        const remaining = maxTotal - allFeatures.length;
        const limit = Math.min(batchSize, remaining);

        const result = await queryBatch(layerUrl, format, objectIdField, where, outFields, { offset, limit }, signal);
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

        if (!truncated || result.features.length < limit) break;
    }

    return { features: allFeatures, requestCount, truncated };
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

    const idResponse = await postArcGisForm<{ objectIds?: number[]; objectIdFieldName?: string; error?: any }>(queryUrl, idParams, { signal });
    requestCount++;

    if (idResponse.error || !idResponse.objectIds || idResponse.objectIds.length === 0) {
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
    const seen = new Map<string | number, ParsedArcGisFeature>();
    for (const f of features) {
        const oid = f.objectId ?? f.attributes[objectIdField];
        const key = oid !== undefined ? String(oid) : JSON.stringify(f.attributes);
        if (!seen.has(key)) {
            seen.set(key, f);
        }
    }
    return [...seen.values()];
}
