import { resolveMapBindings, resolveMapMode } from "../maps/mapBindingResolver";
import { resolveMapLocation } from "../maps/mapLocationResolver";
import { GeocodeCacheEntry } from "../providers/providerTypes";
import { normalizeAddress } from "../providers/geocoders/normalizeAddress";
import {
    DataRow, MapBindingKeys, MapCoordinateCounts, MapCoordinateDiagnostic,
    NormalizedField, NormalizedMapData, NormalizedMapFeature, Primitive,
} from "./normalizeData";

function propertiesFor(row: DataRow, fields: Record<string, NormalizedField>): Record<string, Primitive> {
    const properties = Object.create(null) as Record<string, Primitive>;
    for (const [key, value] of Object.entries(row)) properties[key] = value;
    for (const field of Object.values(fields)) properties[field.displayName] = row[field.key];
    return properties;
}

type CoordinateStatus = "valid" | "incomplete" | "non-numeric" | "out-of-range";
function coordinateStatus(row: DataRow, latitude?: string, longitude?: string): CoordinateStatus {
    if (!latitude || !longitude) return "incomplete";
    const lat = row[latitude], lon = row[longitude];
    const missing = (value: Primitive) => value === null || value === undefined || typeof value === "string" && !value.trim();
    if (missing(lat) || missing(lon)) return "incomplete";
    if (typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon)) return "non-numeric";
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return "out-of-range";
    return "valid";
}

function coordinateFieldDiagnostic(field: NormalizedField | undefined, role: "mapLatitude" | "mapLongitude", label: "Latitude" | "Longitude"): MapCoordinateDiagnostic[] {
    if (!field) return [];
    const dedicated = field.roles.includes(role);
    const diagnostics: MapCoordinateDiagnostic[] = [];
    const metadata = { fieldKey: field.key, fieldDisplayName: field.displayName, queryName: field.queryName, queryAggregation: field.queryAggregation, sourceTable: field.sourceTable, sourceColumn: field.sourceColumn, roles: [...field.roles] };
    if (!dedicated) diagnostics.push({ code: "MAP_COORDINATE_ROLE_NOT_GROUPING", severity: "warning", message: `${label} uses “${field.displayName}” outside the dedicated Map ${label} Grouping role. Existing Values bindings remain supported, but the dedicated role provides reliable row-level coordinate intent.`, ...metadata });
    if (!dedicated && field.isImplicitAggregation && field.queryAggregation) {
        const reported = field.queryName || `${field.queryAggregation}(${field.sourceColumn ?? field.displayName})`;
        diagnostics.push({ code: "MAP_COORDINATE_QUERY_AGGREGATED", severity: "warning", message: `Power BI’s current HyperPBI visual query reports ${label} as ${reported}. The model’s default summarization and this visual-query aggregation are separate. Bind the field to Map ${label} or change this field instance in the HyperPBI visual data well to Don’t summarize.`, ...metadata });
    }
    return diagnostics;
}

export function normalizeMapBindings(rows: DataRow[], fields: Record<string, NormalizedField>, overrides?: Partial<MapBindingKeys>, geocodeCache: Record<string, GeocodeCacheEntry> = {}, rowKeys: string[] = []): NormalizedMapData {
    const bindings = resolveMapBindings(fields, overrides);
    const mode = resolveMapMode(bindings);
    const grouped = new Map<string, NormalizedMapFeature[]>();
    let invalidFeatureCount = 0;
    let unsupportedTypeCount = 0;
    const coordinateCounts: MapCoordinateCounts = { dataViewRowCount: rows.length, validPairCount: 0, invalidPairCount: 0, incompletePairCount: 0, nonNumericPairCount: 0, outOfRangePairCount: 0 };

    rows.forEach((row, rowIndex) => {
        if (mode === "latLon") {
            const status = coordinateStatus(row, bindings.latitude, bindings.longitude);
            if (status === "valid") coordinateCounts.validPairCount += 1;
            else {
                coordinateCounts.invalidPairCount += 1;
                if (status === "incomplete") coordinateCounts.incompletePairCount += 1;
                else if (status === "non-numeric") coordinateCounts.nonNumericPairCount += 1;
                else coordinateCounts.outOfRangePairCount += 1;
            }
        }
        let location = resolveMapLocation(row, bindings, mode);
        if (!location) { invalidFeatureCount += 1; return; }
        if (location.type === "address" && location.address) {
            const cached = geocodeCache[normalizeAddress(location.address)];
            if (cached) location = { ...location, type: "point", lat: cached.latitude, lon: cached.longitude };
        }
        const layerName = bindings.layer ? String(row[bindings.layer] ?? "(Blank)") : "Map data";
        const size = bindings.size ? Number(row[bindings.size]) : NaN;
        const typeOverride = bindings.type ? String(row[bindings.type] ?? "").trim().toLowerCase() : "";
        const resolvedType = location.type === "geometry" && ["point", "line", "polygon"].includes(typeOverride) ? typeOverride as NormalizedMapFeature["type"] : location.type;
        if ((mode === "latLon" || mode === "xy") && typeOverride && typeOverride !== "point") unsupportedTypeCount += 1;
        const rowKey = rowKeys[rowIndex] ?? `fallback-map-row:${rowIndex}`;
        const feature: NormalizedMapFeature = {
            id: rowKey, rowIndex, rowKey, ...location, type: resolvedType,
            colorValue: bindings.color ? row[bindings.color] : null,
            sizeValue: Number.isFinite(size) ? size : null,
            properties: propertiesFor(row, fields), row,
        };
        const features = grouped.get(layerName) ?? [];
        features.push(feature);
        grouped.set(layerName, features);
    });

    const diagnostics: MapCoordinateDiagnostic[] = [];
    if (mode === "latLon") {
        diagnostics.push(...coordinateFieldDiagnostic(bindings.latitude ? fields[bindings.latitude] : undefined, "mapLatitude", "Latitude"));
        diagnostics.push(...coordinateFieldDiagnostic(bindings.longitude ? fields[bindings.longitude] : undefined, "mapLongitude", "Longitude"));
        const severity = coordinateCounts.validPairCount > 0 ? "warning" as const : "error" as const;
        if (coordinateCounts.incompletePairCount) diagnostics.push({ code: "MAP_COORDINATE_PAIR_INCOMPLETE", severity, message: `${coordinateCounts.incompletePairCount.toLocaleString()} current data-view row(s) have an incomplete latitude/longitude pair.` });
        if (coordinateCounts.nonNumericPairCount) diagnostics.push({ code: "MAP_COORDINATE_NON_NUMERIC", severity, message: `${coordinateCounts.nonNumericPairCount.toLocaleString()} current data-view row(s) contain nonnumeric latitude or longitude values.` });
        if (coordinateCounts.outOfRangePairCount) diagnostics.push({ code: "MAP_COORDINATE_OUT_OF_RANGE", severity, message: `${coordinateCounts.outOfRangePairCount.toLocaleString()} current data-view row(s) are outside latitude −90…90 or longitude −180…180.` });
        if (coordinateCounts.invalidPairCount) diagnostics.push({ code: "MAP_COORDINATE_ROWS_DROPPED", severity, message: `${coordinateCounts.invalidPairCount.toLocaleString()} of ${coordinateCounts.dataViewRowCount.toLocaleString()} current data-view row(s) were excluded; ${coordinateCounts.validPairCount.toLocaleString()} valid coordinate pair(s) remain.` });
        if (coordinateCounts.validPairCount) diagnostics.push({ code: "MAP_COORDINATE_BINDING_VALID", severity: "info", message: `${coordinateCounts.validPairCount.toLocaleString()} valid coordinate pair(s) were loaded from ${coordinateCounts.dataViewRowCount.toLocaleString()} current data-view row(s).` });
    }

    const warnings = diagnostics.filter(item => item.severity !== "info").map(item => item.message);
    if (mode === "address") {
        const resolved = Array.from(grouped.values()).flat().filter(feature => feature.type === "point").length;
        const unresolved = Array.from(grouped.values()).flat().length - resolved;
        warnings.push(resolved ? `${resolved.toLocaleString()} cached address location(s) loaded; ${unresolved.toLocaleString()} remain unresolved.` : "Address fields are bound. Geocoding is user-triggered in Studio; no address data was transmitted automatically.");
    }
    if (mode === "none") warnings.push("Bind Map Geometry, Map Latitude and Map Longitude, Map X and Map Y, or Map Address.");
    if (invalidFeatureCount > 0 && mode !== "address" && mode !== "latLon") warnings.push(`${invalidFeatureCount.toLocaleString()} row(s) have invalid or missing map locations.`);
    if (unsupportedTypeCount > 0) warnings.push(`${unsupportedTypeCount.toLocaleString()} row(s) declare a non-point Map Type, but coordinate pairs render as points. Bind Geometry for lines or polygons.`);
    return {
        hasGeometry: Boolean(bindings.geometry), hasLatLon: Boolean(bindings.latitude && bindings.longitude), hasXY: Boolean(bindings.x && bindings.y), hasAddress: Boolean(bindings.address),
        mode, bindings, layers: Array.from(grouped, ([name, features]) => ({ name, features })), warnings, invalidFeatureCount, diagnostics, coordinateCounts,
    };
}
