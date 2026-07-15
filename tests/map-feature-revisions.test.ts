import { describe, expect, it } from "vitest";
import { resolveMapFeatureRevision } from "../src/components/maps/runtime/mapFeatureRevisions";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

const feature: ResolvedMapFeature = {
  id: "a",
  layerId: "layer",
  geometryType: "polygon",
  geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [0, 0]]] } as GeoJSON.Polygon,
  lat: null,
  lon: null,
  serviceAttributes: { name: "Alpha" },
  powerBiAttributes: {},
  powerBiRowIndices: [],
  powerBiRowKeys: [],
  joinedAttributes: {},
  selected: false,
};
const layer = {
  renderer: { type: "simple", symbol: { color: "#000" } },
  popup: { enabled: true, title: "{{name}}", fields: [], actions: [] },
  tooltip: { enabled: true, template: "{{name}}" },
  opacity: 1,
} as Pick<ResolvedMapLayer, "renderer" | "popup" | "tooltip" | "labels" | "opacity">;

describe("map feature revisions", () => {
  it("keeps geometry stable for visual, opacity, selection, and content changes", () => {
    const initial = resolveMapFeatureRevision(feature, layer);
    const visual = resolveMapFeatureRevision(feature, {
      ...layer,
      renderer: { type: "simple", symbol: { color: "#f00" } },
      opacity: 0.4,
    }, { selected: true, effectiveOpacity: 0.4 });
    const content = resolveMapFeatureRevision(
      { ...feature, serviceAttributes: { name: "Beta" } },
      { ...layer, popup: { ...layer.popup!, title: "Name: {{name}}" } },
    );
    expect(visual.structuralRevision).toBe(initial.structuralRevision);
    expect(content.structuralRevision).toBe(initial.structuralRevision);
    expect(visual.visualRevision).not.toBe(initial.visualRevision);
    expect(content.visualRevision).toBe(initial.visualRevision);
    expect(content.contentRevision).not.toBe(initial.contentRevision);
  });

  it("changes structural revision only when geometry changes", () => {
    const initial = resolveMapFeatureRevision(feature, layer);
    const moved = resolveMapFeatureRevision({
      ...feature,
      geometry: { type: "Polygon", coordinates: [[[2, 2], [3, 2], [2, 2]]] } as GeoJSON.Polygon,
    }, layer);
    expect(moved.structuralRevision).not.toBe(initial.structuralRevision);
  });
});
