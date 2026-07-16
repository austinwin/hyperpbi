import { describe, expect, it } from "vitest";
import type { ResolvedMapFeature } from "../src/maps/model/resolvedMapTypes";
import {
    buildMapFeatureSpatialIndex,
    geometryGeographicBounds,
    queryMapFeatureSpatialIndex,
} from "../src/maps/performance/mapFeatureSpatialIndex";

function point(id: number, longitude: number, latitude: number): ResolvedMapFeature {
    return {
        id: String(id),
        layerId: "large",
        geometryType: "point",
        geometry: { type: "Point", coordinates: [longitude, latitude] } as GeoJSON.Point,
        lat: latitude,
        lon: longitude,
        serviceAttributes: {},
        powerBiAttributes: {},
        powerBiRowIndices: [id],
        powerBiRowKeys: [`row-${id}`],
        joinedAttributes: {},
        selected: false,
    };
}

describe("map feature spatial index", () => {
    it("computes bounds without constructing temporary Leaflet layers", () => {
        expect(geometryGeographicBounds({
            type: "GeometryCollection",
            geometries: [
                { type: "LineString", coordinates: [[-100, 30], [-90, 40]] },
                { type: "Polygon", coordinates: [[[-95, 28], [-80, 35], [-95, 28]]] },
            ],
        } as GeoJSON.GeometryCollection)).toEqual([-100, 28, -80, 40]);
    });

    it("queries points and intersecting geometries across the antimeridian", () => {
        const features = [point(1, 179, 0), point(2, -179, 0), point(3, 0, 0)];
        const index = buildMapFeatureSpatialIndex(features);
        expect(queryMapFeatureSpatialIndex(index, [170, -10, -170, 10], 0).map(feature => feature.id))
            .toEqual(["1", "2"]);
    });

    it("indexes 100,000 points and serves repeated viewport queries within a stress budget", () => {
        const features = Array.from({ length: 100_000 }, (_value, index) =>
            point(index, -180 + (index % 36_000) / 100, -80 + (index % 16_000) / 100),
        );
        const buildStarted = performance.now();
        const index = buildMapFeatureSpatialIndex(features);
        const buildMs = performance.now() - buildStarted;
        const pointCount = index.pointsByLongitude.length;
        const queryStarted = performance.now();
        let result: ResolvedMapFeature[] = [];
        for (let iteration = 0; iteration < 100; iteration++)
            result = queryMapFeatureSpatialIndex(index, [-96, 28, -94, 31], 0.2);
        const queryMs = performance.now() - queryStarted;

        expect(index.pointsByLongitude).toHaveLength(100_000);
        expect(index.pointsByLongitude).toHaveLength(pointCount);
        expect(result.length).toBeLessThan(features.length / 10);
        // Generous limits catch accidental quadratic regressions without making
        // the suite sensitive to ordinary CI host variance.
        expect(buildMs).toBeLessThan(5_000);
        expect(queryMs).toBeLessThan(5_000);
    });
});
