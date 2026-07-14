import { act } from "preact/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const inspect = vi.hoisted(() => vi.fn());
vi.mock("../src/maps/arcgis/arcGisServiceInspector", () => ({
  inspectArcGisService: inspect,
}));

import { button, change, mountMapStudio } from "./map-studio-fixture";

const metadata = (url: string) => ({
  url,
  serviceType: "FeatureServer" as const,
  isLayer: false,
  name: "Facilities",
  publicAccess: true,
  querySupported: true,
  warnings: [],
  errors: [],
  layers: [
    {
      id: 0,
      name: "Sites",
      geometryType: "esriGeometryPoint",
      querySupported: true,
      metadata: {
        id: 0,
        name: "Sites",
        geometryType: "esriGeometryPoint",
        objectIdField: "OBJECTID",
        capabilities: "Query",
        maxRecordCount: 2000,
        spatialReference: { wkid: 4326 },
        fields: [
          { name: "OBJECTID", alias: "Object ID", type: "esriFieldTypeOID" },
          { name: "STATUS", alias: "Status", type: "esriFieldTypeString" },
        ],
        drawingInfo: { renderer: { type: "simple" }, labelingInfo: [] },
      },
    },
    {
      id: 1,
      name: "Regions",
      geometryType: "esriGeometryPolygon",
      querySupported: true,
      metadata: {
        id: 1,
        name: "Regions",
        geometryType: "esriGeometryPolygon",
        objectIdField: "FID",
        capabilities: "Query",
        fields: [
          { name: "FID", type: "esriFieldTypeOID" },
          { name: "REGION", alias: "Region", type: "esriFieldTypeString" },
        ],
      },
    },
  ],
});
const settle = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

describe("metadata-driven ArcGIS authoring", () => {
  beforeEach(() => {
    inspect.mockReset();
    inspect.mockImplementation(async (url: string) => metadata(url));
  });
  it("fetches explicitly, selects root sublayers, and populates service field controls", async () => {
    const mounted = mountMapStudio(undefined, { webAccessAvailable: true });
    act(() => button(mounted.host, "Add ArcGIS feature layer").click());
    change(
      mounted.host.querySelector('[aria-label="ArcGIS service URL"]')!,
      "https://services.arcgis.com/x/FeatureServer",
    );
    expect(inspect).not.toHaveBeenCalled();
    act(() => button(mounted.host, "Fetch service metadata").click());
    await settle();
    const sublayer = mounted.host.querySelector(
      '[aria-label="Service sublayer"]',
    ) as HTMLSelectElement;
    expect(sublayer.options).toHaveLength(3);
    act(() => {
      sublayer.value = "1";
      sublayer.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(mounted.host.textContent).toContain("FID");
    expect(mounted.host.textContent).toContain("REGION");
    act(() => button(mounted.host, "renderer").click());
    const type = mounted.host.querySelector(
      '[aria-label="Renderer type"]',
    ) as HTMLSelectElement;
    act(() => {
      type.value = "uniqueValue";
      type.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(
      Array.from(
        (
          mounted.host.querySelector(
            '[aria-label="field"]',
          ) as HTMLSelectElement
        ).options,
      ).map((item) => item.value),
    ).toContain("REGION");
    mounted.cleanup();
  });
  it("aborts an older metadata request when a newer explicit fetch starts", async () => {
    const signals: AbortSignal[] = [];
    inspect.mockImplementation(
      (_url: string, options: { signal: AbortSignal }) => {
        signals.push(options.signal);
        return new Promise(() => undefined);
      },
    );
    const mounted = mountMapStudio(undefined, { webAccessAvailable: true });
    act(() => button(mounted.host, "Add ArcGIS feature layer").click());
    const input = mounted.host.querySelector(
      '[aria-label="ArcGIS service URL"]',
    ) as HTMLInputElement;
    change(input, "https://services.arcgis.com/x/FeatureServer");
    act(() => button(mounted.host, "Fetch service metadata").click());
    change(input, "https://services.arcgis.com/y/FeatureServer");
    act(() => button(mounted.host, "Fetch service metadata").click());
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    mounted.cleanup();
  });
});
