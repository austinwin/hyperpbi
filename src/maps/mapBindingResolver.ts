import { MapBindingKeys, MapLocationMode, NormalizedField } from "../data/normalizeData";
import { resolveConfiguredField } from "../config/hyperpbiConfig";

type SingleMapBinding = Exclude<keyof MapBindingKeys, "tooltip" | "details">;

function inferredField(fields: Record<string, NormalizedField>, binding: SingleMapBinding): string | undefined {
    const semantic = binding === "latitude" ? Object.values(fields).find(field => field.type === "latitude")?.key
        : binding === "longitude" ? Object.values(fields).find(field => field.type === "longitude")?.key
        : binding === "geometry" ? Object.values(fields).find(field => field.type === "geometry")?.key : undefined;
    if (semantic) return semantic;
    const names: Record<string, string[]> = {
        latitude: ["latitude", "lat"], longitude: ["longitude", "lon", "lng"],
        geometry: ["geometry", "geojson", "wkt"], address: ["address", "street address"],
    };
    const candidates = names[binding];
    if (candidates) return Object.values(fields).find(field => candidates.includes((field.sourceColumn ?? field.displayName ?? field.key).trim().toLowerCase()))?.key;
    return undefined;
}

function inferredFields(fields: Record<string, NormalizedField>, role: string): string[] {
    return Object.values(fields).filter(field => field.roles.includes(role)).map(field => field.key);
}

export function resolveMapBindings(fields: Record<string, NormalizedField>, overrides?: Partial<MapBindingKeys>): MapBindingKeys {
    const inferred: MapBindingKeys = {
        layer: inferredField(fields, "layer"), type: inferredField(fields, "type"),
        latitude: inferredField(fields, "latitude"), longitude: inferredField(fields, "longitude"),
        x: inferredField(fields, "x"), y: inferredField(fields, "y"), address: inferredField(fields, "address"),
        city: inferredField(fields, "city"), state: inferredField(fields, "state"), zip: inferredField(fields, "zip"),
        geometry: inferredField(fields, "geometry"), color: inferredField(fields, "color"), size: inferredField(fields, "size"),
        tooltip: inferredFields(fields, "mapTooltip"), details: inferredFields(fields, "mapDetails")
    };
    if (!overrides) return inferred;
    // An explicitly supplied but unresolved binding stays unresolved. Falling
    // through to another field would make a typo display unrelated locations.
    const resolve = (value: string | undefined, fallback: string | undefined) =>
        value === undefined ? fallback : resolveConfiguredField(fields, value);
    const resolveMany = (values: string[] | undefined, fallback: string[]) => values === undefined
        ? fallback
        : values.map(value => resolveConfiguredField(fields, value)).filter((key): key is string => Boolean(key));
    return {
        layer: resolve(overrides.layer, inferred.layer), type: resolve(overrides.type, inferred.type),
        latitude: resolve(overrides.latitude, inferred.latitude), longitude: resolve(overrides.longitude, inferred.longitude),
        x: resolve(overrides.x, inferred.x), y: resolve(overrides.y, inferred.y),
        address: resolve(overrides.address, inferred.address), city: resolve(overrides.city, inferred.city), state: resolve(overrides.state, inferred.state), zip: resolve(overrides.zip, inferred.zip),
        geometry: resolve(overrides.geometry, inferred.geometry), color: resolve(overrides.color, inferred.color), size: resolve(overrides.size, inferred.size),
        tooltip: resolveMany(overrides.tooltip, inferred.tooltip), details: resolveMany(overrides.details, inferred.details)
    };
}

export function resolveMapMode(bindings: MapBindingKeys): MapLocationMode {
    if (bindings.geometry) return "geometry";
    if (bindings.latitude && bindings.longitude) return "latLon";
    if (bindings.x && bindings.y) return "xy";
    if (bindings.address) return "address";
    return "none";
}
