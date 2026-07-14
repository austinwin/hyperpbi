import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArcGisFeatureQueryResult } from "../src/maps/arcgis/arcGisFeatureQuery";

const query = vi.hoisted(() => vi.fn());
vi.mock("../src/maps/arcgis/arcGisFeatureQuery", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/maps/arcgis/arcGisFeatureQuery")>();
  return { ...original, executeArcGisFeatureQuery: query };
});

import { resolveArcGisFeatureLayer } from "../src/components/maps/MapBlock";
import { renderResolvedPopup } from "../src/components/maps/ResolvedMapPopup";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

const result: ArcGisFeatureQueryResult = {
  features: [{
    objectId: 11,
    attributes: { OBJECTID: 11, FACILITY_CODE: "A-1", facilityName: "Service Clinic" },
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
      { name: "FACILITY_CODE", type: "esriFieldTypeString" },
      { name: "facilityName", type: "esriFieldTypeString" },
    ],
  },
  requestCount: 2,
  truncated: false,
  objectIdField: "OBJECTID",
  geometryType: "point",
  spatialReference: { wkid: 4326 },
  warnings: [],
  sourceUrl: "https://services.example.test/Facilities/FeatureServer/0",
  usedCache: false,
  queryStrategy: "keyBatches",
};

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue(result);
});

describe("ArcGIS joined popup runtime", () => {
  it("retains Power BI lineage, service attributes, and joined aliases in one popup", async () => {
    const definition: MapLayerDefinition = {
      id: "joined-facilities",
      name: "Joined facilities",
      source: { type: "arcgisFeature", url: "https://services.example.test/Facilities/FeatureServer/0", mode: "join" },
      join: {
        enabled: true,
        powerBiField: "facilityCode",
        serviceField: "FACILITY_CODE",
        normalization: ["trim", "upper"],
        powerBiDuplicatePolicy: "aggregate",
        serviceDuplicatePolicy: "first",
        unmatchedPolicy: "diagnose",
        aggregations: [{ field: "risk", aggregation: "sum", as: "totalRisk" }],
      },
      popup: {
        enabled: true,
        defaultFieldSource: "joined",
        title: "Risk {{totalRisk}}",
        fields: [
          { field: "displayName", fieldSource: "powerbi", label: "Power BI" },
          { field: "OBJECTID", fieldSource: "service", label: "Service ID" },
          { field: "totalRisk", fieldSource: "joined", label: "Risk" },
        ],
      },
      interaction: { enabled: true, trigger: "click", internalMode: "highlight", externalMode: "selection", field: "displayName", fieldSource: "powerbi" },
    };
    const fields = {
      facilityCode: { key: "facilityCode", displayName: "Code", type: "dimension" as const, dataType: "text" as const, roles: ["values"], origin: "powerbi-column" as const, sourceTable: "Facilities", sourceColumn: "Code" },
      displayName: { key: "displayName", displayName: "Name", type: "dimension" as const, dataType: "text" as const, roles: ["values"], origin: "powerbi-column" as const, sourceTable: "Facilities", sourceColumn: "Name" },
      risk: { key: "risk", displayName: "Risk", type: "measure" as const, dataType: "number" as const, roles: ["values"], origin: "powerbi-measure" as const, sourceTable: "Facilities", sourceColumn: "Risk" },
    };
    const resolved = await resolveArcGisFeatureLayer(
      definition,
      {
        rows: [{ facilityCode: " a-1 ", displayName: "Power BI Clinic", risk: 4 }, { facilityCode: "A-1", displayName: "Backup", risk: 6 }],
        rowIndices: [0, 1],
        rowKeys: ["row-0", "row-1"],
        sourceRowIndices: [[0], [1]],
        sourceRowKeys: [["row-0"], ["row-1"]],
        fields,
        datasetName: "powerbi",
        datasetFound: true,
        layerPath: "/components/0/layers/0",
      },
      new AbortController().signal,
      null,
    );

    expect(query).toHaveBeenCalledWith(expect.objectContaining({
      joinKeys: expect.objectContaining({ field: "FACILITY_CODE", values: [" a-1 ", "A-1"] }),
      outFields: expect.arrayContaining(["OBJECTID", "FACILITY_CODE"]),
    }));
    const feature = resolved.features[0];
    expect(feature.powerBiAttributes.displayName).toBe("Power BI Clinic");
    expect(feature.serviceAttributes.OBJECTID).toBe(11);
    expect(feature.joinedAttributes.totalRisk).toBe(10);
    expect(feature.powerBiRowKeys).toEqual(["row-0", "row-1"]);
    const popup = renderResolvedPopup(resolved.popup!, feature).element.textContent ?? "";
    expect(popup).toContain("Risk 10");
    expect(popup).toContain("Power BI Clinic");
    expect(popup).toContain("11");
    expect(resolved.interaction).toMatchObject({ externalMode: "selection", fieldSource: "powerbi" });
  });
});
