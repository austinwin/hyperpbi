import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeArcGisDynamicIdentify } from "../src/maps/arcgis/arcGisDynamicIdentify";
import { setAllowedHostPatterns } from "../src/maps/arcgis/arcGisHostPolicy";

describe("ArcGIS Dynamic identify", () => {
  beforeEach(() => {
    setAllowedHostPatterns(["https://*"]);
  });

  it("posts click, extent, image, layer, and definition context and converts all results", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          results: [
            {
              layerId: 2,
              layerName: "Counties",
              displayFieldName: "NAME",
              value: "Travis",
              attributes: { OBJECTID: 17, NAME: "Travis" },
              geometryType: "esriGeometryPolygon",
              geometry: {
                rings: [[[-98, 30], [-97, 30], [-97, 31], [-98, 30]]],
              },
            },
            {
              layerId: 0,
              layerName: "Places",
              displayFieldName: "NAME",
              value: "Austin",
              attributes: { FID: 5, NAME: "Austin" },
              geometryType: "esriGeometryPoint",
              geometry: { x: -97.74, y: 30.27 },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await executeArcGisDynamicIdentify({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer",
      latitude: 30.27,
      longitude: -97.74,
      mapExtent: [-99, 29, -96, 32],
      imageWidth: 800,
      imageHeight: 500,
      layerIds: [0, 2],
      layerDefinitions: { 2: "POP2000 > 1000" },
      identify: { tolerance: 8, layerOption: "visible", maxResults: 5 },
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      resultId: "2:17",
      label: "Travis",
      geometry: { type: "Polygon" },
    });
    expect(results[1]).toMatchObject({
      resultId: "0:5",
      geometry: { type: "Point", coordinates: [-97.74, 30.27] },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/MapServer\/identify$/);
    const form = new URLSearchParams(String(init?.body));
    expect(JSON.parse(form.get("geometry")!)).toMatchObject({
      x: -97.74,
      y: 30.27,
    });
    expect(form.get("mapExtent")).toBe("-99,29,-96,32");
    expect(form.get("imageDisplay")).toBe("800,500,96");
    expect(form.get("layers")).toBe("visible:0,2");
    expect(form.get("tolerance")).toBe("8");
    expect(form.get("returnGeometry")).toBe("true");
    expect(form.get("layerDefs")).toContain("POP2000");
  });

  it("rejects non-MapServer URLs and bounds result count", async () => {
    await expect(
      executeArcGisDynamicIdentify({
        url: "https://services.arcgis.com/x/FeatureServer/0",
        latitude: 0,
        longitude: 0,
        mapExtent: [-1, -1, 1, 1],
        imageWidth: 100,
        imageHeight: 100,
      }),
    ).rejects.toThrow(/MapServer/);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            results: Array.from({ length: 4 }, (_, index) => ({
              layerId: 3,
              layerName: "States",
              value: String(index),
              attributes: { OBJECTID: index },
            })),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const limited = await executeArcGisDynamicIdentify({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer",
      latitude: 30,
      longitude: -97,
      mapExtent: [-99, 29, -96, 32],
      imageWidth: 100,
      imageHeight: 100,
      identify: { maxResults: 2 },
    });
    expect(limited.map((result) => result.resultId)).toEqual(["3:0", "3:1"]);
  });
});
