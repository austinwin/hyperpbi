/** Shared credential-free remote adapter. Network permissions are checked by its caller. */
export async function loadPublicGeoJson(url: string, signal?: AbortSignal): Promise<GeoJSON.GeoJsonObject> {
    const endpoint = new URL(url);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) throw new Error("GeoJSON requires a credential-free HTTPS URL.");
    const response = await fetch(url, { signal, credentials: "omit", redirect: "error", headers: { Accept: "application/geo+json, application/json" } });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? `GeoJSON is private or unauthorized (${response.status}). Use a public dataset without saved credentials.` : `GeoJSON request failed (${response.status}). Check the URL, CORS and WebAccess.`);
    if (Number(response.headers.get("content-length")) > 25_000_000) throw new Error("GeoJSON exceeds 25 MB. Use a FeatureServer with viewport queries for large datasets.");
    const text = await response.text();
    if (text.length > 25_000_000) throw new Error("GeoJSON exceeds 25 MB. Use a FeatureServer with viewport queries for large datasets.");
    return validateGeoJson(JSON.parse(text));
}
export function validateGeoJson(value: unknown): GeoJSON.GeoJsonObject {
    if (!value || typeof value !== "object" || !("type" in value)) throw new Error("Response is not valid GeoJSON.");
    const data = value as Record<string, unknown>;
    if (data.type === "FeatureCollection" && Array.isArray(data.features) && data.features.every(item => !!item && typeof item === "object" && item.type === "Feature" && (item.geometry === null || typeof item.geometry === "object"))) return value as GeoJSON.GeoJsonObject;
    if (data.type === "Feature" && (data.geometry === null || !!data.geometry && typeof data.geometry === "object")) return value as GeoJSON.GeoJsonObject;
    if (["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"].includes(String(data.type)) && Array.isArray(data.coordinates)) return value as GeoJSON.GeoJsonObject;
    if (data.type === "GeometryCollection" && Array.isArray(data.geometries)) return value as GeoJSON.GeoJsonObject;
    throw new Error("Response is not a supported GeoJSON geometry, Feature or FeatureCollection.");
}
