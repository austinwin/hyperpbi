// ── ArcGIS Query Planner ─────────────────────────────────────────────
// Plans batch queries for ArcGIS feature services based on strategy.

import type { ArcGisLayerMetadata } from "./arcGisServiceTypes";
import { buildInWhereClause, inferArcGisFieldType } from "./arcGisWhereBuilder";
import type { ArcGisFieldType } from "./arcGisWhereBuilder";

export interface ArcGisQueryPlan {
    strategy: "joinKeyBatches" | "objectIdBatches" | "pagination" | "viewport";
    batches: ArcGisQueryBatch[];
    outFields: string[];
    returnGeometry: boolean;
    outSpatialReference: number;
    estimatedRequestCount: number;
}

export interface ArcGisQueryBatch {
    where: string;
    resultOffset?: number;
    resultRecordCount?: number;
    geometry?: string;
    geometryType?: string;
    inSR?: number;
}

const BATCH_SIZE_OBJECTIDS = 500;
const BATCH_SIZE_JOIN_KEYS = 200;

export function planJoinKeyQuery(
    metadata: ArcGisLayerMetadata,
    joinFieldName: string,
    joinValues: unknown[],
    requiredFields: string[]
): ArcGisQueryPlan {
    const fieldInfo = metadata.fields?.find(f => f.name === joinFieldName);
    const fieldType: ArcGisFieldType = fieldInfo
        ? inferArcGisFieldType(fieldInfo.type)
        : "string";

    const deduped = [...new Set(joinValues.filter(v => v !== null && v !== undefined && v !== ""))];

    // Build minimal outFields
    const objectIdField = metadata.objectIdField ?? "OBJECTID";
    const outFields = [...new Set([objectIdField, joinFieldName, ...requiredFields])];

    // Split into batches
    const batches: ArcGisQueryBatch[] = [];
    for (let i = 0; i < deduped.length; i += BATCH_SIZE_JOIN_KEYS) {
        const batchValues = deduped.slice(i, i + BATCH_SIZE_JOIN_KEYS);
        const where = buildInWhereClause(joinFieldName, fieldType, batchValues);
        batches.push({ where });
    }

    return {
        strategy: "joinKeyBatches",
        batches,
        outFields,
        returnGeometry: true,
        outSpatialReference: 4326,
        estimatedRequestCount: batches.length,
    };
}

export function planObjectIdQuery(
    metadata: ArcGisLayerMetadata,
    objectIds: number[],
    requiredFields: string[]
): ArcGisQueryPlan {
    const objectIdField = metadata.objectIdField ?? "OBJECTID";
    const outFields = [...new Set([objectIdField, ...requiredFields])];

    const batches: ArcGisQueryBatch[] = [];
    const oidType: ArcGisFieldType = "oid";

    for (let i = 0; i < objectIds.length; i += BATCH_SIZE_OBJECTIDS) {
        const batchIds = objectIds.slice(i, i + BATCH_SIZE_OBJECTIDS);
        const where = buildInWhereClause(objectIdField, oidType, batchIds);
        batches.push({ where });
    }

    return {
        strategy: "objectIdBatches",
        batches,
        outFields,
        returnGeometry: true,
        outSpatialReference: 4326,
        estimatedRequestCount: batches.length,
    };
}

export function planReferenceQuery(
    metadata: ArcGisLayerMetadata,
    requiredFields: string[],
    bounds?: { west: number; south: number; east: number; north: number }
): ArcGisQueryPlan {
    const objectIdField = metadata.objectIdField ?? "OBJECTID";
    const outFields = [...new Set([objectIdField, ...requiredFields])];
    const maxRecordCount = metadata.maxRecordCount ?? 1000;

    let where = "1=1";

    if (bounds) {
        const { west, south, east, north } = bounds;
        // Simple envelope spatial filter
        where = `1=1`;
        // Note: full spatial filter would use geometry parameter, kept simple for now
    }

    const batches: ArcGisQueryBatch[] = [{
        where,
        resultOffset: 0,
        resultRecordCount: Math.min(maxRecordCount, 2000),
    }];

    return {
        strategy: "viewport",
        batches,
        outFields,
        returnGeometry: true,
        outSpatialReference: 4326,
        estimatedRequestCount: 1,
    };
}
