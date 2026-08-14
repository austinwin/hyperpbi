import { describe, expect, it } from "vitest";
import { createDefaultGeoLibreProject, powerBiLayerId } from "../src/components/geolibre/projectBridge";
import { featureIdsForSourceRows, hydratePowerBiLayers } from "../src/components/geolibre/powerBiBridge";
import type { GeoLibreComponent, JsonObject } from "../src/components/geolibre/types";
import type { ResolvedDatasetView } from "../src/render/RenderContext";

const fields: ResolvedDatasetView["fields"] = {
  latitude: { key: "latitude", displayName: "Latitude", type: "measure", dataType: "number", roles: [] },
  longitude: { key: "longitude", displayName: "Longitude", type: "measure", dataType: "number", roles: [] },
  name: { key: "name", displayName: "Name", type: "dimension", dataType: "text", roles: [] },
  shape: { key: "shape", displayName: "Shape", type: "dimension", dataType: "text", roles: [] },
};

const points: ResolvedDatasetView = {
  name: "points",
  rows: [
    { latitude: 30.2, longitude: -97.7, name: "Central" },
    { latitude: 30.4, longitude: -97.9, name: "North" },
    { latitude: 200, longitude: -97.8, name: "Invalid" },
  ],
  fields,
  rowIndices: [0, 1, 2],
  rowKeys: ["logical-0", "logical-1", "logical-2"],
  sourceRowIndices: [[3], [7, 8], [9]],
  sourceRowKeys: [["source-3"], ["source-7", "source-8"], ["source-9"]],
  totalRows: 3,
};

const areas: ResolvedDatasetView = {
  name: "areas",
  rows: [{ name: "Area", shape: JSON.stringify({ type: "Polygon", coordinates: [[[-98, 30], [-97, 30], [-97, 31], [-98, 30]]] }) }],
  fields,
  rowIndices: [0],
  rowKeys: ["area-0"],
  sourceRowIndices: [[11]],
  sourceRowKeys: [["source-11"]],
  totalRows: 1,
};

function component(): GeoLibreComponent {
  return {
    type: "geolibre",
    id: "workspace",
    dataset: "points",
    powerBi: {
      layers: [
        { id: "locations", title: "Locations", geometry: { latitudeField: "latitude", longitudeField: "longitude" }, fields: ["name"] },
        { id: "areas", dataset: "areas", geometry: { type: "geojson", field: "shape" }, fields: ["name"] },
      ],
    },
  };
}

describe("GeoLibre Power BI layer bridge", () => {
  it("hydrates ordinary GeoJSON layers with original Power BI lineage and preserves authored presentation", () => {
    const document = structuredClone(createDefaultGeoLibreProject().document);
    document.layers = [
      { id: "native", name: "Native", type: "geojson", source: { type: "geojson" }, visible: true, opacity: 1, style: { fillColor: "#16a34a" }, metadata: {}, geojson: { type: "FeatureCollection", features: [] } },
      { id: powerBiLayerId("locations"), name: "Renamed in GeoLibre", type: "geojson", source: { type: "geojson" }, visible: false, opacity: 0.35, style: { circleColor: "#f97316", circleRadius: 9 }, metadata: { authored: true } },
    ];
    const result = hydratePowerBiLayers(component(), document, name => name === "areas" ? areas : points);
    expect(result.document.layers.map(layer => layer.id)).toEqual(["native", powerBiLayerId("locations"), powerBiLayerId("areas")]);
    const locations = result.document.layers[1];
    expect(locations).toMatchObject({ name: "Renamed in GeoLibre", visible: false, opacity: 0.35, style: { circleColor: "#f97316", circleRadius: 9 } });
    const features = locations.geojson?.features as JsonObject[];
    expect(features).toHaveLength(2);
    expect(features[0]).toMatchObject({ type: "Feature", geometry: { type: "Point", coordinates: [-97.7, 30.2] }, properties: { name: "Central" } });
    expect(String(features[0].id)).not.toContain("source-3");
    expect(result.warnings.join(" ")).toContain("skipped 1 row");
    const locationIdentities = result.identityByLayer.get(powerBiLayerId("locations"))!;
    expect(locationIdentities.get(String(features[1].id))).toMatchObject({ sourceRowIndices: [7, 8], sourceRowKeys: ["source-7", "source-8"] });
    const areaFeature = (result.document.layers[2].geojson?.features as JsonObject[])[0];
    expect(areaFeature).toMatchObject({ geometry: { type: "Polygon" }, properties: { name: "Area" } });
    expect(featureIdsForSourceRows(result, [8, 11])).toEqual(new Map([
      [powerBiLayerId("locations"), [String(features[1].id)]],
      [powerBiLayerId("areas"), [String(areaFeature.id)]],
    ]));
  });

  it("replaces stale reserved layers and warns instead of inventing unresolved data", () => {
    const document = structuredClone(createDefaultGeoLibreProject().document);
    document.layers = [
      { id: powerBiLayerId("stale"), name: "Stale", type: "geojson", source: { type: "geojson" }, visible: true, opacity: 1, style: {}, metadata: {} },
    ];
    const result = hydratePowerBiLayers(component(), document, () => undefined);
    expect(result.document.layers.some(layer => layer.id === powerBiLayerId("stale"))).toBe(false);
    expect(result.document.layers).toHaveLength(2);
    expect(result.warnings).toHaveLength(2);
    for (const layer of result.document.layers) expect((layer.geojson?.features as JsonObject[])).toEqual([]);
  });
});
