// ── ArcGIS Geometry Converter ────────────────────────────────────────
// Converts Esri JSON geometry to GeoJSON geometry objects.

import type { EsriGeometry, EsriPoint, EsriMultiPoint, EsriPolyline, EsriPolygon } from "./arcGisServiceTypes";
import type { GeoJsonObject, Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, Position } from "geojson";

export function esriToGeoJson(geometry: EsriGeometry | null | undefined): GeoJsonObject | null {
    if (!geometry) return null;

    if ("x" in geometry && "y" in geometry) {
        return esriPointToGeoJson(geometry as EsriPoint);
    }
    if ("points" in geometry) {
        return esriMultiPointToGeoJson(geometry as EsriMultiPoint);
    }
    if ("paths" in geometry) {
        return esriPolylineToGeoJson(geometry as EsriPolyline);
    }
    if ("rings" in geometry) {
        return esriPolygonToGeoJson(geometry as EsriPolygon);
    }

    return null;
}

function esriPointToGeoJson(point: EsriPoint): Point {
    // Skip Z/M values
    return {
        type: "Point",
        coordinates: validateCoord(point.x, point.y),
    };
}

function esriMultiPointToGeoJson(multiPoint: EsriMultiPoint): MultiPoint {
    const coordinates: Position[] = [];
    for (const pt of multiPoint.points) {
        if (pt.length >= 2) {
            coordinates.push(validateCoord(pt[0], pt[1]));
        }
    }
    return { type: "MultiPoint", coordinates };
}

function esriPolylineToGeoJson(polyline: EsriPolyline): LineString | MultiLineString {
    const lines = polyline.paths
        .map(path => path.map(pt => validateCoord(pt[0], pt[1])));

    if (lines.length === 1) {
        return { type: "LineString", coordinates: lines[0] };
    }
    return { type: "MultiLineString", coordinates: lines };
}

function esriPolygonToGeoJson(polygon: EsriPolygon): Polygon | MultiPolygon {
    const rings = polygon.rings;

    if (rings.length === 0) {
        return { type: "Polygon", coordinates: [] };
    }

    const polygons: Position[][][] = [];
    let currentPolygon: Position[][] = [];

    for (const ring of rings) {
        if (!ring || ring.length === 0) continue;

        const coords = ring.map(pt => validateCoord(pt[0], pt[1]));
        if (coords.length < 3) continue;

        // Ensure ring is closed
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            coords.push([...first] as Position);
        }

        if (currentPolygon.length === 0) {
            currentPolygon = [coords];
        } else {
            currentPolygon.push(coords);
        }
    }

    if (currentPolygon.length > 0) {
        polygons.push(currentPolygon);
    }

    if (polygons.length === 1) {
        return { type: "Polygon", coordinates: polygons[0] };
    }
    return { type: "MultiPolygon", coordinates: polygons };
}

function validateCoord(x: number, y: number): Position {
    // Validate coordinate ranges, default to [0,0] for invalid
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [0, 0];
    if (Math.abs(x) > 360 || Math.abs(y) > 90) return [0, 0];
    return [x, y];
}

/**
 * Converts ArcGIS color array [r, g, b, a] to CSS rgba string.
 */
export function arcGisColorToCss(color: number[] | undefined): string | undefined {
    if (!color || color.length < 3) return undefined;
    const r = Math.round(color[0]);
    const g = Math.round(color[1]);
    const b = Math.round(color[2]);
    const a = color.length >= 4 ? color[3] / 255 : 1;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
