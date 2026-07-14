import { describe, expect, it } from "vitest";
import { executeMapJoin } from "../src/maps/join/mapJoinEngine";
import type { MapJoinDefinition } from "../src/schema/mapSchema";
import type { DataRow } from "../src/data/normalizeData";

const feature = (key: string, objectId = 1) => ({
  objectId,
  attributes: { KEY: key },
  geometry: { type: "Point", coordinates: [0, 0] } as GeoJSON.Point,
});
const run = (
  rows: DataRow[],
  serviceFeatures: ReturnType<typeof feature>[],
  overrides: Partial<MapJoinDefinition> = {},
) => executeMapJoin({
  powerBiRows: rows,
  powerBiRowIndices: rows.map((_row, index) => index),
  powerBiRowKeys: rows.map((_row, index) => `row-${index}`),
  serviceFeatures,
  definition: {
    enabled: true,
    powerBiField: "key",
    serviceField: "KEY",
    cardinality: "oneToOne",
    normalization: ["trim", "upper"],
    powerBiDuplicatePolicy: "aggregate",
    serviceDuplicatePolicy: "first",
    ...overrides,
  },
  layerId: "cardinality",
});

describe("map join cardinality", () => {
  it("accepts clean one-to-one keys", () => {
    const result = run([{ key: "A" }], [feature("A")]);
    expect(result.diagnostics).toMatchObject({
      cardinality: "oneToOne",
      cardinalityValid: true,
      powerBiCardinalityViolationCount: 0,
      serviceCardinalityViolationCount: 0,
    });
  });

  it("diagnoses Power BI and normalization-induced one-to-one duplicates", () => {
    const result = run([{ key: " a " }, { key: "A" }], [feature("A")]);
    expect(result.diagnostics.cardinalityValid).toBe(false);
    expect(result.diagnostics.powerBiCardinalityViolationCount).toBe(1);
    expect(result.diagnostics.samplePowerBiCardinalityViolations).toEqual(["A"]);
    expect(result.warnings.join(" ")).toContain("MAP_JOIN_CARDINALITY_POWERBI_VIOLATION");
  });

  it("diagnoses service duplicates while honoring first and all deterministically", () => {
    const first = run([{ key: "A" }], [feature("A", 1), feature("A", 2)]);
    expect(first.features).toHaveLength(1);
    expect(first.diagnostics.serviceCardinalityViolationCount).toBe(1);
    const all = run(
      [{ key: "A" }],
      [feature("A", 1), feature("A", 2)],
      { serviceDuplicatePolicy: "all" },
    );
    expect(all.features).toHaveLength(2);
    expect(all.diagnostics.cardinalityValid).toBe(false);
  });

  it("allows many Power BI rows for valid many-to-one aggregation", () => {
    const result = run(
      [{ key: "A", amount: 2 }, { key: "A", amount: 3 }],
      [feature("A")],
      {
        cardinality: "manyToOne",
        aggregations: [{ field: "amount", aggregation: "sum", as: "total" }],
      },
    );
    expect(result.diagnostics.cardinalityValid).toBe(true);
    expect(result.features[0].joinedAttributes.total).toBe(5);
  });

  it("bounds violation samples", () => {
    const rows = Array.from({ length: 30 }, (_unused, index) => ({ key: `K${Math.floor(index / 2)}` }));
    const services = Array.from({ length: 15 }, (_unused, index) => feature(`K${index}`, index + 1));
    const result = run(rows, services);
    expect(result.diagnostics.powerBiCardinalityViolationCount).toBe(15);
    expect(result.diagnostics.samplePowerBiCardinalityViolations).toHaveLength(10);
  });
});
