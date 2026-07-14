import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArcGisFeatureQueryResult } from "../src/maps/arcgis/arcGisFeatureQuery";

const query = vi.hoisted(() => vi.fn());
vi.mock("../src/maps/arcgis/arcGisFeatureQuery", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/maps/arcgis/arcGisFeatureQuery")>();
  return { ...original, executeArcGisFeatureQuery: query };
});

import { resolveArcGisFeatureLayer } from "../src/components/maps/MapBlock";
import { renderResolvedPopup, renderResolvedTooltip } from "../src/components/maps/ResolvedMapPopup";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

const queryResult: ArcGisFeatureQueryResult = {
  features: [{
    objectId: 7,
    attributes: { OBJECTID: 7, facilityName: "North Clinic", status: "Active", riskScore: 9.2 },
    geometry: { type: "Point", coordinates: [-95, 30] } as GeoJSON.Point,
  }],
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
      { name: "riskScore", type: "esriFieldTypeDouble" },
    ],
    drawingInfo: {
      renderer: { type: "simple", symbol: { type: "esriSMS", color: [32, 107, 196, 255], size: 12 } },
      labelingInfo: [{ labelExpression: "[facilityName]", labelPlacement: "esriServerPointLabelPlacementAboveCenter" }],
    },
  },
  requestCount: 2,
  truncated: false,
  objectIdField: "OBJECTID",
  geometryType: "point",
  spatialReference: { wkid: 4326 },
  warnings: [],
  sourceUrl: "https://services.example.test/Facilities/FeatureServer/0",
  usedCache: false,
  queryStrategy: "pagination",
};

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue(queryResult);
});

describe("ArcGIS feature-layer runtime integration", () => {
  it("queries all service namespaces, resolves symbology and labels, and builds popup content", async () => {
    const definition: MapLayerDefinition = {
      id: "facilities",
      name: "Facilities",
      source: {
        type: "arcgisFeature",
        url: "https://services.example.test/Facilities/FeatureServer",
        layerId: 0,
        mode: "reference",
        useServiceRenderer: true,
        useServiceLabels: true,
      },
      filter: { field: "status", fieldSource: "service", operator: "=", value: "Active" },
      visibility: { conditionField: "riskScore", conditionFieldSource: "service", conditionValues: [9.2] },
      popup: {
        enabled: true,
        defaultFieldSource: "service",
        title: "Facility {{OBJECTID}}",
        fields: [{ field: "facilityName", fieldSource: "service", label: "Name" }],
      },
      tooltip: { enabled: true, defaultFieldSource: "service", template: "{{status}}" },
      interaction: { enabled: true, trigger: "click", internalMode: "highlight", externalMode: "none", field: "OBJECTID", fieldSource: "service" },
    };
    const resolved = await resolveArcGisFeatureLayer(
      definition,
      { rows: [], rowIndices: [], rowKeys: [], fields: {}, datasetName: "powerbi", datasetFound: true, layerPath: "/components/0/layers/0" },
      new AbortController().signal,
      null,
    );

    expect(query).toHaveBeenCalledWith(expect.objectContaining({
      url: definition.source.url,
      layerId: 0,
      where: "1=1",
      outFields: expect.arrayContaining(["OBJECTID", "facilityName", "status", "riskScore"]),
      useServiceRenderer: true,
      useServiceLabels: true,
    }));
    expect(resolved.features).toHaveLength(1);
    expect(resolved.features[0]).toMatchObject({
      geometryType: "point",
      geometry: { type: "Point", coordinates: [-95, 30] },
      serviceObjectId: 7,
      powerBiRowKeys: [],
    });
    expect(resolved.renderer.symbol?.radius).toBe(6);
    expect(resolved.labels).toMatchObject({ enabled: true, field: "facilityName", fieldSource: "service" });
    expect(renderResolvedTooltip(resolved.features[0], resolved.tooltip)).toBe("Active");
    expect(renderResolvedPopup(resolved.popup!, resolved.features[0]).element.textContent).toContain("Facility 7");
    expect(resolved.interaction).toMatchObject({ internalMode: "highlight", externalMode: "none", fieldSource: "service" });
    expect(resolved.diagnostics).toMatchObject({ requestCount: 2, featureCount: 1, usedServiceSymbology: true, usedServiceLabels: true });
    expect(resolved.diagnostics.issues).not.toEqual(expect.arrayContaining([expect.objectContaining({ code: "MAP_LAYER_FIELD_NOT_FOUND" })]));
  });
});
