// ── Map Join Engine ──────────────────────────────────────────────────
// Joins Power BI data rows with ArcGIS service features based on
// configured join keys and normalization rules.
// Supports duplicate policies: first, aggregate, all, error.

import type { DataRow } from "../../data/normalizeData";
import type { MapJoinDefinition } from "../../schema/mapSchema";
import type { ParsedArcGisFeature } from "../arcgis/arcGisResponseParser";
import type { ResolvedMapFeature } from "../model/resolvedMapTypes";
import type { MapJoinDiagnostics } from "../model/resolvedMapTypes";
import { normalizeJoinKey } from "./mapJoinNormalizer";

export interface MapJoinInput {
    powerBiRows: DataRow[];
    powerBiRowIndices: number[];
    powerBiRowKeys: string[];
    powerBiSourceRowIndices?: number[][];
    powerBiSourceRowKeys?: string[][];
    serviceFeatures: ParsedArcGisFeature[];
    definition: MapJoinDefinition;
    layerId: string;
}

export interface MapJoinResult {
    features: ResolvedMapFeature[];
    diagnostics: MapJoinDiagnostics;
}

export function executeMapJoin(input: MapJoinInput): MapJoinResult {
    const { powerBiRows, powerBiRowIndices, powerBiRowKeys, powerBiSourceRowIndices, powerBiSourceRowKeys, serviceFeatures, definition, layerId } = input;
    const normalization = definition.normalization ?? ["trim", "upper"];
    const powerBiDupPolicy = definition.powerBiDuplicatePolicy ?? "aggregate";
    const serviceDupPolicy = definition.serviceDuplicatePolicy ?? "first";

    // ── Build Power BI index ──────────────────────────────────────────
    const powerBiIndex = new Map<string, PowerBiMatch[]>();
    const powerBiKeys = new Set<string>();
    let blankPowerBiKeys = 0;

    for (let i = 0; i < powerBiRows.length; i++) {
        const row = powerBiRows[i];
        const rawValue = row[definition.powerBiField];
        const normalized = normalizeJoinKey(rawValue, normalization);

        if (normalized === null) {
            blankPowerBiKeys++;
            continue;
        }

        powerBiKeys.add(normalized);
        const match: PowerBiMatch = {
            row,
            rowIndices: powerBiSourceRowIndices?.[i] ?? [powerBiRowIndices[i] ?? i],
            rowKeys: powerBiSourceRowKeys?.[i] ?? [powerBiRowKeys[i] ?? `row-${i}`],
            originalJoinValue: rawValue,
        };

        const existing = powerBiIndex.get(normalized) ?? [];
        existing.push(match);
        powerBiIndex.set(normalized, existing);
    }

    // ── Check Power BI duplicate policy ───────────────────────────────
    for (const [key, matches] of powerBiIndex) {
        if (matches.length > 1) {
            if (powerBiDupPolicy === "error") {
                const sample = matches.slice(0, 3).map(m => String(m.originalJoinValue)).join(", ");
                throw new Error(
                    `Duplicate Power BI join keys detected for "${key}" (values: ${sample}). ` +
                    `Set powerBiDuplicatePolicy to "first" or "aggregate" to handle duplicates.`
                );
            }
        }
    }

    // ── Build service index ───────────────────────────────────────────
    const serviceIndex = new Map<string, ParsedArcGisFeature[]>();
    const serviceKeys = new Set<string>();
    let blankServiceKeys = 0;

    for (const feature of serviceFeatures) {
        const rawValue = feature.attributes[definition.serviceField];
        const normalized = normalizeJoinKey(rawValue, normalization);

        if (normalized === null) {
            blankServiceKeys++;
            continue;
        }

        serviceKeys.add(normalized);
        const existing = serviceIndex.get(normalized) ?? [];
        existing.push(feature);
        serviceIndex.set(normalized, existing);
    }

    // ── Check service duplicate policy ────────────────────────────────
    for (const [key, features] of serviceIndex) {
        if (features.length > 1) {
            if (serviceDupPolicy === "error") {
                throw new Error(
                    `Duplicate service join keys detected for "${key}". ` +
                    `Set serviceDuplicatePolicy to "first" or "all" to handle duplicates.`
                );
            }
        }
    }

    // ── Match ─────────────────────────────────────────────────────────
    const features: ResolvedMapFeature[] = [];
    const matchedPowerBiRowIndices = new Set<number>();
    const matchedServiceFeatureIds = new Set<string>();
    const matchedServiceKeys = new Set<string>();
    let suppressedDuplicateCount = 0;
    const matchedPowerBiKeys = new Set<string>();

    for (const [normalizedKey, svcFeatures] of serviceIndex) {
        const powerBiMatches = powerBiIndex.get(normalizedKey);
        if (!powerBiMatches || powerBiMatches.length === 0) continue;

        matchedPowerBiKeys.add(normalizedKey);
        matchedServiceKeys.add(normalizedKey);

        // Apply service duplicate policy
        const effectiveServiceFeatures = serviceDupPolicy === "first"
            ? [svcFeatures[0]]
            : svcFeatures;

        // Track suppressed duplicates
        if (serviceDupPolicy === "first" && svcFeatures.length > 1) {
            suppressedDuplicateCount += svcFeatures.length - 1;
        }

        for (const svcFeature of effectiveServiceFeatures) {
            const svcOid = svcFeature.objectId ?? svcFeature.attributes?.["OBJECTID"];
            if (svcOid !== undefined && svcOid !== null) {
                matchedServiceFeatureIds.add(String(svcOid));
            }

            // Apply Power BI duplicate policy
            let effectivePowerBiMatches: PowerBiMatch[];
            if (powerBiDupPolicy === "first") {
                effectivePowerBiMatches = [powerBiMatches[0]];
            } else {
                effectivePowerBiMatches = powerBiMatches;
            }

            for (const pm of effectivePowerBiMatches) {
                for (const rowIndex of pm.rowIndices) matchedPowerBiRowIndices.add(rowIndex);
            }

            // Aggregate joined fields
            const joinedAttributes = aggregateJoinedFields(
                effectivePowerBiMatches,
                definition.aggregations ?? []
            );

            const geometryType = mapGeometryType(svcFeature);
            const feature: ResolvedMapFeature = {
                id: `${layerId}_${svcFeature.objectId ?? "unknown"}_${normalizedKey}`,
                layerId,
                geometryType,
                geometry: svcFeature.geometry,
                lat: null,
                lon: null,
                serviceObjectId: svcFeature.objectId,
                serviceAttributes: svcFeature.attributes,
                powerBiAttributes: effectivePowerBiMatches[0].row as unknown as Record<string, unknown>,
                powerBiRowIndices: Array.from(new Set(effectivePowerBiMatches.flatMap(match => match.rowIndices))).sort((a, b) => a - b),
                powerBiRowKeys: Array.from(new Set(effectivePowerBiMatches.flatMap(match => match.rowKeys))),
                joinedAttributes,
                selected: false,
            };

            features.push(feature);
        }
    }

    // ── Diagnostics ───────────────────────────────────────────────────
    const unmatchedPowerBiKeys = [...powerBiKeys].filter(k => !matchedPowerBiKeys.has(k));
    const unmatchedServiceKeys = [...serviceKeys].filter(k => !matchedServiceKeys.has(k));
    const duplicatePowerBiKeys = [...powerBiIndex.entries()]
        .filter(([, matches]) => matches.length > 1)
        .map(([key]) => key);
    const duplicateServiceKeys = [...serviceIndex.entries()]
        .filter(([, feats]) => feats.length > 1)
        .map(([key]) => key);

    const diagnostics: MapJoinDiagnostics = {
        powerBiRowCount: powerBiRows.length,
        powerBiDistinctKeyCount: powerBiKeys.size,
        serviceFeatureCount: serviceFeatures.length,
        serviceDistinctKeyCount: serviceKeys.size,
        matchedPowerBiRowCount: matchedPowerBiRowIndices.size,
        matchedServiceFeatureCount: matchedServiceFeatureIds.size,
        suppressedDuplicateServiceCount: suppressedDuplicateCount > 0 ? suppressedDuplicateCount : undefined,
        unmatchedPowerBiKeyCount: unmatchedPowerBiKeys.length,
        unmatchedServiceFeatureCount: unmatchedServiceKeys.reduce(
            (count, key) => count + (serviceIndex.get(key)?.length ?? 0),
            0,
        ),
        blankPowerBiKeyCount: blankPowerBiKeys,
        blankServiceKeyCount: blankServiceKeys,
        duplicatePowerBiKeyCount: duplicatePowerBiKeys.length,
        duplicateServiceKeyCount: duplicateServiceKeys.length,
        matchRate: powerBiKeys.size > 0
            ? matchedPowerBiKeys.size / powerBiKeys.size
            : 0,
        sampleUnmatchedPowerBiKeys: unmatchedPowerBiKeys.slice(0, 10),
        sampleUnmatchedServiceKeys: unmatchedServiceKeys.slice(0, 10),
        sampleDuplicatePowerBiKeys: duplicatePowerBiKeys.slice(0, 10),
        sampleDuplicateServiceKeys: duplicateServiceKeys.slice(0, 10),
    };

    return { features, diagnostics };
}

function mapGeometryType(feature: ParsedArcGisFeature): "point" | "multipoint" | "polyline" | "polygon" | "unknown" {
    if (!feature.geometry) return "unknown";
    switch (feature.geometry.type) {
        case "Point": return "point";
        case "MultiPoint": return "multipoint";
        case "LineString":
        case "MultiLineString": return "polyline";
        case "Polygon":
        case "MultiPolygon": return "polygon";
        default: return "unknown";
    }
}

interface PowerBiMatch {
    row: DataRow;
    rowIndices: number[];
    rowKeys: string[];
    originalJoinValue: unknown;
}

function aggregateJoinedFields(
    matches: PowerBiMatch[],
    aggregations: MapJoinDefinition["aggregations"]
): Record<string, unknown> {
    if (!aggregations || aggregations.length === 0) return {};

    const result: Record<string, unknown> = {};

    for (const agg of aggregations) {
        const rawValues = matches
            .map(m => m.row[agg.field])
            .filter(v => v !== null && v !== undefined);
        const values = rawValues.map(v => Number(v)).filter(n => !isNaN(n));

        switch (agg.aggregation) {
            case "count":
                result[agg.as] = rawValues.length;
                break;
            case "distinctCount":
                result[agg.as] = new Set(rawValues).size;
                break;
            case "sum":
                result[agg.as] = values.reduce((sum, v) => sum + v, 0);
                break;
            case "avg":
                result[agg.as] = values.length > 0
                    ? values.reduce((sum, v) => sum + v, 0) / values.length
                    : 0;
                break;
            case "min":
                result[agg.as] = values.length > 0 ? Math.min(...values) : 0;
                break;
            case "max":
                result[agg.as] = values.length > 0 ? Math.max(...values) : 0;
                break;
            case "first":
                result[agg.as] = rawValues[0];
                break;
            case "last":
                result[agg.as] = rawValues[rawValues.length - 1];
                break;
        }
    }

    return result;
}
