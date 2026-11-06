import { describe, expect, it } from "vitest";
import fixture from "../examples/map/published-map.json";
import { parseMapManifest } from "../src/maps/imports/mapManifest";
import { resolveGeoJsonLayer } from "../src/maps/sources/mapGeoJsonSource";
import { externalFilterTargetFor } from "../src/powerbi/externalFilters";
import { runMapJoinPreview } from "../src/maps/join/mapJoinPreview";
import { withCanonicalMapFeatureKeys } from "../src/maps/model/mapFeatureIdentity";
import type { MapSourceContext } from "../src/maps/sources/mapSourceResolver";
import type { MapLayerDefinition } from "../src/schema/mapSchema";
import { mapStudioData } from "./map-studio-fixture";

const definition: MapLayerDefinition = { ...parseMapManifest(fixture).manifest.layers[0], join: { enabled: true, powerBiField: "code", serviceField: "site_id", unmatchedPolicy: "diagnose", aggregations: [{ field: "amount", aggregation: "sum", as: "sales" }] }, renderer: { type: "proportionalSize", field: "sales", fieldSource: "joined", minSize: 4, maxSize: 20 } };
const data = definition.source.type === "geoJson" ? definition.source.data! : undefined!;
const sourceContext = (selected = [0, 1]): MapSourceContext => ({ rows: selected.map(index => mapStudioData.rows[index]), rowIndices: selected, rowKeys: selected.map(index => mapStudioData.rowKeys[index]), sourceRowIndices: selected.map(index => [index]), sourceRowKeys: selected.map(index => [mapStudioData.rowKeys[index]]), fields: mapStudioData.fields, datasetName: "powerbi", powerBiIdentityAvailable: true, datasetFound: true });

describe("Published features and Power BI dataset lineage", () => {
    it("joins spatial keys to report row identities and uses measures for styling", () => {
        const layer = resolveGeoJsonLayer(definition, data, sourceContext());
        expect(layer.features.map(feature => feature.id)).toEqual(["A", "B"]);
        expect(layer.features[0]).toMatchObject({ powerBiRowIndices: [0], powerBiRowKeys: ["a"], joinedAttributes: { sales: 10 } });
        expect(layer.features[1]).toMatchObject({ powerBiRowIndices: [1], powerBiRowKeys: ["b"], joinedAttributes: { sales: 20 } });
        expect(layer.powerBiIdentityAvailable).toBe(true);
        expect(layer.renderer.fieldSource).toBe("joined");
    });
    it("rebinds slicer-filtered rows without mutating spatial definitions or stable feature keys", () => {
        const full = withCanonicalMapFeatureKeys("map", [resolveGeoJsonLayer(definition, data, sourceContext())])[0];
        const sliced = withCanonicalMapFeatureKeys("map", [resolveGeoJsonLayer(definition, data, sourceContext([1]))])[0];
        expect(sliced.features.map(feature => feature.id)).toEqual(["B"]);
        expect(sliced.features[0].featureKey).toBe(full.features[1].featureKey);
        expect(sliced.features[0].powerBiRowIndices).toEqual([1]);
        expect(definition.source.type === "geoJson" && (definition.source.data as GeoJSON.FeatureCollection).features).toHaveLength(2);
    });
    it("does not invent Power BI identity for remote logical datasets", () => {
        const layer = resolveGeoJsonLayer(definition, data, { ...sourceContext(), powerBiIdentityAvailable: false, datasetName: "remote" });
        expect(layer.powerBiIdentityAvailable).toBe(false);
        expect(layer.features[0].powerBiRowIndices).toEqual([]);
        expect(layer.features[0].powerBiRowKeys).toEqual([]);
        expect(layer.features[0].joinedAttributes.sales).toBe(10);
    });
    it("reports missing join keys, duplicate cardinality and mismatched types", () => {
        const missing = resolveGeoJsonLayer({ ...definition, join: { ...definition.join!, serviceField: "missing" } }, data, sourceContext());
        expect(missing.error).toContain("missing");
        const duplicate = resolveGeoJsonLayer({ ...definition, join: { ...definition.join!, powerBiDuplicatePolicy: "error" } }, data, { ...sourceContext(), rows: [mapStudioData.rows[0], mapStudioData.rows[0]] });
        expect(duplicate.error).toContain("Duplicate Power BI join keys");
        const mismatch = resolveGeoJsonLayer({ ...definition, join: { ...definition.join!, powerBiField: "amount" } }, data, sourceContext());
        expect(mismatch.diagnostics.warnings.join(" ")).toContain("type mismatch");
    });
    it("keeps a model measure out of feature keys and basic external filter targets", () => {
        const fields = { ...mapStudioData.fields, code: { ...mapStudioData.fields.code, kind: "measure" as const, origin: "powerbi-measure" as const } };
        expect(resolveGeoJsonLayer(definition, data, { ...sourceContext(), fields }).error).toContain("Measure");
        expect(externalFilterTargetFor(fields.code)).toBeUndefined();
        expect(externalFilterTargetFor(mapStudioData.fields.code)).toEqual({ table: "Assets", column: "code" });
    });
    it("uses the shared join preview for inline Published GeoJSON without network requests", async () => {
        if (definition.source.type !== "geoJson") throw new Error("fixture");
        const preview = await runMapJoinPreview({ source: definition.source, definition: definition.join!, rows: mapStudioData.rows, rowKeys: mapStudioData.rowKeys });
        expect(preview.outputFeatureCount).toBe(2); expect(preview.matchRate).toBe(1); expect(preview.requestCount).toBe(0);
    });
});
