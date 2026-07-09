// ── Map Source Resolver ──────────────────────────────────────────────
// Resolves map layer sources to their resolved form at runtime.

import type { MapLayerDefinition, MapLayerSourceDefinition } from "../../schema/mapSchema";
import type { ResolvedMapLayer, ResolvedMapFeature } from "../model/resolvedMapTypes";
import type { NormalizedMapFeature, MapBindingKeys } from "../../data/normalizeData";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import type { DataRow } from "../../data/normalizeData";

export interface MapSourceContext {
    rows: DataRow[];
    rowKeys: string[];
    fields: Record<string, any>;
    runtimeBindings?: Partial<MapBindingKeys>;
    geocodeCache?: Record<string, any>;
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
        context.geocodeCache ?? {},
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
            powerBiRowIndices: [f.rowIndex],
            powerBiRowKeys: [f.rowKey],
            joinedAttributes: {},
            renderValue: f.colorValue,
            sizeValue: f.sizeValue ?? undefined,
            selected: false,
            row: f.row,
            rowIndex: f.rowIndex,
            rowKey: f.rowKey,
        } as ResolvedMapFeature;
    });

    return {
        id: layer.id,
        name: layer.name,
        sourceType: "powerbi",
        geometryType: determineGeoType(features),
        visible: layer.visible ?? true,
        opacity: layer.opacity ?? 1,
        order: layer.order ?? 0,
        features,
        renderer: { type: "simple", symbol: {} },
        interaction: layer.interaction,
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
