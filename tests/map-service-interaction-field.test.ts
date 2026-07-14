import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArcGisFeatureQueryResult } from "../src/maps/arcgis/arcGisFeatureQuery";

const query = vi.hoisted(() => vi.fn());
vi.mock("../src/maps/arcgis/arcGisFeatureQuery", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/maps/arcgis/arcGisFeatureQuery")>();
  return { ...original, executeArcGisFeatureQuery: query };
});

import { resolveArcGisFeatureLayer } from "../src/components/maps/MapBlock";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

const result: ArcGisFeatureQueryResult = {
  features: [
    {
      objectId: 7,
      attributes: { OBJECTID: 7, facilityName: "North Clinic", status: "Open" },
      geometry: { type: "Point", coordinates: [-95, 30] } as GeoJSON.Point,
    },
  ],
  metadata: {
    id: 0,
    name: "Facilities",
    objectIdField: "OBJECTID",
    geometryType: "esriGeometryPoint",
    capabilities: "Query",
    fields: [
      { name: "OBJECTID", type: "esriFieldTypeOID" },
      { name: "facilityName", type: "esriFieldTypeString" },
      { name: "status", type: "esriFieldTypeString" },
    ],
  },
  requestCount: 1,
  truncated: false,
  objectIdField: "OBJECTID",
  geometryType: "point",
  spatialReference: { wkid: 4326 },
  warnings: [],
  sourceUrl: "https://services.example.test/FeatureServer/0",
  usedCache: false,
  queryStrategy: "pagination",
};

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue(result);
});

describe("ArcGIS service interaction fields", () => {
  it("queries and resolves a reference-only local interaction without Power BI field diagnostics", async () => {
    const layer: MapLayerDefinition = {
      id: "facilities",
      name: "Facilities",
      source: {
        type: "arcgisFeature",
        url: "https://services.example.test/FeatureServer/0",
        mode: "reference",
      },
      interaction: {
        enabled: true,
        trigger: "click",
        internalMode: "highlight",
        externalMode: "none",
        field: "OBJECTID",
        fieldSource: "service",
      },
      popup: {
        enabled: true,
        defaultFieldSource: "service",
        title: "{{OBJECTID}}",
      },
    };
    const resolved = await resolveArcGisFeatureLayer(
      layer,
      {
        rows: [],
        rowIndices: [],
        rowKeys: [],
        fields: {},
        datasetName: "powerbi",
        datasetFound: true,
        layerPath: "/components/0/layers/0",
      },
      new AbortController().signal,
      null,
    );

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ outFields: expect.arrayContaining(["OBJECTID"]) }),
    );
    expect(resolved.features[0]).toMatchObject({
      serviceObjectId: 7,
      serviceAttributes: { OBJECTID: 7, facilityName: "North Clinic" },
      powerBiRowIndices: [],
      powerBiRowKeys: [],
    });
    expect(resolved.interaction).toMatchObject({ field: "OBJECTID", fieldSource: "service", externalMode: "none" });
    expect(resolved.diagnostics.issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MAP_LAYER_FIELD_NOT_FOUND" }),
      ]),
    );
  });
});
