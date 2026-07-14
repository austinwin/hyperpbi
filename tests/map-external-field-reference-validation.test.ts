import { describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { resolveDatasetSchemas } from "../src/data/datasetSchema";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData, NormalizedField } from "../src/data/normalizeData";
import {
  canonicalizeSpecificationFieldReferences,
  specificationFieldReferences,
} from "../src/fields/specificationFieldReferences";

const fields: Record<string, NormalizedField> = {
  facilityId: {
    key: "facilityId",
    displayName: "Facility ID",
    type: "dimension",
    dataType: "text",
    roles: ["values"],
  },
};
const rows = [{ facilityId: "A" }];
const data: NormalizedData = {
  fields,
  rows,
  rowKeys: ["row-0"],
  aggregates: calculateAggregates(rows),
  map: normalizeMapBindings(rows, fields),
};

describe("external map field-reference validation", () => {
  it("preserves ArcGIS service fields without resolving them against Power BI", () => {
    const specification = {
      version: "2.0",
      components: [
        {
          type: "map",
          id: "operations",
          layers: [
            {
              id: "facilities",
              name: "Facilities",
              source: {
                type: "arcgisFeature",
                url: "https://services.example.test/FeatureServer/0",
                mode: "reference",
              },
              renderer: { type: "uniqueValue", field: "status", fieldSource: "service" },
              labels: { enabled: true, field: "facilityName", fieldSource: "service" },
              popup: {
                enabled: true,
                defaultFieldSource: "service",
                title: "Facility {{OBJECTID}}",
                fields: [{ field: "OBJECTID", fieldSource: "service" }],
              },
              tooltip: {
                enabled: true,
                defaultFieldSource: "service",
                template: "{{OBJECTID}}",
              },
              visibility: {
                conditionField: "status",
                conditionFieldSource: "service",
                conditionValues: ["Open"],
              },
              filter: { field: "status", fieldSource: "service", operator: "=", value: "Open" },
              interaction: {
                enabled: true,
                trigger: "click",
                internalMode: "highlight",
                externalMode: "none",
                field: "OBJECTID",
                fieldSource: "service",
              },
            },
          ],
        },
      ],
    };

    const occurrences = specificationFieldReferences(specification);
    expect(occurrences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reference: "OBJECTID", source: "service", path: expect.stringContaining("/popup/title#") }),
        expect.objectContaining({ reference: "OBJECTID", source: "service", path: expect.stringContaining("/tooltip/template#") }),
        expect.objectContaining({ reference: "facilityName", source: "service", path: expect.stringContaining("/labels/field") }),
        expect.objectContaining({ reference: "status", source: "service", path: expect.stringContaining("/filter/0/field") }),
        expect.objectContaining({ reference: "OBJECTID", source: "service", path: expect.stringContaining("/interaction/field") }),
      ]),
    );
    const diagnostics = canonicalizeSpecificationFieldReferences(
      specification,
      data,
      resolveDatasetSchemas(data, {}),
    );
    expect(diagnostics).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MAP_LAYER_FIELD_NOT_FOUND", received: "OBJECTID" }),
      ]),
    );
    expect(JSON.stringify(specification)).toContain("OBJECTID");
  });

  it("preserves joined aliases while continuing to validate Power BI fields", () => {
    const specification = {
      version: "2.0",
      components: [
        {
          type: "map",
          id: "operations",
          layers: [
            {
              id: "joined",
              name: "Joined",
              source: { type: "arcgisFeature", url: "https://services.example.test/FeatureServer/0", mode: "join" },
              join: {
                powerBiField: "missingPowerBiField",
                serviceField: "FACILITY_ID",
                aggregations: [{ field: "facilityId", aggregation: "count", as: "joinedRisk" }],
              },
              popup: {
                enabled: true,
                defaultFieldSource: "joined",
                title: "{{joinedRisk}}",
                fields: [{ field: "joinedRisk", fieldSource: "joined" }],
              },
            },
          ],
        },
      ],
    };
    const diagnostics = canonicalizeSpecificationFieldReferences(
      specification,
      data,
      resolveDatasetSchemas(data, {}),
    );
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MAP_LAYER_FIELD_NOT_FOUND", received: "missingPowerBiField" }),
      ]),
    );
    expect(diagnostics).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ received: "joinedRisk" }),
      ]),
    );
  });
});
