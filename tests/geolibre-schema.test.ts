import { describe, expect, it } from "vitest";
import { createDefaultGeoLibreProject } from "../src/components/geolibre/projectBridge";
import { specificationFieldReferences } from "../src/fields/specificationFieldReferences";
import { validateV2Schema } from "../src/schema/validateV2Schema";

const valid = () => ({
  version: "2.0",
  data: { datasets: { regions: { source: "powerbi", select: ["latitude", "longitude", "shape", "name"] } } },
  components: [{
    type: "geolibre",
    id: "gis",
    dataset: "regions",
    height: 520,
    capabilityProfile: "powerbi-embedded",
    runtime: { channel: "managed", panels: "open", theme: "system" },
    project: createDefaultGeoLibreProject(),
    powerBi: {
      layers: [
        { id: "points", geometry: { latitudeField: "latitude", longitudeField: "longitude" }, fields: ["name"] },
        { id: "shapes", dataset: "regions", geometry: { type: "geojson", field: "shape" }, fields: ["name"] },
      ],
      selection: { enabled: true, externalHighlight: true, maxSelectionCount: 1000 },
    },
  }],
});

describe("GeoLibre component schema", () => {
  it("accepts the strict host schema and exposes every Power BI field reference", () => {
    const specification = valid();
    expect(validateV2Schema(specification).diagnostics.filter(item => item.severity === "error")).toEqual([]);
    expect(specificationFieldReferences(specification)).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "/components/0/powerBi/layers/0/geometry/latitudeField", reference: "latitude", requirement: "numeric", datasetName: "regions" }),
      expect.objectContaining({ path: "/components/0/powerBi/layers/0/geometry/longitudeField", reference: "longitude", requirement: "numeric", datasetName: "regions" }),
      expect.objectContaining({ path: "/components/0/powerBi/layers/0/fields/0", reference: "name", datasetName: "regions" }),
      expect.objectContaining({ path: "/components/0/powerBi/layers/1/geometry/field", reference: "shape", datasetName: "regions" }),
    ]));
  });

  it("rejects unknown host properties, unsafe projects, duplicate bindings, and bad limits", () => {
    const specification = valid();
    const component = specification.components[0] as Record<string, any>;
    component.rawGeoLibreOption = true;
    component.project.document.plugins = { manifestUrls: [], activePluginIds: ["agent"], mapControlPositions: {}, settings: {} };
    component.powerBi.layers[0].initialStyle = { scriptUrl: "https://evil.example/style.js" };
    component.powerBi.layers.push({ id: "points", dataset: "missing", geometry: { type: "script", latitudeField: "latitude" }, opacity: 2 });
    component.powerBi.selection.maxSelectionCount = 20_000;
    const diagnostics = validateV2Schema(specification).diagnostics;
    expect(diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "UNKNOWN_PROPERTY", path: "/components/0/rawGeoLibreOption" }),
      expect.objectContaining({ code: "UNSUPPORTED_ADVANCED_OPTION", path: "/components/0/project" }),
      expect.objectContaining({ code: "UNSUPPORTED_ADVANCED_OPTION", path: "/components/0/powerBi/layers/0/initialStyle" }),
      expect.objectContaining({ code: "DUPLICATE_COMPONENT_ID", path: "/components/0/powerBi/layers/2/id" }),
      expect.objectContaining({ code: "UNKNOWN_DATASET", path: "/components/0/powerBi/layers/2/dataset" }),
      expect.objectContaining({ code: "INVALID_ENUM_VALUE", path: "/components/0/powerBi/layers/2/geometry/type" }),
      expect.objectContaining({ path: "/components/0/powerBi/layers/2/opacity" }),
      expect.objectContaining({ path: "/components/0/powerBi/selection/maxSelectionCount" }),
    ]));
  });
});
