import { describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { evaluateDatasets } from "../src/data/datasets";
import type { NormalizedData, NormalizedField } from "../src/data/normalizeData";
import { effectiveMapLayerDataset, resolvePowerBiLayer } from "../src/maps/sources/mapSourceResolver";

const field = (key: string, dataType: NormalizedField["dataType"] = "number"): NormalizedField => ({ key, displayName: key, type: dataType === "number" ? "measure" : "dimension", dataType, roles: ["values"], kind: "column", origin: "powerbi-column", sourceTable: "Places", sourceColumn: key });
const fields = Object.fromEntries(["kind", "facilityLat", "facilityLon", "incidentLat", "incidentLon"].map(key => [key, field(key, key === "kind" ? "text" : "number")]));
const rows = [
    { kind: "facility", facilityLat: 10, facilityLon: 20, incidentLat: 31, incidentLon: 41 },
    { kind: "facility", facilityLat: 12, facilityLon: 22, incidentLat: 32, incidentLon: 42 },
    { kind: "incident", facilityLat: 13, facilityLon: 23, incidentLat: 30, incidentLon: 40 },
];
const data = { rows, rowKeys: ["source-0", "source-1", "source-2"], fields, aggregates: calculateAggregates(rows), map: { hasGeometry: false, hasLatLon: false, hasXY: false, hasAddress: false, mode: "none", bindings: { tooltip: [], details: [] }, layers: [], warnings: [], invalidFeatureCount: 0 } } as NormalizedData;

describe("per-layer logical dataset scope", () => {
    it("uses layer.dataset, then map.dataset, then powerbi", () => {
        expect(effectiveMapLayerDataset({ dataset: "layer" }, "map")).toBe("layer");
        expect(effectiveMapLayerDataset({}, "map")).toBe("map");
        expect(effectiveMapLayerDataset({})).toBe("powerbi");
    });

    it("resolves two layers from different filtered and grouped logical views", () => {
        const evaluated = evaluateDatasets(data, {
            facilities: { source: "powerbi", filter: { field: "kind", operator: "=", value: "facility" } },
            incidentSummary: { source: "powerbi", filter: { field: "kind", operator: "=", value: "incident" }, groupBy: ["kind"], metrics: { lat: { op: "avg", field: "incidentLat" }, lon: { op: "avg", field: "incidentLon" } } },
        });
        const resolve = (datasetName: string, latitude: string, longitude: string) => {
            const result = evaluated.datasets.get(datasetName)!;
            return resolvePowerBiLayer({ id: datasetName, name: datasetName, dataset: datasetName, source: { type: "powerbi", bindings: { latitude, longitude } } }, {
                rows: result.data.rows, fields: result.data.fields, rowIndices: result.data.rows.map((_row, index) => index), rowKeys: result.data.rowKeys,
                sourceRowIndices: result.lineage, sourceRowKeys: result.lineage.map(indices => indices.map(index => data.rowKeys[index])), datasetName, datasetFound: true,
            });
        };
        const facilities = resolve("facilities", "facilityLat", "facilityLon");
        const incidents = resolve("incidentSummary", "lat", "lon");
        expect(facilities.features).toHaveLength(2);
        expect(incidents.features).toHaveLength(1);
        expect(incidents.features[0].powerBiRowIndices).toEqual([2]);
        expect(incidents.features[0].powerBiRowKeys).toEqual(["source-2"]);
    });

    it("preserves every contributing identity for a grouped logical row", () => {
        const evaluated = evaluateDatasets(data, { grouped: { source: "powerbi", groupBy: ["kind"], metrics: { lat: { op: "avg", field: "facilityLat" }, lon: { op: "avg", field: "facilityLon" } } } });
        const grouped = evaluated.datasets.get("grouped")!;
        const result = resolvePowerBiLayer({ id: "grouped", name: "Grouped", dataset: "grouped", source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon", layer: "kind" }, layerValue: "facility" } }, {
            rows: grouped.data.rows, fields: grouped.data.fields, rowIndices: [0, 1], rowKeys: grouped.data.rowKeys, sourceRowIndices: grouped.lineage,
            sourceRowKeys: grouped.lineage.map(indices => indices.map(index => data.rowKeys[index])), datasetName: "grouped", datasetFound: true,
        });
        expect(result.features[0].powerBiRowIndices).toEqual([0, 1]);
        expect(result.features[0].powerBiRowKeys).toEqual(["source-0", "source-1"]);
    });

    it("diagnoses missing datasets and fields at exact layer paths", () => {
        const missing = resolvePowerBiLayer({ id: "bad", name: "Bad", dataset: "missing", source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } } }, { rows: [], fields: {}, rowIndices: [], rowKeys: [], datasetName: "missing", datasetFound: false, layerPath: "/components/0/layers/2" });
        expect(missing.diagnostics.issues).toContainEqual(expect.objectContaining({ code: "MAP_LAYER_DATASET_NOT_FOUND", path: "/components/0/layers/2/dataset" }));
        const available = resolvePowerBiLayer({ id: "bad-field", name: "Bad field", source: { type: "powerbi", bindings: { latitude: "missing", longitude: "facilityLon" } }, renderer: { type: "continuousColor", field: "alsoMissing", minColor: "#fff", maxColor: "#000" }, labels: { enabled: true, field: "labelMissing" } }, { rows, fields, rowIndices: [0, 1, 2], rowKeys: data.rowKeys, datasetName: "powerbi", datasetFound: true, layerPath: "/components/0/layers/0" });
        expect(available.diagnostics.issues).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: "MAP_LAYER_FIELD_NOT_FOUND", path: "/components/0/layers/0/source/bindings/latitude" }),
            expect.objectContaining({ code: "MAP_LAYER_FIELD_NOT_FOUND", path: "/components/0/layers/0/renderer/field" }),
            expect.objectContaining({ code: "MAP_LAYER_FIELD_NOT_FOUND", path: "/components/0/layers/0/labels/field" }),
        ]));
    });
});
