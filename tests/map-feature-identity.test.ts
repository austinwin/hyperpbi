import { describe, expect, it } from "vitest";
import {
  createMapFeatureKey,
  withCanonicalMapFeatureKeys,
} from "../src/maps/model/mapFeatureIdentity";
import type { ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

const layer = (id: string, sourceUrl: string): ResolvedMapLayer => ({
  id,
  name: id,
  sourceType: "arcgisFeature",
  geometryType: "point",
  visible: true,
  opacity: 1,
  order: 0,
  features: [{
    id: "7",
    layerId: id,
    geometryType: "point",
    geometry: null,
    lat: 30,
    lon: -95,
    serviceAttributes: {},
    powerBiAttributes: {},
    powerBiRowIndices: [],
    powerBiRowKeys: [],
    joinedAttributes: {},
    selected: false,
  }],
  renderer: { type: "simple", symbol: {} },
  diagnostics: {
    featureCount: 1,
    requestCount: 1,
    loading: false,
    sourceType: "arcgisFeature",
    sourceUrl,
    geometryType: "point",
    usedServiceSymbology: false,
    usedServiceLabels: false,
    warnings: [],
  },
  loading: false,
});

describe("canonical map feature identity", () => {
  it("separates maps, layers, services, and delimiter-containing IDs", () => {
    const base = createMapFeatureKey("map", "layer", "service", "7");
    expect(createMapFeatureKey("map-2", "layer", "service", "7")).not.toBe(base);
    expect(createMapFeatureKey("map", "layer-2", "service", "7")).not.toBe(base);
    expect(createMapFeatureKey("map", "layer", "service-2", "7")).not.toBe(base);
    expect(createMapFeatureKey("a|b", "c", "d", "e")).not.toBe(
      createMapFeatureKey("a", "b|c", "d", "e"),
    );
  });

  it("prevents duplicate object IDs in different layers from cross-selecting", () => {
    const resolved = withCanonicalMapFeatureKeys("operations", [
      layer("facilities", "https://example.test/FeatureServer/0"),
      layer("districts", "https://example.test/FeatureServer/1"),
    ]);
    expect(resolved[0].features[0].featureKey).not.toBe(
      resolved[1].features[0].featureKey,
    );
    expect(resolved[0].features[0].id).toBe("7");
  });
});

