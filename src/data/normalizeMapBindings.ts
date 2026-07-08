import { resolveMapBindings, resolveMapMode } from "../maps/mapBindingResolver";
import { resolveMapLocation } from "../maps/mapLocationResolver";
import { DataRow, MapBindingKeys, NormalizedField, NormalizedMapData, NormalizedMapFeature, Primitive } from "./normalizeData";
import { GeocodeCacheEntry } from "../providers/providerTypes";
import { normalizeAddress } from "../providers/geocoders/normalizeAddress";

function propertiesFor(row: DataRow, fields: Record<string, NormalizedField>): Record<string, Primitive> {
    const properties = Object.create(null) as Record<string, Primitive>;
    for (const [key, value] of Object.entries(row)) properties[key] = value;
    for (const field of Object.values(fields)) properties[field.displayName] = row[field.key];
    return properties;
}

export function normalizeMapBindings(rows: DataRow[], fields: Record<string, NormalizedField>, overrides?: Partial<MapBindingKeys>, geocodeCache: Record<string, GeocodeCacheEntry> = {}, rowKeys: string[] = []): NormalizedMapData {
    const bindings = resolveMapBindings(fields, overrides); const mode = resolveMapMode(bindings); const grouped = new Map<string, NormalizedMapFeature[]>(); let invalidFeatureCount = 0; let unsupportedTypeCount = 0;
    rows.forEach((row, rowIndex) => {
        let location = resolveMapLocation(row, bindings, mode);
        if (!location) { invalidFeatureCount += 1; return; }
        if (location.type === "address" && location.address) { const cached = geocodeCache[normalizeAddress(location.address)]; if (cached) location = { ...location, type: "point", lat: cached.latitude, lon: cached.longitude }; }
        const layerName = bindings.layer ? String(row[bindings.layer] ?? "(Blank)") : "Map data";
        const size = bindings.size ? Number(row[bindings.size]) : NaN;
        const typeOverride = bindings.type ? String(row[bindings.type] ?? "").trim().toLowerCase() : "";
        const resolvedType = location.type === "geometry" && ["point", "line", "polygon"].includes(typeOverride) ? typeOverride as NormalizedMapFeature["type"] : location.type;
        if ((mode === "latLon" || mode === "xy") && typeOverride && typeOverride !== "point") unsupportedTypeCount += 1;
        const rowKey =
            rowKeys[rowIndex] ??
            `fallback-map-row:${rowIndex}`;
        const feature: NormalizedMapFeature = {
            id: rowKey, rowIndex, rowKey, ...location,
            type: resolvedType,
            colorValue: bindings.color ? row[bindings.color] : null,
            sizeValue: Number.isFinite(size) ? size : null,
            properties: propertiesFor(row, fields), row
        };
        const features = grouped.get(layerName) ?? []; features.push(feature); grouped.set(layerName, features);
    });
    const warnings: string[] = [];
    if (mode === "address") { const resolved = Array.from(grouped.values()).flat().filter(feature => feature.type === "point").length; const unresolved = Array.from(grouped.values()).flat().length - resolved; warnings.push(resolved ? `${resolved.toLocaleString()} cached address location(s) loaded; ${unresolved.toLocaleString()} remain unresolved.` : "Address fields are bound. Geocoding is user-triggered in Studio; no address data was transmitted automatically."); }
    if (mode === "none") warnings.push("Bind Map Geometry, Map Latitude and Map Longitude, Map X and Map Y, or Map Address.");
    if (invalidFeatureCount > 0 && mode !== "address") warnings.push(`${invalidFeatureCount.toLocaleString()} row(s) have invalid or missing map locations.`);
    if (unsupportedTypeCount > 0) warnings.push(`${unsupportedTypeCount.toLocaleString()} row(s) declare a non-point Map Type, but coordinate pairs render as points. Bind Geometry for lines or polygons.`);
    return {
        hasGeometry: Boolean(bindings.geometry), hasLatLon: Boolean(bindings.latitude && bindings.longitude), hasXY: Boolean(bindings.x && bindings.y), hasAddress: Boolean(bindings.address),
        mode, bindings, layers: Array.from(grouped, ([name, features]) => ({ name, features })), warnings, invalidFeatureCount
    };
}
