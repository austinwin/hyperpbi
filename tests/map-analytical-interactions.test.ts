import { describe, expect, it } from "vitest";
import {
  applyAnalyticalFilters,
  buildLegendEntries,
  resolveAnalyticalSelection,
  resolveFeatureVisualState,
} from "../src/maps/interactions/mapAnalyticalInteraction";
import { withCanonicalMapFeatureKeys } from "../src/maps/model/mapFeatureIdentity";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

function feature(id: string, category: string, value: number, date = "2026-07-01"): ResolvedMapFeature {
  return {
    id,
    layerId: "assets",
    geometryType: "point",
    geometry: null,
    lat: 30,
    lon: -97,
    powerBiAttributes: { category, value, name: id, date, nullable: id === "b" ? null : "ready" },
    serviceAttributes: {},
    joinedAttributes: {},
    powerBiRowIndices: [value],
    powerBiRowKeys: [`row-${value}`],
    selected: false,
  };
}

function layer(id = "assets"): ResolvedMapLayer {
  return {
    id,
    name: id,
    sourceType: "powerbi",
    geometryType: "point",
    visible: true,
    opacity: 1,
    order: 0,
    features: [feature("a", "Active", 10), feature("b", "Warning", 20), feature("c", "Active", 30, "2026-08-01")],
    renderer: {
      type: "uniqueValue",
      field: "category",
      fieldSource: "powerbi",
      valueMap: new Map([
        ["Active", { fillColor: "#22c55e" }],
        ["Warning", { fillColor: "#f59e0b" }],
      ]),
      valueLabels: new Map([["Active", "Operating"]]),
    },
    legend: {
      showCounts: true,
      showPercentages: true,
      valueField: "value",
      valueFieldSource: "powerbi",
      valueAggregation: "sum",
      order: ["Warning", "Active"],
    },
    diagnostics: {
      featureCount: 3,
      requestCount: 0,
      loading: false,
      sourceType: "powerbi",
      geometryType: "point",
      usedServiceSymbology: false,
      usedServiceLabels: false,
      warnings: [],
    },
    loading: false,
  };
}

describe("shared map analytical interactions", () => {
  it("supports replace, add, remove, toggle, clear, and bounded overflow", () => {
    expect(resolveAnalyticalSelection(["a"], ["b"], "replace")).toEqual({ featureKeys: ["b"], overflowCount: 0 });
    expect(resolveAnalyticalSelection(["a"], ["a", "b"], "add")).toEqual({ featureKeys: ["a", "b"], overflowCount: 0 });
    expect(resolveAnalyticalSelection(["a", "b"], ["a"], "remove").featureKeys).toEqual(["b"]);
    expect(resolveAnalyticalSelection(["a", "b"], ["b", "c"], "toggle").featureKeys).toEqual(["a", "c"]);
    expect(resolveAnalyticalSelection(["a"], [], "clear").featureKeys).toEqual([]);
    expect(resolveAnalyticalSelection([], ["a", "b", "c"], "replace", 2)).toEqual({ featureKeys: ["a", "b"], overflowCount: 1 });
  });

  it("distinguishes selected, external, hovered, dimmed, and filtered states", () => {
    const base = {
      selectedFeatureKeys: new Set(["selected"]),
      externalFeatureKeys: new Set(["external"]),
      hoveredFeatureKeys: new Set(["hovered"]),
      filteredFeatureKeys: new Set(["filtered"]),
      hasEmphasis: true,
    };
    expect(resolveFeatureVisualState({ ...base, featureKey: "selected" })).toMatchObject({ selected: true, dimmed: false });
    expect(resolveFeatureVisualState({ ...base, featureKey: "external" })).toMatchObject({ externallyHighlighted: true, dimmed: false });
    expect(resolveFeatureVisualState({ ...base, featureKey: "hovered" })).toMatchObject({ hovered: true, dimmed: false });
    expect(resolveFeatureVisualState({ ...base, featureKey: "other" })).toMatchObject({ dimmed: true, normal: false });
    expect(resolveFeatureVisualState({ ...base, featureKey: "filtered" })).toMatchObject({ filteredOut: true, dimmed: false });
  });

  it("builds ordered counts, percentages, aggregates, and labels for multiple legends", () => {
    const first = withCanonicalMapFeatureKeys("map", [layer()])[0];
    const second = withCanonicalMapFeatureKeys("map", [{ ...layer("secondary"), features: [feature("d", "Warning", 5)] }])[0];
    const firstEntries = buildLegendEntries("map", first);
    const secondEntries = buildLegendEntries("map", second);
    expect(firstEntries.map((entry) => entry.key)).toEqual(["Warning", "Active"]);
    expect(firstEntries[1]).toMatchObject({ label: "Operating", featureCount: 2, aggregateValue: 40 });
    expect(firstEntries[1].percentage).toBeCloseTo(2 / 3);
    expect(secondEntries.find((entry) => entry.key === "Warning")?.featureCount).toBe(1);
  });

  it("combines legend, category, numeric, date, text, null, top-N, layer scope, and selected filtering without mutating source order", () => {
    const source = withCanonicalMapFeatureKeys("map", [layer()])[0];
    const original = source.features.map((item) => item.id);
    const definitions = [
      { id: "category", type: "categorical" as const, field: "category", layerId: "assets" },
      { id: "range", type: "numericRange" as const, field: "value" },
      { id: "date", type: "dateRange" as const, field: "date" },
      { id: "text", type: "text" as const, field: "name", operator: "contains" as const },
      { id: "null", type: "null" as const, field: "nullable" },
      { id: "top", type: "topN" as const, field: "name", valueField: "value", count: 2 },
    ];
    const filtered = applyAnalyticalFilters(
      [source],
      { assets: ["Active", "Warning"] },
      definitions,
      { category: ["Active", "Warning"], range: [5, 30], date: ["2026-07-01", "2026-08-31"], text: "c", null: "notNull", top: 2 },
      new Set(),
      false,
      "map",
    );
    expect(filtered[0].features.map((item) => item.id)).toEqual(["c"]);
    expect(source.features.map((item) => item.id)).toEqual(original);
    const key = filtered[0].features[0].featureKey!;
    expect(applyAnalyticalFilters(filtered, {}, [], {}, new Set([key]), true, "map")[0].features).toHaveLength(1);
  });
});
