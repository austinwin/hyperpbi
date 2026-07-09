// ── Map Join Engine ──────────────────────────────────────────────────
// Joins Power BI data rows with ArcGIS service features based on
// configured join keys and normalization rules.

import type { DataRow } from "../../data/normalizeData";
import type { MapJoinDefinition } from "../../schema/mapSchema";
import type { ParsedArcGisFeature } from "../arcgis/arcGisResponseParser";
import type { ResolvedMapFeature } from "../model/resolvedMapTypes";
import type { MapJoinDiagnostics } from "../model/resolvedMapTypes";
import { normalizeJoinKey } from "./mapJoinNormalizer";

export interface MapJoinInput {
    powerBiRows: DataRow[];
    powerBiRowKeys: string[];
    serviceFeatures: ParsedArcGisFeature[];
    definition: MapJoinDefinition;
    layerId: string;
}

export interface MapJoinResult {
    features: ResolvedMapFeature[];
    diagnostics: MapJoinDiagnostics;
}

export function executeMapJoin(input: MapJoinInput): MapJoinResult {
    const { powerBiRows, powerBiRowKeys, serviceFeatures, definition, layerId } = input;
    const normalization = definition.normalization ?? ["trim", "upper"];

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
            rowIndex: i,
            rowKey: powerBiRowKeys[i] ?? `row-${i}`,
            originalJoinValue: rawValue,
        };

        const existing = powerBiIndex.get(normalized) ?? [];
        existing.push(match);
        powerBiIndex.set(normalized, existing);
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

    // ── Match ─────────────────────────────────────────────────────────
    const features: ResolvedMapFeature[] = [];
    let matchedPowerBiRowCount = 0;
    let matchedServiceFeatureCount = 0;
    const matchedPowerBiKeys = new Set<string>();

    for (const [normalizedKey, svcFeatures] of serviceIndex) {
        const powerBiMatches = powerBiIndex.get(normalizedKey);
        if (!powerBiMatches || powerBiMatches.length === 0) continue;

        matchedPowerBiKeys.add(normalizedKey);
        matchedServiceFeatureCount++;

        for (const svcFeature of svcFeatures) {
            matchedPowerBiRowCount += powerBiMatches.length;

            // Aggregate joined fields
            const joinedAttributes = aggregateJoinedFields(
                powerBiMatches,
                definition.aggregations ?? []
            );

            const feature: ResolvedMapFeature = {
                id: `${layerId}_${svcFeature.objectId ?? "unknown"}_${normalizedKey}`,
                layerId,
                geometryType: "unknown",
                geometry: svcFeature.geometry,
                lat: null,
                lon: null,
                serviceObjectId: svcFeature.objectId,
                serviceAttributes: svcFeature.attributes,
                powerBiAttributes: powerBiMatches[0].row as unknown as Record<string, unknown>,
                powerBiRowIndices: powerBiMatches.map(m => m.rowIndex),
                powerBiRowKeys: powerBiMatches.map(m => m.rowKey),
                joinedAttributes,
                selected: false,
            };

            features.push(feature);
        }
    }

    // ── Diagnostics ───────────────────────────────────────────────────
    const unmatchedPowerBiKeys = [...powerBiKeys].filter(k => !matchedPowerBiKeys.has(k));
    const duplicatePowerBiKeys = [...powerBiIndex.entries()]
        .filter(([, matches]) => matches.length > 1)
        .map(([key]) => key);
    const duplicateServiceKeys = [...serviceIndex.entries()]
        .filter(([, features]) => features.length > 1)
        .map(([key]) => key);

    const diagnostics: MapJoinDiagnostics = {
        powerBiRowCount: powerBiRows.length,
        powerBiDistinctKeyCount: powerBiKeys.size,
        serviceFeatureCount: serviceFeatures.length,
        serviceDistinctKeyCount: serviceKeys.size,
        matchedPowerBiRowCount,
        matchedServiceFeatureCount,
        unmatchedPowerBiKeyCount: unmatchedPowerBiKeys.length,
        unmatchedServiceFeatureCount: serviceFeatures.length - matchedServiceFeatureCount,
        blankPowerBiKeyCount: blankPowerBiKeys,
        blankServiceKeyCount: blankServiceKeys,
        duplicatePowerBiKeyCount: duplicatePowerBiKeys.length,
        duplicateServiceKeyCount: duplicateServiceKeys.length,
        matchRate: powerBiKeys.size > 0
            ? matchedPowerBiKeys.size / powerBiKeys.size
            : 0,
        sampleUnmatchedPowerBiKeys: unmatchedPowerBiKeys.slice(0, 10),
        sampleDuplicatePowerBiKeys: duplicatePowerBiKeys.slice(0, 10),
        sampleDuplicateServiceKeys: duplicateServiceKeys.slice(0, 10),
    };

    return { features, diagnostics };
}

interface PowerBiMatch {
    row: DataRow;
    rowIndex: number;
    rowKey: string;
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
