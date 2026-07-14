import { describe, expect, it } from "vitest";
import { specificationFieldReferences } from "../src/fields/specificationFieldReferences";
import { collectArcGisQueryFields } from "../src/maps/arcgis/mapArcGisQueryFields";
import type { MapLayerDefinition } from "../src/schema/mapSchema";
import type { ArcGisFeatureLayerSource } from "../src/schema/mapSchema";

describe("map popup and tooltip template field sources", () => {
  it("uses authored service defaults for validation traversal and ArcGIS outFields", () => {
    const layer: MapLayerDefinition = {
      id: "facilities",
      name: "Facilities",
      source: {
        type: "arcgisFeature",
        url: "https://services.example.test/FeatureServer/0",
        mode: "reference",
      },
      popup: {
        enabled: true,
        defaultFieldSource: "service",
        title: "Facility {{OBJECTID}}",
        html: "<strong>{{facilityName}}</strong>",
      },
      tooltip: {
        enabled: true,
        defaultFieldSource: "service",
        template: "{{status}}",
      },
    };
    const specification = { version: "2.0", components: [{ type: "map", id: "map", layers: [layer] }] };
    expect(specificationFieldReferences(specification)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reference: "OBJECTID", source: "service" }),
        expect.objectContaining({ reference: "facilityName", source: "service" }),
        expect.objectContaining({ reference: "status", source: "service" }),
      ]),
    );
    expect(collectArcGisQueryFields(layer, layer.source as ArcGisFeatureLayerSource)).toEqual(
      expect.arrayContaining(["OBJECTID", "facilityName", "status"]),
    );
  });

  it("keeps joined template aliases out of ArcGIS service outFields", () => {
    const layer: MapLayerDefinition = {
      id: "joined",
      name: "Joined",
      source: {
        type: "arcgisFeature",
        url: "https://services.example.test/FeatureServer/0",
        mode: "join",
      },
      join: {
        enabled: true,
        powerBiField: "facilityId",
        serviceField: "FACILITY_ID",
        aggregations: [{ field: "risk", aggregation: "max", as: "joinedRisk" }],
      },
      popup: { enabled: true, defaultFieldSource: "joined", title: "Risk {{joinedRisk}}" },
      tooltip: { enabled: true, defaultFieldSource: "joined", template: "{{joinedRisk}}" },
    };
    const occurrences = specificationFieldReferences({ version: "2.0", components: [{ type: "map", id: "map", layers: [layer] }] });
    expect(occurrences.filter((item) => item.reference === "joinedRisk").every((item) => item.source === "joined")).toBe(true);
    expect(collectArcGisQueryFields(layer, layer.source as ArcGisFeatureLayerSource)).not.toContain("joinedRisk");
  });
});
