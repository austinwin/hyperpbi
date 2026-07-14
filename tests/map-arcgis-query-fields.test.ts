import { describe, expect, it } from "vitest";
import { collectArcGisQueryFields } from "../src/maps/arcgis/mapArcGisQueryFields";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

describe("ArcGIS query field namespaces", () => {
  it("requests only service-origin fields plus the service join key", () => {
    const layer: MapLayerDefinition = {
      id: "joined",
      name: "Joined",
      source: {
        type: "arcgisFeature",
        url: "https://services.arcgis.com/x/FeatureServer/0",
        mode: "join",
        outFields: ["EXPLICIT"],
      },
      join: {
        enabled: true,
        powerBiField: "local_key",
        serviceField: "SERVICE_KEY",
        aggregations: [
          { field: "sales", aggregation: "sum", as: "joined_sales" },
        ],
      },
      renderer: {
        type: "uniqueValue",
        field: "local_status",
        fieldSource: "powerbi",
      },
      labels: { enabled: true, field: "SERVICE_NAME", fieldSource: "service" },
      popup: {
        enabled: true,
        fields: [
          { field: "joined_sales", fieldSource: "joined" },
          { field: "SERVICE_TYPE", fieldSource: "service" },
        ],
      },
      tooltip: {
        enabled: true,
        fields: [{ field: "local_note", fieldSource: "powerbi" }],
      },
      visibility: {
        conditionField: "joined_sales",
        conditionFieldSource: "joined",
        conditionValues: [1],
      },
      filter: [
        {
          field: "SERVICE_ACTIVE",
          fieldSource: "service",
          operator: "=",
          value: 1,
        },
      ],
    };
    expect(
      collectArcGisQueryFields(
        layer,
        layer.source as Extract<
          MapLayerDefinition["source"],
          { type: "arcgisFeature" }
        >,
      ),
    ).toEqual(
      expect.arrayContaining([
        "SERVICE_KEY",
        "SERVICE_NAME",
        "SERVICE_TYPE",
        "SERVICE_ACTIVE",
        "EXPLICIT",
      ]),
    );
    const fields = collectArcGisQueryFields(
      layer,
      layer.source as Extract<
        MapLayerDefinition["source"],
        { type: "arcgisFeature" }
      >,
    );
    expect(fields).not.toContain("local_key");
    expect(fields).not.toContain("local_status");
    expect(fields).not.toContain("local_note");
    expect(fields).not.toContain("joined_sales");
  });
});
