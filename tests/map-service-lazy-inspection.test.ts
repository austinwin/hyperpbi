import { beforeEach, describe, expect, it, vi } from "vitest";

const getJson = vi.hoisted(() => vi.fn());
vi.mock("../src/maps/arcgis/arcGisRestClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/maps/arcgis/arcGisRestClient")>()),
  getArcGisJson: getJson,
}));

import {
  clearArcGisServiceInspectionCache,
  inspectArcGisService,
} from "../src/maps/arcgis/arcGisServiceInspector";

const rootUrl = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer";

describe("lazy ArcGIS service inspection", () => {
  beforeEach(() => {
    clearArcGisServiceInspectionCache();
    getJson.mockReset();
    getJson.mockImplementation(async (url: string) => {
      if (/\/\d+\?f=pjson$/.test(url))
        return {
          id: Number(url.match(/\/(\d+)\?/)?.[1]),
          name: "Selected",
          type: "Feature Layer",
          geometryType: "esriGeometryPolygon",
          objectIdField: "OBJECTID",
          capabilities: "Query",
          maxRecordCount: 2000,
          fields: [{ name: "OBJECTID", type: "esriFieldTypeOID" }],
        };
      return {
        currentVersion: 11,
        mapName: "Large service",
        layers: [
          { id: 0, name: "Group", type: "Group Layer", subLayerIds: [1] },
          { id: 1, name: "Parcels", type: "Feature Layer", parentLayerId: 0 },
        ],
        tables: [{ id: 2, name: "Owners", type: "Table" }],
      };
    });
  });

  it("uses one root request and classifies lightweight items", async () => {
    const result = await inspectArcGisService(rootUrl);
    expect(getJson).toHaveBeenCalledTimes(1);
    expect(result.layers.map((item) => [item.id, item.kind])).toEqual([
      [0, "groupLayer"],
      [1, "spatialLayer"],
      [2, "table"],
    ]);
    expect(result.layers.every((item) => item.metadata === undefined)).toBe(true);
  });

  it("fetches one selected item lazily and reuses successful metadata", async () => {
    await inspectArcGisService(rootUrl);
    const first = await inspectArcGisService(`${rootUrl}/1`);
    expect(getJson).toHaveBeenCalledTimes(2);
    expect(first.selectedLayer).toMatchObject({ id: 1, geometryType: "esriGeometryPolygon" });
    const cached = await inspectArcGisService(`${rootUrl}/1`);
    expect(cached).toBe(first);
    expect(getJson).toHaveBeenCalledTimes(2);
  });

  it("propagates cancellation instead of caching an aborted request", async () => {
    getJson.mockImplementation(
      (_url: string, options: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          options.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          ),
        ),
    );
    const controller = new AbortController();
    const pending = inspectArcGisService(`${rootUrl}/9`, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
