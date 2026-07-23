import type { ResolvedMapFeature, ResolvedMapLayer } from "../model/resolvedMapTypes";
import { resolvedMapFeatureKey } from "../model/mapFeatureIdentity";
import { buildMapFeatureSpatialIndex, queryMapFeatureSpatialIndex, type GeographicBounds } from "../performance/mapFeatureSpatialIndex";
import { resolveAnalyticalSelection } from "./mapAnalyticalInteraction";

export type MapSelectionTool = "rectangle" | "lasso" | "circle";
export type GeographicPoint = [latitude: number, longitude: number];
export interface GeographicRectangle { west: number; south: number; east: number; north: number; }
export type MapSelectionShape =
    | { type: "rectangle"; bounds: GeographicRectangle }
    | { type: "lasso"; points: GeographicPoint[] }
    | { type: "circle"; center: GeographicPoint; radiusMeters: number };

export interface MapSpatialSelectionResult {
    featureKeys: string[];
    featureIds: string[];
    sourceRowIndices: number[];
    sourceRowKeys: string[];
    matchedFeatureCount: number;
}

export function resolveMapFeatureSelection(
    current: readonly string[],
    incoming: readonly string[],
    mode: "replace" | "add" | "remove" | "toggle" | "clear",
): string[] {
    return resolveAnalyticalSelection(current, incoming, mode).featureKeys;
}

type LonLat = [longitude: number, latitude: number];
const validLonLat = (value: unknown): value is LonLat => Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]));

function pointInRectangle([longitude, latitude]: LonLat, rectangle: GeographicRectangle): boolean {
    return longitude >= rectangle.west && longitude <= rectangle.east && latitude >= rectangle.south && latitude <= rectangle.north;
}

function pointInPolygon([longitude, latitude]: LonLat, polygon: readonly LonLat[]): boolean {
    let inside = false;
    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
        const [xi, yi] = polygon[index];
        const [xj, yj] = polygon[previous];
        const cross = (xj - xi) * (latitude - yi) - (yj - yi) * (longitude - xi);
        if (Math.abs(cross) <= 1e-12 && longitude >= Math.min(xi, xj) && longitude <= Math.max(xi, xj) && latitude >= Math.min(yi, yj) && latitude <= Math.max(yi, yj)) return true;
        const intersects = yi > latitude !== yj > latitude && longitude < (xj - xi) * (latitude - yi) / (yj - yi || Number.EPSILON) + xi;
        if (intersects) inside = !inside;
    }
    return inside;
}

const orientation = (a: LonLat, b: LonLat, c: LonLat): number => (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
const onSegment = (a: LonLat, point: LonLat, b: LonLat): boolean =>
    point[0] >= Math.min(a[0], b[0]) && point[0] <= Math.max(a[0], b[0]) &&
    point[1] >= Math.min(a[1], b[1]) && point[1] <= Math.max(a[1], b[1]);
function segmentsIntersect(a: LonLat, b: LonLat, c: LonLat, d: LonLat): boolean {
    const first = orientation(a, b, c);
    const second = orientation(a, b, d);
    const third = orientation(c, d, a);
    const fourth = orientation(c, d, b);
    if (Math.abs(first) <= 1e-12 && onSegment(a, c, b)) return true;
    if (Math.abs(second) <= 1e-12 && onSegment(a, d, b)) return true;
    if (Math.abs(third) <= 1e-12 && onSegment(c, a, d)) return true;
    if (Math.abs(fourth) <= 1e-12 && onSegment(c, b, d)) return true;
    return first > 0 !== second > 0 && third > 0 !== fourth > 0;
}

function pathIntersectsPolygon(path: readonly LonLat[], polygon: readonly LonLat[]): boolean {
    if (path.some(point => pointInPolygon(point, polygon))) return true;
    for (let pathIndex = 1; pathIndex < path.length; pathIndex++) {
        for (let polygonIndex = 0; polygonIndex < polygon.length; polygonIndex++) {
            const next = (polygonIndex + 1) % polygon.length;
            if (segmentsIntersect(path[pathIndex - 1], path[pathIndex], polygon[polygonIndex], polygon[next])) return true;
        }
    }
    return false;
}

function polygonContainsPoint(rings: readonly LonLat[][], point: LonLat): boolean {
    return Boolean(rings[0]?.length >= 3 && pointInPolygon(point, rings[0]) && !rings.slice(1).some(hole => hole.length >= 3 && pointInPolygon(point, hole)));
}

function polygonIntersectsSelection(
    rings: readonly LonLat[][],
    selection: readonly LonLat[],
    selectionContains: (point: LonLat) => boolean,
): boolean {
    if (!rings[0]?.length) return false;
    if (rings.some(ring => pathIntersectsPolygon(ring, selection))) return true;
    if (rings[0].some(selectionContains)) return true;
    return selection.some(point => polygonContainsPoint(rings, point));
}

function geometryIntersectsSelection(
    geometry: GeoJSON.GeoJsonObject | null,
    selection: readonly LonLat[],
    selectionContains: (point: LonLat) => boolean,
): boolean {
    if (!geometry) return false;
    if (geometry.type === "Feature") return geometryIntersectsSelection((geometry as GeoJSON.Feature).geometry, selection, selectionContains);
    if (geometry.type === "FeatureCollection") return (geometry as GeoJSON.FeatureCollection).features.some(feature => geometryIntersectsSelection(feature, selection, selectionContains));
    if (geometry.type === "GeometryCollection") return (geometry as GeoJSON.GeometryCollection).geometries.some(item => geometryIntersectsSelection(item, selection, selectionContains));
    if (geometry.type === "Point") {
        const point = (geometry as GeoJSON.Point).coordinates;
        return validLonLat(point) && selectionContains(point);
    }
    if (geometry.type === "MultiPoint") return ((geometry as GeoJSON.MultiPoint).coordinates as unknown[]).filter(validLonLat).some(selectionContains);
    if (geometry.type === "LineString") return pathIntersectsPolygon(((geometry as GeoJSON.LineString).coordinates as unknown[]).filter(validLonLat), selection);
    if (geometry.type === "MultiLineString") return ((geometry as GeoJSON.MultiLineString).coordinates as unknown[][]).some(path => pathIntersectsPolygon(path.filter(validLonLat), selection));
    if (geometry.type === "Polygon") {
        const rings = ((geometry as GeoJSON.Polygon).coordinates as unknown[][]).map(ring => ring.filter(validLonLat));
        return polygonIntersectsSelection(rings, selection, selectionContains);
    }
    if (geometry.type === "MultiPolygon") return ((geometry as GeoJSON.MultiPolygon).coordinates as unknown[][][]).some(polygon => polygonIntersectsSelection(polygon.map(ring => ring.filter(validLonLat)), selection, selectionContains));
    return false;
}

export function featureIntersectsSelection(feature: ResolvedMapFeature, shape: MapSelectionShape): boolean {
    const selection: LonLat[] = shape.type === "rectangle" ? [
            [shape.bounds.west, shape.bounds.south],
            [shape.bounds.east, shape.bounds.south],
            [shape.bounds.east, shape.bounds.north],
            [shape.bounds.west, shape.bounds.north],
        ] : shape.type === "circle"
            ? circlePolygon(shape.center, shape.radiusMeters)
            : shape.points.map(([latitude, longitude]) => [longitude, latitude] as LonLat);
    if (selection.length < 3) return false;
    const contains = shape.type === "rectangle"
        ? (point: LonLat) => pointInRectangle(point, shape.bounds)
        : shape.type === "circle"
            ? (point: LonLat) => distanceMeters(shape.center, [point[1], point[0]]) <= shape.radiusMeters
            : (point: LonLat) => pointInPolygon(point, selection);
    if (geometryIntersectsSelection(feature.geometry, selection, contains)) return true;
    return feature.lat !== null && feature.lon !== null && Number.isFinite(feature.lat) && Number.isFinite(feature.lon)
        ? contains([feature.lon, feature.lat])
        : false;
}

export function selectMapFeaturesByShape(
    mapId: string,
    layers: readonly ResolvedMapLayer[],
    shape: MapSelectionShape,
): MapSpatialSelectionResult {
    const shapePoints: LonLat[] = shape.type === "rectangle"
        ? [[shape.bounds.west, shape.bounds.south], [shape.bounds.east, shape.bounds.north]]
        : shape.type === "circle"
            ? circlePolygon(shape.center, shape.radiusMeters)
            : shape.points.map(([latitude, longitude]) => [longitude, latitude]);
    if (shapePoints.length === 0) return { featureKeys: [], featureIds: [], sourceRowIndices: [], sourceRowKeys: [], matchedFeatureCount: 0 };
    const longitudes = shapePoints.map(point => point[0]);
    const latitudes = shapePoints.map(point => point[1]);
    const selectionBounds: GeographicBounds = [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
    const featureKeys: string[] = [];
    const featureIds: string[] = [];
    const sourceRowIndices = new Set<number>();
    const sourceRowKeys = new Set<string>();
    for (const layer of layers) {
        if (layer.visible === false) continue;
        const candidates = layer.features.length > 500
            ? queryMapFeatureSpatialIndex(buildMapFeatureSpatialIndex(layer.features), selectionBounds, 0)
            : layer.features;
        for (const feature of candidates) {
            if (!featureIntersectsSelection(feature, shape)) continue;
            featureKeys.push(resolvedMapFeatureKey(mapId, layer, feature));
            featureIds.push(feature.id);
            feature.powerBiRowIndices.forEach(index => sourceRowIndices.add(index));
            feature.powerBiRowKeys.forEach(key => sourceRowKeys.add(key));
        }
    }
    const uniqueFeatureKeys = Array.from(new Set(featureKeys));
    return {
        featureKeys: uniqueFeatureKeys,
        featureIds: Array.from(new Set(featureIds)),
        sourceRowIndices: Array.from(sourceRowIndices).sort((left, right) => left - right),
        sourceRowKeys: Array.from(sourceRowKeys),
        matchedFeatureCount: uniqueFeatureKeys.length,
    };
}

const EARTH_RADIUS_METERS = 6_371_008.8;

function distanceMeters(left: GeographicPoint, right: GeographicPoint): number {
    const radians = Math.PI / 180;
    const latitudeDelta = (right[0] - left[0]) * radians;
    const longitudeDelta = (right[1] - left[1]) * radians;
    const a = Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(left[0] * radians) * Math.cos(right[0] * radians) *
        Math.sin(longitudeDelta / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function circlePolygon(center: GeographicPoint, radiusMeters: number, vertices = 48): LonLat[] {
    const angular = Math.max(0, radiusMeters) / EARTH_RADIUS_METERS;
    const latitude = center[0] * Math.PI / 180;
    const longitude = center[1] * Math.PI / 180;
    return Array.from({ length: vertices }, (_value, index) => {
        const bearing = index / vertices * Math.PI * 2;
        const targetLatitude = Math.asin(
            Math.sin(latitude) * Math.cos(angular) +
            Math.cos(latitude) * Math.sin(angular) * Math.cos(bearing),
        );
        const targetLongitude = longitude + Math.atan2(
            Math.sin(bearing) * Math.sin(angular) * Math.cos(latitude),
            Math.cos(angular) - Math.sin(latitude) * Math.sin(targetLatitude),
        );
        return [targetLongitude * 180 / Math.PI, targetLatitude * 180 / Math.PI];
    });
}
