import { describe, expect, it } from "vitest";
import type { NormalizedField } from "../src/data/normalizeData";
import type { MapLayerDefinition } from "../src/schema/mapSchema";
import { resolvePowerBiLayer, type MapSourceContext } from "../src/maps/sources/mapSourceResolver";

const field = (key: string, type: NormalizedField["type"] = "dimension", dataType: NormalizedField["dataType"] = "number"): NormalizedField => ({ key, displayName: key, type, dataType, roles: ["values"] });
const context = (rows: MapSourceContext["rows"], fields: Record<string, NormalizedField>, extra: Partial<MapSourceContext> = {}): MapSourceContext => ({
    rows, fields, rowIndices: rows.map((_row, index) => index), rowKeys: rows.map((_row, index) => `row-${index}`), datasetName: "powerbi", datasetFound: true, ...extra,
});
const layer = (id: string, bindings: Record<string, string>, extra: Partial<MapLayerDefinition> = {}): MapLayerDefinition => ({ id, name: id, source: { type: "powerbi", bindings }, ...extra });

describe("canonical per-layer map binding resolution", () => {
    it("uses only explicit layer bindings and never inherits Runtime Config bindings", () => {
        const fields = Object.fromEntries(["facilityLat", "facilityLon", "incidentLat", "incidentLon"].map(key => [key, field(key)]));
        const rows = [{ facilityLat: 10, facilityLon: 20, incidentLat: 30, incidentLon: 40 }];
        const source = context(rows, fields, { runtimeBindings: { latitude: "incidentLat", longitude: "incidentLon" } });
        const facilities = resolvePowerBiLayer(layer("facilities", { latitude: "facilityLat", longitude: "facilityLon" }), source);
        const incidents = resolvePowerBiLayer(layer("incidents", { latitude: "incidentLat", longitude: "incidentLon" }), source);
        expect([facilities.features[0].lat, facilities.features[0].lon]).toEqual([10, 20]);
        expect([incidents.features[0].lat, incidents.features[0].lon]).toEqual([30, 40]);
    });

    it("returns an empty layer with bounded available values when layerValue is absent", () => {
        const source = context([{ lat: 10, lon: 20, group: "A" }, { lat: 30, lon: 40, group: "B" }], { lat: field("lat", "latitude"), lon: field("lon", "longitude"), group: field("group", "dimension", "text") });
        const result = resolvePowerBiLayer(layer("missing", { latitude: "lat", longitude: "lon", layer: "group" }, { source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon", layer: "group" }, layerValue: "C" } }), source);
        expect(result.features).toEqual([]);
        expect(result.diagnostics.layerValueMatched).toBe(false);
        expect(result.diagnostics.issues).toContainEqual(expect.objectContaining({ code: "MAP_LAYER_VALUE_NOT_FOUND", details: expect.objectContaining({ requested: "C", availableValues: ["A", "B"] }) }));
    });

    it("analyzes every geometry and diagnoses mixed layers", () => {
        const source = context([{ shape: "POINT(1 2)" }, { shape: "LINESTRING(0 0,1 1)" }, { shape: "POLYGON((0 0,1 0,1 1,0 0))" }], { shape: field("shape", "geometry", "text") });
        const result = resolvePowerBiLayer(layer("mixed", { geometry: "shape" }), source);
        expect(result.geometryType).toBe("mixed");
        expect(result.diagnostics.geometryTypeCounts).toMatchObject({ point: 1, polyline: 1, polygon: 1 });
        expect(result.diagnostics.issues).toContainEqual(expect.objectContaining({ code: "MAP_LAYER_MIXED_GEOMETRY" }));
    });

    it("enforces finite coordinate ranges and reports exact current-dataset counts", () => {
        const source = context([{ lat: 29, lon: -95 }, { lat: null, lon: -95 }, { lat: "bad", lon: -95 }, { lat: 91, lon: -95 }, { lat: 29, lon: 181 }], { lat: field("lat", "latitude"), lon: field("lon", "longitude") });
        const result = resolvePowerBiLayer(layer("points", { latitude: "lat", longitude: "lon" }), source);
        expect(result.features).toHaveLength(1);
        expect(result.diagnostics).toMatchObject({ totalInputRows: 5, validFeatureCount: 1, incompletePairCount: 1, nonNumericCount: 1, outOfRangeCount: 2 });
    });
});
