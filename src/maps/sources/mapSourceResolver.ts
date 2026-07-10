// ── Map Source Resolver ──────────────────────────────────────────────
// Resolves map layer sources to their resolved form at runtime.

import type { MapLayerDefinition, PowerBiMapLayerSource } from "../../schema/mapSchema";
import type { ResolvedMapLayer, ResolvedMapFeature } from "../model/resolvedMapTypes";
import type { NormalizedMapFeature, MapBindingKeys, DataRow, NormalizedField } from "../../data/normalizeData";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import type { GeocodeCacheEntry } from "../../providers/providerTypes";
import { resolveRenderer } from "../renderers/mapRendererResolver";

export interface MapSourceContext {
    /** Filtered component rows */
    rows: DataRow[];
    /** Original source-row indices for each row (maps to sourceRows index) */
    rowIndices: number[];
    /** Stable source row keys */
    rowKeys: string[];
    /** Field metadata */
    fields: Record<string, NormalizedField>;
    /** Runtime map bindings */
    runtimeBindings?: Partial<MapBindingKeys>;
    /** Geocode cache entries */
    geocodeCache?: Record<string, unknown>;
}

export function resolvePowerBiLayer(
    layer: MapLayerDefinition,
    context: MapSourceContext
): ResolvedMapLayer {
    const source = layer.source as PowerBiMapLayerSource;
    const bindings: Partial<MapBindingKeys> = {
        ...context.runtimeBindings,
        ...(source.bindings ?? {}),
    };

    const mapData = normalizeMapBindings(
        context.rows,
        context.fields,
        bindings,
        (context.geocodeCache as Record<string, GeocodeCacheEntry>) ?? {},
        context.rowKeys
    );

    // Filter by layerValue if configured
    let targetLayer = source.layerValue
        ? mapData.layers.find(l => l.name === source.layerValue) ?? mapData.layers[0]
        : mapData.layers[0];

    if (!targetLayer) {
        return createEmptyLayer(layer.id, layer.name, "powerbi");
    }

    const features: ResolvedMapFeature[] = targetLayer.features.map((f: NormalizedMapFeature) => {
        // Use the original source index stored during normalization, not the filtered index
        const sourceRowIndex = context.rowIndices[f.rowIndex] ?? f.rowIndex;
        const sourceRowKey = context.rowKeys[f.rowIndex] ?? f.rowKey;

        // Materialize legacy __color__ and __size__ into powerBiAttributes
        const powerBiAttributes: Record<string, unknown> = {
            ...(f.row as unknown as Record<string, unknown>),
            __color__: f.colorValue,
            __size__: f.sizeValue,
        };

        return {
            id: f.id,
            layerId: layer.id,
            geometryType: featureTypeToGeoType(f.type) as ResolvedMapFeature["geometryType"],
            geometry: f.geometry,
            lat: f.lat,
            lon: f.lon,
            serviceObjectId: undefined,
            serviceAttributes: {},
            powerBiAttributes,
            powerBiRowIndices: [sourceRowIndex],
            powerBiRowKeys: [sourceRowKey],
            joinedAttributes: {},
            renderValue: f.colorValue,
            sizeValue: f.sizeValue ?? undefined,
            labelValue: undefined,
            selected: false,
            row: f.row,
            rowIndex: sourceRowIndex,
            rowKey: sourceRowKey,
        };
    });

    // Resolve the configured renderer through the centralized resolver
    const resolvedRenderer = layer.renderer
        ? resolveRenderer(layer.renderer, features)
        : { type: "simple" as const, symbol: {} };

    return {
        id: layer.id,
        name: layer.name,
        sourceType: "powerbi",
        geometryType: determineGeoType(features) as ResolvedMapLayer["geometryType"],
        visible: layer.visible ?? true,
        opacity: layer.opacity ?? 1,
        order: layer.order ?? 0,
        features,
        renderer: resolvedRenderer,
        labels: layer.labels ? {
            enabled: layer.labels.enabled ?? false,
            field: layer.labels.field,
            fieldSource: layer.labels.fieldSource,
            template: layer.labels.template,
            placement: layer.labels.placement ?? "center",
            minZoom: layer.labels.minZoom,
            maxZoom: layer.labels.maxZoom,
            color: layer.labels.color ?? "#333333",
            size: layer.labels.size ?? 12,
            weight: layer.labels.weight ?? "normal",
            haloColor: layer.labels.haloColor,
            haloSize: layer.labels.haloSize,
            collision: layer.labels.collision ?? "none",
            maxLabels: layer.labels.maxLabels,
        } : undefined,
        popup: layer.popup ? {
            enabled: layer.popup.enabled ?? true,
            title: layer.popup.title,
            fields: (layer.popup.fields ?? []).map(f => ({
                field: f.field,
                fieldSource: f.fieldSource ?? "powerbi",
                label: f.label,
                format: f.format,
                display: f.display ?? "text",
            })),
            actions: (layer.popup.actions ?? []).map(a => ({
                id: a.id,
                label: a.label,
                icon: a.icon,
                uiAction: a.uiAction,
            })),
            html: layer.popup.html,
        } : undefined,
        tooltip: layer.tooltip ? {
            enabled: layer.tooltip.enabled ?? true,
            template: layer.tooltip.template,
            fields: (layer.tooltip.fields ?? []).map(field => ({
                field: field.field,
                fieldSource: field.fieldSource ?? "powerbi",
                label: field.label,
                format: field.format,
                display: "text",
            })),
        } : undefined,
        interaction: layer.interaction,
        legend: layer.legend,
        diagnostics: {
            featureCount: features.length,
            requestCount: 0,
            loading: false,
            sourceType: "powerbi",
            geometryType: determineGeoType(features) as ResolvedMapLayer["geometryType"],
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: [],
        },
        loading: false,
    };
}

function determineGeoType(features: ResolvedMapFeature[]): "point" | "multipoint" | "polyline" | "polygon" | "unknown" {
    if (features.length === 0) return "unknown";
    return features[0].geometryType;
}

function featureTypeToGeoType(type: string): "point" | "multipoint" | "polyline" | "polygon" | "unknown" {
    switch (type) {
        case "point": return "point";
        case "line": return "polyline";
        case "polygon": return "polygon";
        default: return "unknown";
    }
}

function createEmptyLayer(id: string, name: string, sourceType: "powerbi" | "arcgisFeature"): ResolvedMapLayer {
    return {
        id,
        name,
        sourceType,
        geometryType: "unknown",
        visible: true,
        opacity: 1,
        order: 0,
        features: [],
        renderer: { type: "simple", symbol: {} },
        diagnostics: {
            featureCount: 0,
            requestCount: 0,
            loading: false,
            sourceType,
            geometryType: "unknown",
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: [],
        },
        loading: false,
    };
}
