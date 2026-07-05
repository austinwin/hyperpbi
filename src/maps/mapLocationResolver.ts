import { DataRow, MapBindingKeys, MapFeatureType, MapLocationMode, Primitive } from "../data/normalizeData";
import { parseGeometry } from "./geometryParser";

export interface ResolvedMapLocation {
    type: MapFeatureType;
    geometry: GeoJSON.GeoJsonObject | null;
    lat: number | null;
    lon: number | null;
    x: number | null;
    y: number | null;
    address: string | null;
}

function coordinate(value: Primitive): number | null { const result = Number(value); return Number.isFinite(result) ? result : null; }
function text(row: DataRow, key?: string): string { return key ? String(row[key] ?? "").trim() : ""; }

export function resolveMapLocation(row: DataRow, bindings: MapBindingKeys, mode: MapLocationMode): ResolvedMapLocation | null {
    if (mode === "geometry" && bindings.geometry) {
        const parsed = parseGeometry(row[bindings.geometry]);
        return parsed ? { type: parsed.type, geometry: parsed.geometry, lat: null, lon: null, x: null, y: null, address: null } : null;
    }
    if (mode === "latLon" && bindings.latitude && bindings.longitude) {
        const lat = coordinate(row[bindings.latitude]); const lon = coordinate(row[bindings.longitude]);
        return lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { type: "point", geometry: null, lat, lon, x: null, y: null, address: null } : null;
    }
    if (mode === "xy" && bindings.x && bindings.y) {
        const x = coordinate(row[bindings.x]); const y = coordinate(row[bindings.y]);
        return x !== null && y !== null && Math.abs(y) <= 90 && Math.abs(x) <= 180 ? { type: "point", geometry: null, lat: y, lon: x, x, y, address: null } : null;
    }
    if (mode === "address" && bindings.address) {
        const address = [text(row, bindings.address), text(row, bindings.city), text(row, bindings.state), text(row, bindings.zip)].filter(Boolean).join(", ");
        return address ? { type: "address", geometry: null, lat: null, lon: null, x: null, y: null, address } : null;
    }
    return null;
}
