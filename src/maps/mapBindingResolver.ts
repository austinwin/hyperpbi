import { MapBindingKeys, MapLocationMode, NormalizedField } from "../data/normalizeData";
import { resolveConfiguredField } from "../config/hyperpbiConfig";

function firstByRole(fields: Record<string, NormalizedField>, role: string): string | undefined {
    return Object.values(fields).find(field => field.roles.includes(role))?.key;
}

function allByRole(fields: Record<string, NormalizedField>, role: string): string[] {
    return Object.values(fields).filter(field => field.roles.includes(role)).map(field => field.key);
}

export function resolveMapBindings(fields: Record<string, NormalizedField>, overrides?: Partial<MapBindingKeys>): MapBindingKeys {
    const inferred: MapBindingKeys = {
        layer: firstByRole(fields, "mapLayer"), type: firstByRole(fields, "mapType"),
        latitude: firstByRole(fields, "mapLatitude"), longitude: firstByRole(fields, "mapLongitude"),
        x: firstByRole(fields, "mapX"), y: firstByRole(fields, "mapY"), address: firstByRole(fields, "mapAddress"),
        city: firstByRole(fields, "mapCity"), state: firstByRole(fields, "mapState"), zip: firstByRole(fields, "mapZip"),
        geometry: firstByRole(fields, "mapGeometry"), color: firstByRole(fields, "mapColor"), size: firstByRole(fields, "mapSize"),
        tooltip: allByRole(fields, "mapTooltip"), details: allByRole(fields, "mapDetails")
    };
    if (!overrides) return inferred;
    const resolve = (value: string | undefined) => resolveConfiguredField(fields, value);
    return {
        layer: resolve(overrides.layer) ?? inferred.layer, type: resolve(overrides.type) ?? inferred.type,
        latitude: resolve(overrides.latitude) ?? inferred.latitude, longitude: resolve(overrides.longitude) ?? inferred.longitude,
        x: resolve(overrides.x) ?? inferred.x, y: resolve(overrides.y) ?? inferred.y,
        address: resolve(overrides.address) ?? inferred.address, city: resolve(overrides.city) ?? inferred.city, state: resolve(overrides.state) ?? inferred.state, zip: resolve(overrides.zip) ?? inferred.zip,
        geometry: resolve(overrides.geometry) ?? inferred.geometry, color: resolve(overrides.color) ?? inferred.color, size: resolve(overrides.size) ?? inferred.size,
        tooltip: overrides.tooltip?.map(resolve).filter((key): key is string => Boolean(key)) ?? inferred.tooltip,
        details: overrides.details?.map(resolve).filter((key): key is string => Boolean(key)) ?? inferred.details
    };
}

export function resolveMapMode(bindings: MapBindingKeys): MapLocationMode {
    if (bindings.geometry) return "geometry";
    if (bindings.latitude && bindings.longitude) return "latLon";
    if (bindings.x && bindings.y) return "xy";
    if (bindings.address) return "address";
    return "none";
}
