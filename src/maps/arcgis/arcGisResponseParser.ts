// ── ArcGIS Response Parser ───────────────────────────────────────────
// Parses ArcGIS query responses (GeoJSON or Esri JSON) into a normalized form.

import { esriToGeoJson } from "./arcGisGeometryConverter";
import type {
    ArcGisQueryResponse,
    ArcGisGeoJsonResponse,
    ArcGisFeature,
} from "./arcGisServiceTypes";

export interface ParsedArcGisFeature {
    objectId?: string | number;
    attributes: Record<string, unknown>;
    geometry: GeoJSON.GeoJsonObject | null;
}

export interface ParsedArcGisResponse {
    features: ParsedArcGisFeature[];
    objectIdFieldName?: string;
    exceededTransferLimit: boolean;
    geometryType?: string;
    spatialReference?: { wkid: number };
    warnings: string[];
}

/**
 * Parse an ArcGIS query response, whether GeoJSON or Esri JSON format.
 * @param response - Raw response body
 * @param requestedFormat - Expected format ("geojson" or "json")
 * @param objectIdFieldName - The OID field from metadata (required)
 */
export function parseArcGisResponse(
    response: unknown,
    requestedFormat: "geojson" | "json",
    objectIdFieldName: string
): ParsedArcGisResponse {
    // Try GeoJSON format first
    if (requestedFormat === "geojson" && isGeoJsonResponse(response)) {
        return parseGeoJsonResponse(response as ArcGisGeoJsonResponse, objectIdFieldName);
    }

    // Fallback to Esri JSON format
    if (isEsriQueryResponse(response)) {
        return parseEsriResponse(response as ArcGisQueryResponse, objectIdFieldName);
    }

    // Unknown/malformed response — report diagnostics
    const respObj = response as Record<string, unknown> | null;
    const maybeError = respObj?.error as Record<string, unknown> | undefined;

    return {
        features: [],
        exceededTransferLimit: false,
        warnings: [`Malformed response from service. Requested format: ${requestedFormat}.` +
            (maybeError ? ` ArcGIS error: ${JSON.stringify(maybeError)}` : "") +
            ` Missing expected properties: ${describeMissing(response)}`],
    };
}

function describeMissing(response: unknown): string {
    if (!response || typeof response !== "object") return "response is not an object";
    const obj = response as Record<string, unknown>;
    const missing: string[] = [];
    if (!Array.isArray(obj.features)) missing.push("features array");
    if (obj.type !== "FeatureCollection" && !obj.objectIdFieldName && !obj.fields) {
        missing.push("type (FeatureCollection), objectIdFieldName, or fields");
    }
    return missing.length > 0 ? missing.join(", ") : "unknown structure";
}

function isGeoJsonResponse(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const obj = value as Record<string, unknown>;
    return obj.type === "FeatureCollection" && Array.isArray(obj.features);
}

function isEsriQueryResponse(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const obj = value as Record<string, unknown>;
    return Array.isArray(obj.features) || obj.objectIdFieldName !== undefined || obj.fields !== undefined;
}

function resolveObjectId(
    attributes: Record<string, unknown>,
    field: string
): string | number | undefined {
    const value = attributes[field];
    if (typeof value === "string" || typeof value === "number") {
        return value;
    }
    return undefined;
}

function parseGeoJsonResponse(
    response: ArcGisGeoJsonResponse,
    objectIdFieldName: string
): ParsedArcGisResponse {
    const warnings: string[] = [];
    const features: ParsedArcGisFeature[] = [];

    if (!Array.isArray(response.features)) {
        return {
            features: [],
            objectIdFieldName,
            exceededTransferLimit: response.exceededTransferLimit ?? false,
            warnings: ["GeoJSON response missing features array."],
        };
    }

    for (const feature of response.features) {
        if (!feature) continue;

        // Skip malformed features with a warning
        const attributes: Record<string, unknown> = {};
        if (feature.properties) {
            for (const [key, value] of Object.entries(feature.properties)) {
                attributes[key] = value;
            }
        } else {
            warnings.push("Skipping GeoJSON feature without properties.");
            // Still allow the feature if it has geometry
            if (!feature.geometry) continue;
        }

        // Use the metadata-derived OID field via type-safe helper
        const oid = resolveObjectId(attributes, objectIdFieldName);

        features.push({
            objectId: oid,
            attributes,
            geometry: feature.geometry ?? null,
        });
    }

    return {
        features,
        objectIdFieldName,
        exceededTransferLimit: response.exceededTransferLimit ?? false,
        warnings,
    };
}

function parseEsriResponse(
    response: ArcGisQueryResponse,
    objectIdFieldName: string
): ParsedArcGisResponse {
    const warnings: string[] = [];
    // Prefer metadata OID field over response OID field
    const oidField = objectIdFieldName || response.objectIdFieldName || "OBJECTID";
    const features: ParsedArcGisFeature[] = [];

    if (!Array.isArray(response.features)) {
        return {
            features: [],
            objectIdFieldName: oidField,
            exceededTransferLimit: response.exceededTransferLimit ?? false,
            geometryType: response.geometryType,
            spatialReference: response.spatialReference,
            warnings: ["Esri JSON response missing features array."],
        };
    }

    for (const esriFeature of response.features) {
        if (!esriFeature) {
            warnings.push("Skipping null Esri feature.");
            continue;
        }

        const attrs = esriFeature.attributes ?? {};
        const objectId = resolveObjectId(attrs, oidField);

        features.push({
            objectId,
            attributes: attrs,
            geometry: esriToGeoJson(esriFeature.geometry),
        });
    }

    return {
        features,
        objectIdFieldName: oidField,
        exceededTransferLimit: response.exceededTransferLimit ?? false,
        geometryType: response.geometryType,
        spatialReference: response.spatialReference,
        warnings,
    };
}
