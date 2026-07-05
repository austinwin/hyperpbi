export interface ParsedGeometry {
    geometry: GeoJSON.GeoJsonObject;
    type: "point" | "line" | "polygon" | "geometry";
}

function coordinatesValid(value: unknown): boolean {
    if (!Array.isArray(value) || value.length === 0) return false;
    if (typeof value[0] === "number") return value.length >= 2 && value.every(item => typeof item === "number" && Number.isFinite(item));
    return value.every(coordinatesValid);
}

function featureType(geometry: GeoJSON.GeoJsonObject): ParsedGeometry["type"] {
    const type = geometry.type.toLowerCase();
    if (type.includes("point")) return "point";
    if (type.includes("line")) return "line";
    if (type.includes("polygon")) return "polygon";
    if (type === "feature") return featureType((geometry as GeoJSON.Feature).geometry);
    return "geometry";
}

function validateGeoJson(value: unknown): GeoJSON.GeoJsonObject | null {
    if (!value || typeof value !== "object" || !("type" in value) || typeof value.type !== "string") return null;
    const candidate = value as GeoJSON.GeoJsonObject;
    if (candidate.type === "Feature") return (candidate as GeoJSON.Feature).geometry && validateGeoJson((candidate as GeoJSON.Feature).geometry) ? candidate : null;
    if (candidate.type === "FeatureCollection") return (candidate as GeoJSON.FeatureCollection).features.every(feature => validateGeoJson(feature)) ? candidate : null;
    if (candidate.type === "GeometryCollection") return (candidate as GeoJSON.GeometryCollection).geometries.every(geometry => validateGeoJson(geometry)) ? candidate : null;
    return "coordinates" in candidate && coordinatesValid(candidate.coordinates) ? candidate : null;
}

function coordinatePairs(text: string): Array<[number, number]> | null {
    const pairs = text.split(",").map(pair => pair.trim().split(/\s+/).map(Number));
    return pairs.every(pair => pair.length >= 2 && Number.isFinite(pair[0]) && Number.isFinite(pair[1])) ? pairs.map(pair => [pair[0], pair[1]]) : null;
}

export function parseGeometry(value: unknown): ParsedGeometry | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const text = value.trim();
    if (text.startsWith("{") || text.startsWith("[")) {
        try {
            const geometry = validateGeoJson(JSON.parse(text));
            return geometry ? { geometry, type: featureType(geometry) } : null;
        } catch { return null; }
    }
    const point = /^POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/i.exec(text);
    if (point) return { geometry: { type: "Point", coordinates: [Number(point[1]), Number(point[2])] } as GeoJSON.Point, type: "point" };
    const line = /^LINESTRING\s*\((.+)\)$/i.exec(text); const lineCoordinates = line ? coordinatePairs(line[1]) : null;
    if (lineCoordinates) return { geometry: { type: "LineString", coordinates: lineCoordinates } as GeoJSON.LineString, type: "line" };
    const polygon = /^POLYGON\s*\(\((.+)\)\)$/i.exec(text); const polygonCoordinates = polygon ? coordinatePairs(polygon[1]) : null;
    if (polygonCoordinates) return { geometry: { type: "Polygon", coordinates: [polygonCoordinates] } as GeoJSON.Polygon, type: "polygon" };
    return null;
}
