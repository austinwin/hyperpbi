import { describe, expect, it } from "vitest";
import {
  aggregateMapJoinValues,
  numericAggregationValues,
} from "../src/maps/join/mapJoinAggregation";

const aggregate = (aggregation: "count" | "distinctCount" | "sum" | "avg" | "min" | "max" | "first" | "last", values: unknown[]) =>
  aggregateMapJoinValues({ field: "value", aggregation, as: aggregation }, values);

describe("map join aggregation normalization", () => {
  it("separates blanks, finite values, and discarded values", () => {
    expect(numericAggregationValues([null, undefined, "", "  ", 0, "2.5", "x", NaN, Infinity, true])).toEqual({
      valid: [0, 2.5],
      blankCount: 4,
      discardedCount: 4,
    });
  });

  it("returns null for empty numeric groups while retaining legitimate zero", () => {
    for (const operation of ["sum", "avg", "min", "max"] as const)
      expect(aggregate(operation, [null, " ", "no"]).value).toBeNull();
    expect(aggregate("sum", [0, "0"]).value).toBe(0);
  });

  it("skips blanks for first, last, count, and stable distinct count", () => {
    const values = ["", null, "first", "first", "last", " "];
    expect(aggregate("first", values).value).toBe("first");
    expect(aggregate("last", values).value).toBe("last");
    expect(aggregate("count", values).value).toBe(3);
    expect(aggregate("distinctCount", values).value).toBe(2);
  });

  it("reports bounded counts without retaining row data", () => {
    const result = aggregate("avg", [1, "2", "", "bad"]);
    expect(result.value).toBe(1.5);
    expect(result.diagnostic).toEqual({
      alias: "avg",
      field: "value",
      aggregation: "avg",
      inputCount: 4,
      validCount: 2,
      blankCount: 1,
      discardedCount: 1,
    });
  });
});
