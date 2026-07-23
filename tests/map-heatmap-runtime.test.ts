import { describe, expect, it } from "vitest";
import { heatPointsFromFeatures, normalizeHeatWeight } from "../src/components/maps/LeafletHeatCanvasLayer";
import type { ResolvedMapFeature, ResolvedMapRenderer } from "../src/maps/model/resolvedMapTypes";

function point(id: string, value: unknown, lat = 30): ResolvedMapFeature {
  return {
    id,
    layerId: "heat",
    geometryType: "point",
    geometry: null,
    lat,
    lon: -97,
    powerBiAttributes: { weight: value },
    serviceAttributes: {},
    joinedAttributes: {},
    powerBiRowIndices: [],
    powerBiRowKeys: [],
    selected: false,
  };
}

describe("true map heatmap renderer", () => {
  it("resolves positive weighted points from the exact field namespace", () => {
    const renderer: ResolvedMapRenderer = { type: "heatmap", weightField: "weight", fieldSource: "powerbi" };
    expect(heatPointsFromFeatures([point("a", 10), point("b", "20"), point("zero", 0), point("bad", "x")], renderer)).toEqual([
      { latitude: 30, longitude: -97, weight: 10 },
      { latitude: 30, longitude: -97, weight: 20 },
    ]);
  });

  it("normalizes bounded intensity with minimum opacity", () => {
    expect(normalizeHeatWeight(50, 100, 0.1)).toBeCloseTo(0.55);
    expect(normalizeHeatWeight(500, 100, 0.1)).toBe(1);
    expect(normalizeHeatWeight(0, 100, 0.1)).toBe(0);
  });

  it("updates source points after analytical filtering rather than treating pixels as features", () => {
    const renderer: ResolvedMapRenderer = { type: "heatmap", weightField: "weight", fieldSource: "powerbi", interactivePoints: false };
    const before = heatPointsFromFeatures([point("a", 10), point("b", 20)], renderer);
    const after = heatPointsFromFeatures([point("b", 20)], renderer);
    expect(before).toHaveLength(2);
    expect(after).toEqual([{ latitude: 30, longitude: -97, weight: 20 }]);
  });
});
