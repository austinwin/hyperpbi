// ── Map Source Resolver ──────────────────────────────────────────────
// Resolves one map layer against one explicit logical-dataset view.

import type { MapLayerDefinition, PowerBiMapLayerSource, MapGeometryType } from "../../schema/mapSchema";
import type { ResolvedMapLayer, ResolvedMapFeature, MapLayerDiagnosticIssue } from "../model/resolvedMapTypes";
import type { NormalizedMapFeature, MapBindingKeys, DataRow, NormalizedField } from "../../data/normalizeData";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import type { GeocodeCacheEntry } from "../../providers/providerTypes";
import { resolveRenderer } from "../renderers/mapRendererResolver";
import { matchesFilter } from "../../data/filtering";
import { externalFilterTargetFor } from "../../powerbi/externalFilters";

export interface MapSourceContext {
    /** Rows in this layer's effective dataset after dashboard interaction filtering. */
    rows: DataRow[];
    /** Positions in the evaluated logical dataset. */
    rowIndices: number[];
    /** Stable logical-dataset row keys. */
    rowKeys: string[];
    /** Original Power BI data-view rows contributing to each logical row. */
    sourceRowIndices?: number[][];
    /** Original Power BI row keys/identities contributing to each logical row. */
    sourceRowKeys?: string[][];
    fields: Record<string, NormalizedField>;
    datasetName?: string;
    datasetFound?: boolean;
    totalRows?: number;
    geocodeCache?: Record<string, unknown>;
    /** Retained on the context shape for callers; explicit layers never inherit it. */
    runtimeBindings?: Partial<MapBindingKeys>;
    legacyCompatibility?: boolean;
    layerPath?: string;
}

const issue = (code: MapLayerDiagnosticIssue["code"], severity: MapLayerDiagnosticIssue["severity"], message: string, path?: string, details?: Record<string, unknown>): MapLayerDiagnosticIssue => ({ code, severity, message, path, details });
const bounded = <T,>(values: T[], limit = 12) => values.slice(0, limit);

export function effectiveMapLayerDataset(layer: Pick<MapLayerDefinition, "dataset">, mapDataset?: string): string {
    return layer.dataset ?? mapDataset ?? "powerbi";
}

export function resolvePowerBiLayer(layer: MapLayerDefinition, context: MapSourceContext): ResolvedMapLayer {
    const started = globalThis.performance?.now?.() ?? Date.now();
    const source = layer.source as PowerBiMapLayerSource;
    const datasetName = context.datasetName ?? layer.dataset ?? "powerbi";
    const layerPath = context.layerPath ?? `/layers/${layer.id}`;
    const issues: MapLayerDiagnosticIssue[] = [];

    if (context.datasetFound === false) {
        const message = `Logical dataset “${datasetName}” is not available for layer “${layer.name}”.`;
        return createEmptyLayer(layer, datasetName, [issue("MAP_LAYER_DATASET_NOT_FOUND", "error", message, `${layerPath}/dataset`)], {
            totalInputRows: 0,
            sourceResolutionMs: (globalThis.performance?.now?.() ?? Date.now()) - started,
        });
    }

    const configured = source.bindings ?? {};
    for (const [name, reference] of Object.entries(configured)) {
        if (name === "tooltip" || name === "details") continue;
        if (typeof reference === "string" && !context.fields[reference]) issues.push(issue(
            "MAP_LAYER_FIELD_NOT_FOUND", "error",
            `Binding “${name}” references field “${reference}”, which is not in dataset “${datasetName}”.`,
            `${layerPath}/source/bindings/${name}`,
            { field: reference, dataset: datasetName },
        ));
        if (["latitude", "longitude", "x", "y", "size"].includes(name) && typeof reference === "string") {
            const field = context.fields[reference];
            if (field?.dataType && field.dataType !== "number" && field.dataType !== "unknown") issues.push(issue(
                "MAP_LAYER_NUMERIC_FIELD_REQUIRED", "error",
                `Binding “${name}” requires a numeric field, but “${reference}” is ${field.dataType}.`,
                `${layerPath}/source/bindings/${name}`,
                { field: reference, dataType: field.dataType, dataset: datasetName },
            ));
        }
    }

    const validateField = (reference: string | undefined, path: string, numeric = false): void => {
        if (!reference) return;
        const field = context.fields[reference];
        if (!field) {
            issues.push(issue("MAP_LAYER_FIELD_NOT_FOUND", "error", `Field “${reference}” is not in dataset “${datasetName}”.`, path, { field: reference, dataset: datasetName }));
            return;
        }
        if (numeric && field.dataType && field.dataType !== "number" && field.dataType !== "unknown") issues.push(issue(
            "MAP_LAYER_NUMERIC_FIELD_REQUIRED", "error", `Field “${reference}” must be numeric, but it is ${field.dataType}.`, path, { field: reference, dataType: field.dataType, dataset: datasetName },
        ));
    };
    const renderer = layer.renderer;
    if (renderer && "field" in renderer && (renderer.fieldSource ?? "powerbi") === "powerbi") validateField(renderer.field, `${layerPath}/renderer/field`, ["classBreaks", "continuousColor", "proportionalSize"].includes(renderer.type) || renderer.type === "densityGrid" && ["sum", "avg"].includes(renderer.statistic ?? "count"));
    if (renderer?.type === "heatmap" && (renderer.fieldSource ?? "powerbi") === "powerbi") validateField(renderer.weightField, `${layerPath}/renderer/weightField`, true);
    if (renderer?.type === "cluster") validateField(renderer.aggregateField, `${layerPath}/renderer/aggregateField`, renderer.clusterLabel === "sum");
    if (layer.labels && (layer.labels.fieldSource ?? "powerbi") === "powerbi") validateField(layer.labels.field, `${layerPath}/labels/field`);
    layer.popup?.fields?.forEach((field, index) => { if ((field.fieldSource ?? "powerbi") === "powerbi") validateField(field.field, `${layerPath}/popup/fields/${index}/field`); });
    layer.tooltip?.fields?.forEach((field, index) => { if ((field.fieldSource ?? "powerbi") === "powerbi") validateField(field.field, `${layerPath}/tooltip/fields/${index}/field`); });
    validateField(layer.join?.powerBiField, `${layerPath}/join/powerBiField`);
    validateField(layer.visibility?.conditionField, `${layerPath}/visibility/conditionField`);
    (Array.isArray(layer.filter) ? layer.filter : layer.filter ? [layer.filter] : []).forEach((filter, index) => validateField(filter.field, `${layerPath}/filter/${index}/field`));
    validateField(layer.interaction?.field, `${layerPath}/interaction/field`);
    if (layer.interaction?.externalMode === "filter" && layer.interaction.field) {
        const field = context.fields[layer.interaction.field];
        if (field && !externalFilterTargetFor(field)) issues.push(issue(
            "MAP_LAYER_EXTERNAL_FILTER_UNSUPPORTED", "error", `Field “${field.key}” has no Power BI model-column target for external filtering. Use selection/highlight or a group-by source field.`, `${layerPath}/interaction/field`, { field: field.key, dataset: datasetName, origin: field.origin },
        ));
    }

    const mapData = normalizeMapBindings(
        context.rows,
        context.fields,
        configured,
        (context.geocodeCache as Record<string, GeocodeCacheEntry>) ?? {},
        context.rowKeys,
    );

    if (mapData.mode === "none") issues.push(issue(
        "MAP_LAYER_BINDING_INCOMPLETE", "error",
        `Layer “${layer.name}” could not resolve geometry, a coordinate pair, or an address in dataset “${datasetName}”.`,
        `${layerPath}/source/bindings`,
        { dataset: datasetName, configuredBindings: configured },
    ));

    let normalizedFeatures: NormalizedMapFeature[];
    let layerValueMatched: boolean | undefined;
    if (source.layerValue !== undefined) {
        const target = mapData.layers.find(candidate => candidate.name === source.layerValue);
        layerValueMatched = Boolean(target);
        if (!target) {
            const availableValues = bounded(mapData.layers.map(candidate => candidate.name));
            const message = `Layer value “${source.layerValue}” was not found. No unrelated layer value was substituted.`;
            return createEmptyLayer(layer, datasetName, [
                ...issues,
                issue("MAP_LAYER_VALUE_NOT_FOUND", "error", message, `${layerPath}/source/layerValue`, { requested: source.layerValue, availableValues }),
            ], {
                resolvedLocationMode: mapData.mode,
                resolvedBindings: mapData.bindings as unknown as Record<string, string | string[] | undefined>,
                totalInputRows: context.rows.length,
                filteredRowCount: Math.max(0, (context.totalRows ?? context.rows.length) - context.rows.length),
                layerValueRequested: source.layerValue,
                layerValueMatched: false,
                sourceResolutionMs: (globalThis.performance?.now?.() ?? Date.now()) - started,
            });
        }
        normalizedFeatures = target.features;
    } else {
        // A declared layer without layerValue represents its complete dataset.
        // Grouping metadata must never make the first normalized group win.
        normalizedFeatures = mapData.layers.flatMap(candidate => candidate.features);
    }

    const filters = layer.filter ? (Array.isArray(layer.filter) ? layer.filter : [layer.filter]) : [];
    if (filters.length) normalizedFeatures = normalizedFeatures.filter(feature => filters.every(filter => matchesFilter(feature.row[filter.field], filter.operator, filter.value)));
    if (layer.visibility?.conditionField && layer.visibility.conditionValues?.length) {
        const accepted = layer.visibility.conditionValues;
        normalizedFeatures = normalizedFeatures.filter(feature => accepted.some(value => Object.is(value, feature.row[layer.visibility!.conditionField!]))) ;
    }

    const requestedCount = normalizedFeatures.length;
    const featureLimit = Math.max(0, Math.floor(layer.performance?.maxFeatures ?? 10_000));
    if (requestedCount > featureLimit) {
        normalizedFeatures = normalizedFeatures.slice(0, featureLimit);
        issues.push(issue("MAP_LAYER_FEATURE_LIMIT", "warning", `Layer “${layer.name}” was deterministically limited to ${featureLimit.toLocaleString()} of ${requestedCount.toLocaleString()} valid features.`, `${layerPath}/performance/maxFeatures`, { requestedCount, featureLimit }));
    }

    const features: ResolvedMapFeature[] = normalizedFeatures.map(feature => materializeFeature(feature, layer, context));
    const geometry = geometryAnalysis(features);
    if (geometry.type === "mixed") issues.push(issue(
        "MAP_LAYER_MIXED_GEOMETRY", "warning",
        `Layer “${layer.name}” contains mixed geometry types. Supported features render without relabeling the complete layer as its first row type.`,
        `${layerPath}/source/bindings/geometry`,
        { counts: geometry.counts },
    ));

    const rendererStarted = globalThis.performance?.now?.() ?? Date.now();
    const resolvedRenderer = layer.renderer ? resolveRenderer(layer.renderer, features) : { type: "simple" as const, symbol: {} };
    const rendererCalculationMs = (globalThis.performance?.now?.() ?? Date.now()) - rendererStarted;
    const counts = mapData.locationCounts;
    const warnings = [...mapData.warnings, ...issues.filter(item => item.severity !== "info").map(item => item.message)];

    return {
        id: layer.id,
        name: layer.name,
        sourceType: "powerbi",
        geometryType: geometry.type,
        visible: layer.visible ?? true,
        opacity: layer.opacity ?? 1,
        order: layer.order ?? 0,
        groupId: layer.groupId,
        datasetName,
        features,
        renderer: resolvedRenderer,
        labels: layer.labels ? {
            enabled: layer.labels.enabled ?? false,
            field: layer.labels.field,
            fieldSource: layer.labels.fieldSource,
            template: layer.labels.template,
            placement: layer.labels.placement ?? "center",
            minZoom: maxDefined(layer.labels.minZoom, layer.visibility?.minZoom),
            maxZoom: minDefined(layer.labels.maxZoom, layer.visibility?.maxZoom),
            color: layer.labels.color ?? "#333333",
            size: layer.labels.size ?? 12,
            weight: layer.labels.weight ?? "normal",
            haloColor: layer.labels.haloColor,
            haloSize: layer.labels.haloSize,
            backgroundColor: layer.labels.backgroundColor,
            padding: layer.labels.padding,
            collision: layer.labels.collision ?? "none",
            maxLabels: layer.labels.maxLabels,
        } : undefined,
        popup: layer.popup ? {
            enabled: layer.popup.enabled ?? true,
            title: layer.popup.title,
            fields: (layer.popup.fields ?? []).map(field => ({ ...field, fieldSource: field.fieldSource ?? "powerbi", display: field.display ?? "text" })),
            actions: (layer.popup.actions ?? []).map(action => ({ ...action })),
            html: layer.popup.html,
        } : undefined,
        tooltip: layer.tooltip ? {
            enabled: layer.tooltip.enabled ?? true,
            template: layer.tooltip.template,
            fields: (layer.tooltip.fields ?? []).map(field => ({ ...field, fieldSource: field.fieldSource ?? "powerbi", display: "text" })),
        } : undefined,
        interaction: layer.interaction,
        legend: layer.legend,
        visibility: layer.visibility,
        diagnostics: {
            featureCount: features.length,
            requestCount: 0,
            loading: false,
            sourceType: "powerbi",
            geometryType: geometry.type,
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: Array.from(new Set(warnings)),
            issues,
            effectiveDataset: datasetName,
            resolvedLocationMode: mapData.mode,
            resolvedBindings: mapData.bindings as unknown as Record<string, string | string[] | undefined>,
            geometryTypeCounts: geometry.counts,
            totalInputRows: counts?.totalInputRows ?? context.rows.length,
            filteredRowCount: Math.max(0, (context.totalRows ?? context.rows.length) - context.rows.length) + (requestedCount - features.length),
            validFeatureCount: features.length,
            incompletePairCount: counts?.incompletePairCount ?? 0,
            nonNumericCount: counts?.nonNumericCount ?? 0,
            outOfRangeCount: counts?.outOfRangeCount ?? 0,
            geometryParseFailureCount: counts?.geometryParseFailureCount ?? 0,
            layerValueRequested: source.layerValue,
            layerValueMatched,
            rendererFieldSource: layer.renderer && "fieldSource" in layer.renderer ? layer.renderer.fieldSource ?? "powerbi" : undefined,
            labelFieldSource: layer.labels?.fieldSource ?? (layer.labels?.field ? "powerbi" : undefined),
            sourceResolutionMs: (globalThis.performance?.now?.() ?? Date.now()) - started,
            rendererCalculationMs,
        },
        loading: false,
    };
}

function materializeFeature(feature: NormalizedMapFeature, layer: MapLayerDefinition, context: MapSourceContext): ResolvedMapFeature {
    const logicalIndex = feature.rowIndex;
    const sourceIndices = context.sourceRowIndices?.[logicalIndex]?.filter(index => index >= 0)
        ?? [context.rowIndices[logicalIndex] ?? logicalIndex].filter(index => index >= 0);
    const sourceKeys = context.sourceRowKeys?.[logicalIndex]?.filter(Boolean)
        ?? [context.rowKeys[logicalIndex] ?? feature.rowKey];
    const powerBiAttributes: Record<string, unknown> = { ...(feature.row as Record<string, unknown>) };
    if (context.legacyCompatibility) {
        powerBiAttributes.__color__ = feature.colorValue;
        powerBiAttributes.__size__ = feature.sizeValue;
    }
    return {
        id: feature.id,
        layerId: layer.id,
        geometryType: featureTypeToGeoType(feature.type),
        geometry: feature.geometry,
        lat: feature.lat,
        lon: feature.lon,
        serviceAttributes: {},
        powerBiAttributes,
        powerBiRowIndices: [...new Set(sourceIndices)].sort((a, b) => a - b),
        powerBiRowKeys: [...new Set(sourceKeys)],
        joinedAttributes: {},
        renderValue: feature.colorValue,
        sizeValue: feature.sizeValue ?? undefined,
        selected: false,
        row: feature.row,
        rowIndex: sourceIndices[0],
        rowKey: sourceKeys[0],
    };
}

export function geometryAnalysis(features: readonly ResolvedMapFeature[]): { type: MapGeometryType; counts: Partial<Record<MapGeometryType, number>> } {
    const counts: Partial<Record<MapGeometryType, number>> = {};
    for (const feature of features) counts[feature.geometryType] = (counts[feature.geometryType] ?? 0) + 1;
    const valid = (Object.keys(counts) as MapGeometryType[]).filter(type => type !== "unknown" && (counts[type] ?? 0) > 0);
    return { type: valid.length === 0 ? "unknown" : valid.length === 1 ? valid[0] : "mixed", counts };
}

function featureTypeToGeoType(type: string): "point" | "multipoint" | "polyline" | "polygon" | "unknown" {
    switch (type) {
        case "point": return "point";
        case "line": return "polyline";
        case "polygon": return "polygon";
        default: return "unknown";
    }
}

function createEmptyLayer(layer: MapLayerDefinition, datasetName: string, issues: MapLayerDiagnosticIssue[], diagnostics: Partial<ResolvedMapLayer["diagnostics"]> = {}): ResolvedMapLayer {
    const warnings = issues.filter(item => item.severity !== "info").map(item => item.message);
    return {
        id: layer.id,
        name: layer.name,
        sourceType: "powerbi",
        geometryType: "unknown",
        visible: layer.visible ?? true,
        opacity: layer.opacity ?? 1,
        order: layer.order ?? 0,
        groupId: layer.groupId,
        datasetName,
        features: [],
        renderer: { type: "simple", symbol: {} },
        interaction: layer.interaction,
        legend: layer.legend,
        visibility: layer.visibility,
        diagnostics: {
            featureCount: 0,
            requestCount: 0,
            loading: false,
            sourceType: "powerbi",
            geometryType: "unknown",
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings,
            issues,
            effectiveDataset: datasetName,
            validFeatureCount: 0,
            ...diagnostics,
        },
        loading: false,
    };
}

function maxDefined(...values: Array<number | undefined>): number | undefined { const present = values.filter((value): value is number => value !== undefined); return present.length ? Math.max(...present) : undefined; }
function minDefined(...values: Array<number | undefined>): number | undefined { const present = values.filter((value): value is number => value !== undefined); return present.length ? Math.min(...present) : undefined; }
