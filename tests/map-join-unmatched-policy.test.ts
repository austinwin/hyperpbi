import { describe, expect, it } from "vitest";
import { executeMapJoin } from "../src/maps/join/mapJoinEngine";

function run(policy: "ignore" | "warn" | "diagnose", includeMismatch = true) {
  const rows = includeMismatch ? [{ key: "A" }, { key: "B" }, { key: "" }] : [{ key: "A" }];
  return executeMapJoin({
    powerBiRows: rows,
    powerBiRowIndices: rows.map((_row, index) => index),
    powerBiRowKeys: rows.map((_row, index) => String(index)),
    serviceFeatures: [
      { objectId: 1, attributes: { KEY: "A" }, geometry: null },
      ...(includeMismatch ? [{ objectId: 2, attributes: { KEY: "C" }, geometry: null }] : []),
    ],
    definition: {
      enabled: true,
      powerBiField: "key",
      serviceField: "KEY",
      unmatchedPolicy: policy,
      normalization: ["trim", "upper"],
    },
    layerId: "policy-layer",
  });
}

describe("map join unmatched policy", () => {
  it("computes details without a warning for ignore", () => {
    const result = run("ignore");
    expect(result.warnings).toEqual([]);
    expect(result.diagnostics.unmatchedPowerBiKeyCount).toBe(1);
    expect(result.diagnostics.blankPowerBiKeyCount).toBe(1);
  });

  it("emits one bounded mismatch warning for warn", () => {
    const result = run("warn");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("matched 1 of 2 normalized Power BI keys");
    expect(result.warnings[0]).not.toContain("[B]");
  });

  it("requests detailed diagnostics without forcing a user-facing warning", () => {
    const result = run("diagnose");
    expect(result.warnings).toEqual([]);
    expect(result.diagnostics.detailedDiagnosticsRequested).toBe(true);
    expect(result.diagnostics.sampleUnmatchedPowerBiKeys).toEqual(["B"]);
    expect(result.diagnostics.sampleUnmatchedServiceKeys).toEqual(["C"]);
  });

  it("does not warn when every normalized key matches", () => {
    expect(run("warn", false).warnings).toEqual([]);
  });
});
