// ── Map Source Resolver ──────────────────────────────────────────────
// Resolves map layer sources to their resolved form at runtime.

import type { MapLayerDefinition, MapLayerSourceDefinition } from "../../schema/mapSchema";
import type { ResolvedMapLayer, ResolvedMapFeature } from "../model/resolvedMapTypes";
import type { NormalizedMapFeature, MapBindingKeys } from "../../data/normalizeData";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import type { DataRow } from "../../data/normalizeData";

export interface MapSourceContext {
    /** Filtered component rows */
    rows: DataRow[];
    /** Original source-row indices for each row (maps to sourceRows index) */
    rowIndices: number[];
    /** Stable source row keys */
    rowKeys: string[];
    /** Field metadata */
    fields: Record<string, any>;
    /** Runtime map bindings */
    runtimeBindings?: Partial<MapBindingKeys>;
    /** Geocode cache entries */
    geocodeCache?: Record<string, unknown>;
}

export function resolvePowerBiLayer(
    layer: MapLayerDefinition,
    context: MapSourceContext
): ResolvedMapLayer {
    const source = layer.source as any;
    const bindings: Partial<MapBindingKeys> = {
        ...context.runtimeBindings,
        ...(source.bindings ?? {}),
    };

    const mapData = normalizeMapBindings(
        context.rows,
        context.fields,
        bindings,
        (context.geocodeCache ?? {}) as Record<string, any>,
        context.rowKeys
    );

    // Filter by layerValue if configured
    let targetLayer = source.layerValue
        ? mapData.layers.find(l => l.name === source.layerValue) ?? mapData.layers[0]
        : mapData.layers[0];

    if (!targetLayer) {
        return createEmptyLayer(layer.id, layer.name, "powerbi");
    }

    const features: ResolvedMapFeature[] = targetLayer.features.map((f: NormalizedMapFeature, featureIndex: number) => {
        // Use the original source index stored during normalization, not the filtered index
        const sourceRowIndex = context.rowIndices[f.rowIndex] ?? f.rowIndex;
        const sourceRowKey = context.rowKeys[f.rowIndex] ?? f.rowKey;

        return {
            id: f.id,
            layerId: layer.id,
            geometryType: featureTypeToGeoType(f.type),
            geometry: f.geometry,
            lat: f.lat,
            lon: f.lon,
            serviceObjectId: undefined,
            serviceAttributes: {},
            powerBiAttributes: f.row as unknown as Record<string, unknown>,
            powerBiRowIndices: [sourceRowIndex],
            powerBiRowKeys: [sourceRowKey],
            joinedAttributes: {},
            renderValue: f.colorValue,
            sizeValue: f.sizeValue ?? undefined,
            selected: false,
            row: f.row,
            rowIndex: sourceRowIndex,
            rowKey: sourceRowKey,
        } as ResolvedMapFeature;
    });

    // Resolve the configured renderer
    const resolvedRenderer = layer.renderer
        ? { ...layer.renderer, type: layer.renderer.type ?? "simple" } as any
        : { type: "simple", symbol: {} };

    return {
        id: layer.id,
        name: layer.name,
        sourceType: "powerbi",
        geometryType: determineGeoType(features),
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
        interaction: layer.interaction,
        legend: layer.legend,
        diagnostics: {
            featureCount: features.length,
            requestCount: 0,
            loading: false,
            sourceType: "powerbi",
            geometryType: determineGeoType(features),
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: [],
        },
        loading: false,
    };
}

function determineGeoType(features: ResolvedMapFeature[]): any {
    if (features.length === 0) return "unknown";
    return features[0].geometryType;
}

function featureTypeToGeoType(type: string): any {
    switch (type) {
        case "point": return "point";
        case "line": return "polyline";
        case "polygon": return "polygon";
        default: return "unknown";
    }
}

function createEmptyLayer(id: string, name: string, sourceType: string): ResolvedMapLayer {
    return {
        id,
        name,
        sourceType: sourceType as any,
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
            sourceType: sourceType as any,
            geometryType: "unknown",
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: [],
        },
        loading: false,
    };
}
