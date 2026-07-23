/* eslint-disable powerbi-visuals/no-http-string -- Intentionally invalid URLs exercise HTTPS validation. */
import { describe, expect, it } from "vitest";
import { validateV2Schema } from "../src/schema/validateV2Schema";

describe("analytical map schema validation", () => {
  it("validates bounds and types for new analytical controls", () => {
    const result = validateV2Schema({
      version: "2.0",
      components: [{
        type: "map",
        id: "map",
        legend: { enabled: "yes", maxHeight: 20 },
        toolbar: { selection: "yes", selectedCount: 1 },
        tools: {
          circleSelection: { enabled: true, radiusMeters: -1 },
          selection: { maxSelectionCount: 0, powerBiIdentityLimit: 1.5 },
          coordinateDisplay: { enabled: true, precision: 10 },
        },
        quickFilters: [
          { id: "status", type: "categorical", field: "status", count: 0 },
          { id: "status", type: "text", field: "", operator: "regex" },
        ],
        layers: [],
      }],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/legend/enabled" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/legend/maxHeight" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/toolbar/selection" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/tools/circleSelection/radiusMeters" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/tools/selection/maxSelectionCount" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/tools/selection/powerBiIdentityLimit" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/tools/coordinateDisplay/precision" }),
      expect.objectContaining({ code: "DUPLICATE_COMPONENT_ID", path: "/components/0/quickFilters/1/id" }),
      expect.objectContaining({ code: "MISSING_REQUIRED_PROPERTY", path: "/components/0/quickFilters/1/field" }),
      expect.objectContaining({ code: "INVALID_ENUM_VALUE", path: "/components/0/quickFilters/1/operator" }),
    ]));
  });

  it("rejects unsafe sources and invalid heatmap, legend, and icon settings", () => {
    const result = validateV2Schema({
      version: "2.0",
      components: [{
        type: "map",
        id: "map",
        layers: [
          {
            id: "tiles",
            name: "Tiles",
            source: { type: "xyz", url: "http://tiles.example.com/{z}/{x}.png", minZoom: -1 },
          },
          {
            id: "geojson",
            name: "GeoJSON",
            source: { type: "geoJson", url: "http://example.com/data.json", data: { type: "BadGeometry" } },
            renderer: {
              type: "heatmap",
              radius: 500,
              minOpacity: 2,
              minZoom: 15,
              maxZoom: 4,
              gradient: { "1.5": 4 },
            },
            legend: {
              type: "categorical",
              interactive: "yes",
              maxHeight: 40,
              order: [{ unsafe: true }],
              labels: { status: 1 },
            },
          },
          {
            id: "icons",
            name: "Icons",
            source: { type: "powerbi", bindings: { latitude: "latitude", longitude: "longitude" } },
            renderer: {
              type: "icon",
              symbol: {
                shape: "icon",
                icon: { type: "builtIn", name: "not-a-governed-icon", svg: "<svg/>", size: [-1, 20] },
                dimmedOpacity: 2,
                anchor: [1],
                showValue: "yes",
              },
            },
          },
        ],
      }],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/0/source/url" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/0/source/minZoom" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/source/url" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/source/data" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/renderer/radius" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/renderer/minOpacity" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/renderer/maxZoom" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/renderer/gradient/1.5" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/legend/interactive" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/1/legend/order" }),
      expect.objectContaining({ code: "UNKNOWN_PROPERTY", path: "/components/0/layers/2/renderer/symbol/icon/svg" }),
      expect.objectContaining({ code: "INVALID_ENUM_VALUE", path: "/components/0/layers/2/renderer/symbol/icon/name" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/2/renderer/symbol/icon/size" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/2/renderer/symbol/dimmedOpacity" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/2/renderer/symbol/anchor" }),
      expect.objectContaining({ code: "INVALID_PROPERTY_TYPE", path: "/components/0/layers/2/renderer/symbol/showValue" }),
    ]));
  });
});
