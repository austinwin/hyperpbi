import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { ResolvedMapFeature } from "../model/resolvedMapTypes";

export type MapAttributeSource = "powerbi" | "service" | "joined";
export type MapAttributePurpose = "renderer" | "label" | "popup" | "tooltip" | "visibility" | "filter" | "interaction";

/** Resolve exactly one namespace. Explicit field sources never fall through. */
export function featureAttribute(feature: ResolvedMapFeature, field: string, source: MapAttributeSource): unknown {
    if (source === "powerbi") return feature.powerBiAttributes[field];
    if (source === "service") return feature.serviceAttributes[field];
    return feature.joinedAttributes[field];
}
export function defaultAttributeSource(layer: MapLayerDefinition, _purpose: MapAttributePurpose): MapAttributeSource {
    if (layer.source.type === "powerbi") return "powerbi";
    if (layer.source.type === "arcgisFeature" && layer.source.mode === "join") return "joined";
    return "service";
}

export function attributeSourceAvailable(layer: MapLayerDefinition, source: MapAttributeSource): boolean {
    if (layer.source.type === "powerbi") return source === "powerbi";
    if (layer.source.type !== "arcgisFeature") return false;
    if (layer.source.mode === "join") return true;
    return source === "service";
}
