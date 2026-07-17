import type { ResolvedMapFeature } from "../model/resolvedMapTypes";

export type GeographicBounds = [west: number, south: number, east: number, north: number];

interface IndexedFeatureBounds {
    featureIndex: number;
    west: number;
    south: number;
    east: number;
    north: number;
}

export interface MapFeatureSpatialIndex {
    features: readonly ResolvedMapFeature[];
    pointsByLongitude: IndexedFeatureBounds[];
    geometries: IndexedFeatureBounds[];
}

export const LOCAL_MAP_FEATURE_CULL_THRESHOLD = 1_500;

export function geometryGeographicBounds(geometry: GeoJSON.GeoJsonObject | null | undefined): GeographicBounds | null {
    if (!geometry) return null;
    let west = Number.POSITIVE_INFINITY;
    let south = Number.POSITIVE_INFINITY;
    let east = Number.NEGATIVE_INFINITY;
    let north = Number.NEGATIVE_INFINITY;

    const extend = (longitude: unknown, latitude: unknown) => {
        const x = Number(longitude);
        const y = Number(latitude);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        west = Math.min(west, x);
        south = Math.min(south, y);
        east = Math.max(east, x);
        north = Math.max(north, y);
    };
    const visitCoordinates = (coordinates: unknown): void => {
        if (!Array.isArray(coordinates)) return;
        if (
            coordinates.length >= 2 &&
            typeof coordinates[0] === "number" &&
            typeof coordinates[1] === "number"
        ) {
            extend(coordinates[0], coordinates[1]);
            return;
        }
        for (const child of coordinates) visitCoordinates(child);
    };
    const visitObject = (value: unknown): void => {
        if (!value || typeof value !== "object") return;
        const candidate = value as {
            type?: string;
            coordinates?: unknown;
            geometry?: unknown;
            geometries?: unknown[];
            features?: unknown[];
        };
        if (candidate.coordinates) visitCoordinates(candidate.coordinates);
        if (candidate.geometry) visitObject(candidate.geometry);
        for (const child of candidate.geometries ?? []) visitObject(child);
        for (const child of candidate.features ?? []) visitObject(child);
    };

    visitObject(geometry);
    return Number.isFinite(west) ? [west, south, east, north] : null;
}

export function resolvedFeatureGeographicBounds(feature: ResolvedMapFeature): GeographicBounds | null {
    const geometryBounds = geometryGeographicBounds(feature.geometry);
    if (geometryBounds) return geometryBounds;
    return Number.isFinite(feature.lon) && Number.isFinite(feature.lat)
        ? [feature.lon!, feature.lat!, feature.lon!, feature.lat!]
        : null;
}

export function buildMapFeatureSpatialIndex(features: readonly ResolvedMapFeature[]): MapFeatureSpatialIndex {
    const pointsByLongitude: IndexedFeatureBounds[] = [];
    const geometries: IndexedFeatureBounds[] = [];
    for (const [featureIndex, feature] of features.entries()) {
        const bounds = resolvedFeatureGeographicBounds(feature);
        if (!bounds) continue;
        const entry = {
            featureIndex,
            west: bounds[0],
            south: bounds[1],
            east: bounds[2],
            north: bounds[3],
        };
        if (entry.west === entry.east && entry.south === entry.north)
            pointsByLongitude.push(entry);
        else geometries.push(entry);
    }
    pointsByLongitude.sort((left, right) => left.west - right.west || left.featureIndex - right.featureIndex);
    return { features, pointsByLongitude, geometries };
}

export function queryMapFeatureSpatialIndex(
    index: MapFeatureSpatialIndex,
    viewport: GeographicBounds,
    paddingRatio = 0.2,
): ResolvedMapFeature[] {
    const width = viewport[0] <= viewport[2]
        ? viewport[2] - viewport[0]
        : 360 - viewport[0] + viewport[2];
    if (width >= 359.999) return [...index.features];
    const height = Math.max(0, viewport[3] - viewport[1]);
    const horizontalPadding = Math.min(90, width * Math.max(0, paddingRatio));
    const verticalPadding = Math.min(45, height * Math.max(0, paddingRatio));
    const south = Math.max(-90, viewport[1] - verticalPadding);
    const north = Math.min(90, viewport[3] + verticalPadding);
    const west = viewport[0] - horizontalPadding;
    const east = viewport[2] + horizontalPadding;
    const windows = longitudeWindows(west, east);
    const matches = new Set<number>();

    for (const [windowWest, windowEast] of windows) {
        const start = lowerBoundLongitude(index.pointsByLongitude, windowWest);
        for (let position = start; position < index.pointsByLongitude.length; position++) {
            const entry = index.pointsByLongitude[position];
            if (entry.west > windowEast) break;
            if (entry.south >= south && entry.north <= north) matches.add(entry.featureIndex);
        }
        for (const entry of index.geometries) {
            if (
                entry.east >= windowWest && entry.west <= windowEast &&
                entry.north >= south && entry.south <= north
            ) matches.add(entry.featureIndex);
        }
    }

    return [...matches]
        .sort((left, right) => left - right)
        .map(featureIndex => index.features[featureIndex]);
}

function lowerBoundLongitude(entries: readonly IndexedFeatureBounds[], longitude: number): number {
    let low = 0;
    let high = entries.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (entries[middle].west < longitude) low = middle + 1;
        else high = middle;
    }
    return low;
}

function longitudeWindows(west: number, east: number): Array<[number, number]> {
    if (east - west >= 360) return [[-180, 180]];
    const normalize = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
    const normalizedWest = normalize(west);
    const normalizedEast = normalize(east);
    return normalizedWest <= normalizedEast
        ? [[normalizedWest, normalizedEast]]
        : [[normalizedWest, 180], [-180, normalizedEast]];
}
