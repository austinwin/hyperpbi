// ── ArcGIS Response Parser Tests ──────────────────────────────────────
import { describe, it, expect } from "vitest";
import { parseArcGisResponse } from "../src/maps/arcgis/arcGisResponseParser";

describe("ArcGIS Response Parser", () => {
    describe("GeoJSON response", () => {
        it("parses GeoJSON FeatureCollection", () => {
            const response = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [-95.3, 29.7] },
                        properties: { OBJECTID: 1, NAME: "Test" },
                    },
                ],
            };
            const result = parseArcGisResponse(response, "geojson", "OBJECTID");
            expect(result.features).toHaveLength(1);
            expect(result.features[0].objectId).toBe(1);
            expect(result.features[0].attributes.NAME).toBe("Test");
            expect(result.features[0].geometry?.type).toBe("Point");
        });

        it("uses custom object ID field from metadata", () => {
            const response = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: null,
                        properties: { FID: 42, NAME: "Custom" },
                    },
                ],
            };
            const result = parseArcGisResponse(response, "geojson", "FID");
            expect(result.features[0].objectId).toBe(42);
        });

        it("handles exceededTransferLimit flag", () => {
            const response = {
                type: "FeatureCollection",
                features: [],
                exceededTransferLimit: true,
            };
            const result = parseArcGisResponse(response, "geojson", "OBJECTID");
            expect(result.exceededTransferLimit).toBe(true);
        });

        it("handles missing geometry", () => {
            const response = {
                type: "FeatureCollection",
                features: [
                    { type: "Feature", properties: { OBJECTID: 1 } },
                ],
            };
            const result = parseArcGisResponse(response, "geojson", "OBJECTID");
            expect(result.features[0].geometry).toBeNull();
        });
    });

    describe("Esri JSON response", () => {
        it("parses Esri JSON point features", () => {
            const response = {
                objectIdFieldName: "OBJECTID",
                geometryType: "esriGeometryPoint",
                features: [
                    {
                        attributes: { OBJECTID: 1, NAME: "Point" },
                        geometry: { x: -95.3, y: 29.7 },
                    },
                ],
            };
            const result = parseArcGisResponse(response, "json", "OBJECTID");
            expect(result.features).toHaveLength(1);
            expect(result.features[0].objectId).toBe(1);
            expect(result.features[0].geometry?.type).toBe("Point");
        });

        it("parses Esri JSON polyline features", () => {
            const response = {
                objectIdFieldName: "OBJECTID",
                geometryType: "esriGeometryPolyline",
                features: [
                    {
                        attributes: { OBJECTID: 1 },
                        geometry: {
                            paths: [[[-95, 29], [-96, 30], [-97, 29]]],
                        },
                    },
                ],
            };
            const result = parseArcGisResponse(response, "json", "OBJECTID");
            expect(result.features[0].geometry?.type).toBe("LineString");
        });

        it("parses Esri JSON polygon features", () => {
            const response = {
                objectIdFieldName: "OBJECTID",
                geometryType: "esriGeometryPolygon",
                features: [
                    {
                        attributes: { OBJECTID: 1 },
                        geometry: {
                            rings: [[[-95, 29], [-95, 30], [-96, 30], [-96, 29], [-95, 29]]],
                        },
                    },
                ],
            };
            const result = parseArcGisResponse(response, "json", "OBJECTID");
            expect(result.features[0].geometry?.type).toBe("Polygon");
        });

        it("parses multipoint features", () => {
            const response = {
                features: [
                    {
                        attributes: { OBJECTID: 1 },
                        geometry: {
                            points: [[-95, 29], [-96, 30]],
                        },
                    },
                ],
            };
            const result = parseArcGisResponse(response, "json", "OBJECTID");
            expect(result.features[0].geometry?.type).toBe("MultiPoint");
        });

        it("uses custom object ID field", () => {
            const response = {
                objectIdFieldName: "FID",
                features: [
                    { attributes: { FID: 99 }, geometry: { x: 0, y: 0 } },
                ],
            };
            const result = parseArcGisResponse(response, "json", "FID");
            expect(result.features[0].objectId).toBe(99);
        });

        it("handles exceededTransferLimit", () => {
            const response = {
                features: [],
                exceededTransferLimit: true,
            };
            const result = parseArcGisResponse(response, "json", "OBJECTID");
            expect(result.exceededTransferLimit).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("keeps string and numeric object IDs", () => {
            const value = parseArcGisResponse({ features: [
                { attributes: { OBJECTID: "OID-1" }, geometry: { x: 1, y: 2 } },
                { attributes: { OBJECTID: 2 }, geometry: { x: 3, y: 4 } },
            ] }, "json", "OBJECTID");
            expect(value.features.map(feature => feature.objectId)).toEqual(["OID-1", 2]);
        });

        it("retains attributes and later features when one Esri geometry is malformed", () => {
            const value = parseArcGisResponse({ features: [
                { attributes: { OBJECTID: 1, NAME: "Broken" }, geometry: { paths: null } },
                { attributes: { OBJECTID: 2, NAME: "Good" }, geometry: { x: 3, y: 4 } },
            ] }, "json", "OBJECTID");
            expect(value.features).toHaveLength(2);
            expect(value.features[0]).toMatchObject({ objectId: 1, attributes: { NAME: "Broken" }, geometry: null });
            expect(value.features[1].geometry?.type).toBe("Point");
            expect(value.warnings.join(" ")).toMatch(/malformed geometry/);
        });

        it("returns empty for null response", () => {
            const result = parseArcGisResponse(null, "json", "OBJECTID");
            expect(result.features).toHaveLength(0);
        });

        it("returns empty for unknown format", () => {
            const result = parseArcGisResponse({ foo: "bar" }, "json", "OBJECTID");
            expect(result.features).toHaveLength(0);
        });

        it("handles empty features array", () => {
            const result = parseArcGisResponse({ features: [] }, "json", "OBJECTID");
            expect(result.features).toHaveLength(0);
        });

        it("handles missing geometry in Esri features", () => {
            const response = {
                features: [
                    { attributes: { OBJECTID: 1 } },
                ],
            };
            const result = parseArcGisResponse(response, "json", "OBJECTID");
            expect(result.features[0].geometry).toBeNull();
        });
    });
});
