// ── ArcGIS Response Parser ───────────────────────────────────────────
// Parses ArcGIS query responses (GeoJSON or Esri JSON) into a normalized form.

import { esriToGeoJson } from "./arcGisGeometryConverter";
import type {
    ArcGisQueryResponse,
    ArcGisGeoJsonResponse,
    ArcGisFeature,
} from "./arcGisServiceTypes";

export interface ParsedArcGisFeature {
    objectId?: number;
    attributes: Record<string, unknown>;
    geometry: GeoJSON.GeoJsonObject | null;
}

export interface ParsedArcGisResponse {
    features: ParsedArcGisFeature[];
    objectIdFieldName?: string;
    exceededTransferLimit: boolean;
    geometryType?: string;
    spatialReference?: { wkid: number };
}

/**
 * Parse an ArcGIS query response, whether GeoJSON or Esri JSON format.
 * @param response - Raw response body
 * @param requestedFormat - Expected format ("geojson" or "json")
 * @param objectIdFieldName - Override for object-ID field (from service metadata)
 */
export function parseArcGisResponse(
    response: unknown,
    requestedFormat: "geojson" | "json",
    objectIdFieldName?: string
): ParsedArcGisResponse {
    // Try GeoJSON format first
    if (requestedFormat === "geojson" && isGeoJsonResponse(response)) {
        return parseGeoJsonResponse(response as ArcGisGeoJsonResponse, objectIdFieldName);
    }

    // Fallback to Esri JSON format
    if (isEsriQueryResponse(response)) {
        return parseEsriResponse(response as ArcGisQueryResponse, objectIdFieldName);
    }

    // Unknown format
    return {
        features: [],
        exceededTransferLimit: false,
    };
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

function parseGeoJsonResponse(
    response: ArcGisGeoJsonResponse,
    objectIdFieldName?: string
): ParsedArcGisResponse {
    const oidField = objectIdFieldName ?? "OBJECTID";
    const features: ParsedArcGisFeature[] = [];

    for (const feature of response.features) {
        if (!feature) continue;

        const attributes: Record<string, unknown> = {};
        if (feature.properties) {
            for (const [key, value] of Object.entries(feature.properties)) {
                attributes[key] = value;
            }
        }

        features.push({
            objectId: (attributes[oidField] ?? attributes["OBJECTID"] ?? attributes["FID"]) as number | undefined,
            attributes,
            geometry: feature.geometry ?? null,
        });
    }

    return {
        features,
        objectIdFieldName: oidField,
        exceededTransferLimit: response.exceededTransferLimit ?? false,
    };
}

function parseEsriResponse(
    response: ArcGisQueryResponse,
    objectIdFieldName?: string
): ParsedArcGisResponse {
    const oidField = objectIdFieldName ?? response.objectIdFieldName ?? "OBJECTID";
    const features: ParsedArcGisFeature[] = [];

    if (response.features) {
        for (const esriFeature of response.features) {
            const objectId = esriFeature.attributes?.[oidField] as number | undefined;

            features.push({
                objectId,
                attributes: esriFeature.attributes ?? {},
                geometry: esriToGeoJson(esriFeature.geometry),
            });
        }
    }

    return {
        features,
        objectIdFieldName: oidField,
        exceededTransferLimit: response.exceededTransferLimit ?? false,
        geometryType: response.geometryType,
        spatialReference: response.spatialReference,
    };
}
