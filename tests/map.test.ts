import { describe, expect, it } from "vitest";
import type powerbi from "powerbi-visuals-api";
import { buildFieldDictionary } from "../src/data/fieldDictionary";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { DataRow, NormalizedField } from "../src/data/normalizeData";
import { parseGeometry } from "../src/maps/geometryParser";
import { renderMapPopupTemplate } from "../src/components/maps/MapPopup";
import { parseDataView } from "../src/data/parseDataView";

const field = (key: string, displayName: string, role: string, type: NormalizedField["type"] = "dimension"): NormalizedField => ({ key, displayName, type, roles: [role] });

describe("Power BI map bindings", () => {
    it("preserves explicit map roles in the field dictionary", () => {
        const columns = [
            { displayName: "Latitude", roles: { mapLatitude: true }, type: { numeric: true } },
            { displayName: "Longitude", roles: { mapLongitude: true }, type: { numeric: true } }
        ] as powerbi.DataViewMetadataColumn[];
        const dictionary = buildFieldDictionary(columns);
        expect(dictionary.fields.latitude.roles).toContain("mapLatitude");
        expect(dictionary.fields.longitude.roles).toContain("mapLongitude");
    });

    it("recovers and conservatively binds summarized latitude/longitude metadata", () => {
        const columns = [
            { displayName: "Latitude", queryName: "Sum(Demo.Latitude)", roles: { values: true }, type: { numeric: true }, isMeasure: false },
            { displayName: "Longitude", queryName: "Sum(Demo.Longitude)", roles: { values: true }, type: { numeric: true }, isMeasure: false }
        ] as powerbi.DataViewMetadataColumn[];
        const dictionary = buildFieldDictionary(columns);
        expect(dictionary.fields.demo_latitude).toMatchObject({ sourceTable: "Demo", sourceColumn: "Latitude", type: "latitude", kind: "column" });
        expect(dictionary.fields.demo_longitude).toMatchObject({ sourceTable: "Demo", sourceColumn: "Longitude", type: "longitude", kind: "column" });
        const map = normalizeMapBindings([{ demo_latitude: 41.88, demo_longitude: -87.63 }], dictionary.fields);
        expect(map.bindings).toMatchObject({ latitude: "demo_latitude", longitude: "demo_longitude" });
        expect(map.warnings.join(" ")).toContain("current HyperPBI visual query reports Latitude as Sum(Demo.Latitude)");
        expect(map.warnings.join(" ")).toContain("model’s default summarization");
        expect(map.warnings.join(" ")).toContain("Don’t summarize");
    });

    it("keeps explicit map configuration ahead of metadata inference", () => {
        const inferred = field("inferred", "Latitude", "values", "latitude");
        const explicit = field("configured", "Configured Latitude", "values", "measure");
        const longitude = field("lon", "Longitude", "values", "longitude");
        const map = normalizeMapBindings([{ inferred: 1, configured: 41.88, lon: -87.63 }], { inferred, configured: explicit, lon: longitude }, { latitude: "configured", longitude: "lon" });
        expect(map.bindings.latitude).toBe("configured");
    });

    it("parses map field wells through the DataView pipeline", () => {
        const columns = [
            { displayName: "Asset", roles: { dataset: true }, type: { text: true } },
            { displayName: "Latitude", roles: { mapLatitude: true }, type: { numeric: true } },
            { displayName: "Longitude", roles: { mapLongitude: true }, type: { numeric: true } },
            { displayName: "Layer", roles: { mapLayer: true }, type: { text: true } }
        ] as powerbi.DataViewMetadataColumn[];
        const dataView = { metadata: { columns }, table: { columns, rows: [["A-1", 41.88, -87.63, "Assets"]] } } as powerbi.DataView;
        const normalized = parseDataView(dataView);
        expect(normalized.map.mode).toBe("latLon"); expect(normalized.map.layers[0].name).toBe("Assets"); expect(normalized.map.layers[0].features[0].properties.Asset).toBe("A-1");
    });

    it("normalizes lat/lon, layers, color, size, tooltips, and details", () => {
        const fields = {
            lat: field("lat", "Latitude", "mapLatitude", "latitude"), lon: field("lon", "Longitude", "mapLongitude", "longitude"),
            layer: field("layer", "Layer", "mapLayer"), status: field("status", "Status", "mapColor"), size: field("size", "Risk Score", "mapSize", "measure"),
            asset: field("asset", "Asset ID", "mapTooltip"), address: field("address", "Address", "mapDetails")
        };
        const rows: DataRow[] = [{ lat: 41.88, lon: -87.63, layer: "Manholes", status: "Open", size: 82, asset: "MH001", address: "1 Main St" }, { lat: 41.9, lon: -87.7, layer: "Valves", status: "Closed", size: 30, asset: "V002", address: "2 Main St" }];
        const map = normalizeMapBindings(rows, fields);
        expect(map.mode).toBe("latLon"); expect(map.layers.map(layer => layer.name)).toEqual(["Manholes", "Valves"]);
        expect(map.layers[0].features[0]).toMatchObject({ type: "point", lat: 41.88, lon: -87.63, colorValue: "Open", sizeValue: 82 });
        expect(map.bindings.tooltip).toEqual(["asset"]); expect(map.bindings.details).toEqual(["address"]);
        expect(map.layers[0].features[0].properties["Asset ID"]).toBe("MH001");
    });

    it("maps simple Values fields through editor configuration", () => {
        const fields = {
            latitude: field("latitude", "Latitude", "values", "measure"), longitude: field("longitude", "Longitude", "values", "measure"),
            group: field("group", "Business Layer", "values"), status: field("status", "Status", "values"), asset: field("asset", "Asset ID", "values")
        };
        const map = normalizeMapBindings([{ latitude: 41.88, longitude: -87.63, group: "Assets", status: "Open", asset: "A-1" }], fields, { latitude: "latitude", longitude: "longitude", layer: "Business Layer", color: "status", tooltip: ["Asset ID"] });
        expect(map.mode).toBe("latLon"); expect(map.layers[0].name).toBe("Assets"); expect(map.bindings.tooltip).toEqual(["asset"]);
    });

    it("uses geometry before coordinates and rejects invalid geometry safely", () => {
        const fields = { geometry: field("geometry", "Geometry", "mapGeometry", "geometry"), lat: field("lat", "Latitude", "mapLatitude", "latitude"), lon: field("lon", "Longitude", "mapLongitude", "longitude") };
        const map = normalizeMapBindings([{ geometry: "POINT(-87.63 41.88)", lat: 0, lon: 0 }, { geometry: "not geometry", lat: 41, lon: -87 }], fields);
        expect(map.mode).toBe("geometry"); expect(map.layers[0].features).toHaveLength(1); expect(map.invalidFeatureCount).toBe(1);
    });

    it("supports EPSG:4326 X/Y and privacy-safe address mode", () => {
        const xyFields = { x: field("x", "X", "mapX", "measure"), y: field("y", "Y", "mapY", "measure") };
        expect(normalizeMapBindings([{ x: -87.63, y: 41.88 }], xyFields).layers[0].features[0]).toMatchObject({ x: -87.63, y: 41.88, lat: 41.88, lon: -87.63 });
        const addressFields = { address: field("address", "Address", "mapAddress"), city: field("city", "City", "mapCity") };
        const addressMap = normalizeMapBindings([{ address: "1 Main St", city: "Chicago" }], addressFields);
        expect(addressMap.mode).toBe("address"); expect(addressMap.warnings[0]).toMatch(/disabled|transmitted/i);
    });

    it("parses supported geometry and resolves popup tokens without expressions", () => {
        expect(parseGeometry("LINESTRING(-87 41,-88 42)")?.type).toBe("line"); expect(parseGeometry("POLYGON((0 0,1 0,1 1,0 0))")?.type).toBe("polygon"); expect(parseGeometry("POINT(bad data)")).toBeNull();
        const feature = normalizeMapBindings([{ asset: "MH001" }], { geometry: field("asset", "Asset ID", "mapAddress") }).layers[0].features[0];
        expect(renderMapPopupTemplate("<b>{{Asset ID}}</b>{{constructor.constructor}}{{__proto__}}", feature)).toBe("<b>MH001</b>");
    });
});
