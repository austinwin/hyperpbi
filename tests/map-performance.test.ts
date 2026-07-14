import { describe, expect, it } from "vitest";
import { applyGlobalMapFeatureBudget } from "../src/maps/performance/mapFeatureBudget";
import type { ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

const resolved = (id: string, count: number): ResolvedMapLayer => ({
    id, name: id, sourceType: "powerbi", geometryType: "point", visible: true, opacity: 1, order: 0,
    features: Array.from({ length: count }, (_value, index) => ({ id: `${id}-${index}`, layerId: id, geometryType: "point", geometry: null, lat: index, lon: index, serviceAttributes: {}, powerBiAttributes: {}, powerBiRowIndices: [index], powerBiRowKeys: [`${id}-${index}`], joinedAttributes: {}, selected: false })),
    renderer: { type: "simple" }, diagnostics: { featureCount: count, requestCount: 0, loading: false, sourceType: "powerbi", geometryType: "point", usedServiceSymbology: false, usedServiceLabels: false, warnings: [] }, loading: false,
});

describe("map performance budgets", () => {
    it("truncates deterministically across ordered layers and emits a structured warning", () => {
        const result = applyGlobalMapFeatureBudget([resolved("first", 3), resolved("second", 4)], 5);
        expect(result.map(layer => layer.features.length)).toEqual([3, 2]);
        expect(result[1].features.map(feature => feature.id)).toEqual(["second-0", "second-1"]);
        expect(result[1].diagnostics.issues).toContainEqual(expect.objectContaining({ code: "MAP_GLOBAL_FEATURE_LIMIT" }));
    });
});
