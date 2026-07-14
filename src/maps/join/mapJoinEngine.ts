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
import { aggregateMapJoinValues } from "./mapJoinAggregation";
import type { MapJoinAggregationDiagnostic } from "../model/resolvedMapTypes";

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
    /** User-facing bounded warnings requested by the join policy. */
    warnings: string[];
    /** Reserved for non-throwing severe policy results. */
    errors: string[];
}

export function executeMapJoin(input: MapJoinInput): MapJoinResult {
    const { powerBiRows, powerBiRowIndices, powerBiRowKeys, powerBiSourceRowIndices, powerBiSourceRowKeys, serviceFeatures, definition, layerId } = input;
    const normalization = definition.normalization ?? ["trim", "upper"];
    const powerBiDupPolicy = definition.powerBiDuplicatePolicy ?? "aggregate";
    const serviceDupPolicy = definition.serviceDuplicatePolicy ?? "first";
    const cardinality = definition.cardinality ?? "manyToOne";
    const unmatchedPolicy = definition.unmatchedPolicy ?? "ignore";

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
    const aggregationDiagnostics = new Map<string, MapJoinAggregationDiagnostic>();

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
            const aggregated = aggregateJoinedFields(
                effectivePowerBiMatches,
                definition.aggregations ?? []
            );
            const joinedAttributes = aggregated.attributes;
            for (const diagnostic of aggregated.diagnostics) {
                const existing = aggregationDiagnostics.get(diagnostic.alias);
                aggregationDiagnostics.set(diagnostic.alias, existing ? {
                    ...existing,
                    inputCount: existing.inputCount + diagnostic.inputCount,
                    validCount: existing.validCount + diagnostic.validCount,
                    blankCount: existing.blankCount + diagnostic.blankCount,
                    discardedCount: existing.discardedCount + diagnostic.discardedCount,
                } : diagnostic);
            }

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

    const powerBiCardinalityViolations = cardinality === "oneToOne"
        ? duplicatePowerBiKeys
        : [];
    const serviceCardinalityViolations = duplicateServiceKeys;

    const diagnostics: MapJoinDiagnostics = {
        cardinality,
        cardinalityValid:
            powerBiCardinalityViolations.length === 0 &&
            serviceCardinalityViolations.length === 0,
        powerBiCardinalityViolationCount: powerBiCardinalityViolations.length,
        serviceCardinalityViolationCount: serviceCardinalityViolations.length,
        samplePowerBiCardinalityViolations: powerBiCardinalityViolations.slice(0, 10),
        sampleServiceCardinalityViolations: serviceCardinalityViolations.slice(0, 10),
        unmatchedPolicy,
        detailedDiagnosticsRequested: unmatchedPolicy === "diagnose",
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
        aggregationDiagnostics: [...aggregationDiagnostics.values()],
    };

    const warnings: string[] = [];
    if (unmatchedPolicy === "warn" &&
        (diagnostics.unmatchedPowerBiKeyCount > 0 || diagnostics.unmatchedServiceFeatureCount > 0)) {
        const matchedKeyCount = diagnostics.powerBiDistinctKeyCount - diagnostics.unmatchedPowerBiKeyCount;
        warnings.push(
            `Layer “${layerId}” matched ${matchedKeyCount} of ${diagnostics.powerBiDistinctKeyCount} normalized Power BI keys; ` +
            `${diagnostics.unmatchedPowerBiKeyCount} Power BI keys and ${diagnostics.unmatchedServiceFeatureCount} service features were unmatched.`
        );
    }
    if (!diagnostics.cardinalityValid) {
        if (diagnostics.powerBiCardinalityViolationCount)
            warnings.push(
                `MAP_JOIN_CARDINALITY_POWERBI_VIOLATION: ${diagnostics.powerBiCardinalityViolationCount} normalized Power BI keys violate ${cardinality} cardinality.`
            );
        if (diagnostics.serviceCardinalityViolationCount)
            warnings.push(
                `MAP_JOIN_CARDINALITY_SERVICE_VIOLATION: ${diagnostics.serviceCardinalityViolationCount} normalized service keys violate ${cardinality} cardinality.`
            );
    }
    const discardedCount = diagnostics.aggregationDiagnostics.reduce(
        (sum, item) => sum + item.discardedCount,
        0,
    );
    if (discardedCount > 0)
        warnings.push(
            `Map join aggregations discarded ${discardedCount} nonnumeric or non-finite value${discardedCount === 1 ? "" : "s"}.`
        );

    return { features, diagnostics, warnings, errors: [] };
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
): { attributes: Record<string, unknown>; diagnostics: MapJoinAggregationDiagnostic[] } {
    if (!aggregations || aggregations.length === 0) return { attributes: {}, diagnostics: [] };

    const result: Record<string, unknown> = {};
    const diagnostics: MapJoinAggregationDiagnostic[] = [];

    for (const agg of aggregations) {
        const aggregation = aggregateMapJoinValues(
            agg,
            matches.map(m => m.row[agg.field]),
        );
        result[agg.as] = aggregation.value;
        diagnostics.push(aggregation.diagnostic);
    }

    return { attributes: result, diagnostics };
}
