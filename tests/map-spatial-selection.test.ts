import { describe, expect, it } from "vitest";
import {
    featureIntersectsSelection,
    resolveMapFeatureSelection,
    selectMapFeaturesByShape,
} from "../src/maps/interactions/mapSpatialSelection";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

function feature(id: string, geometry: unknown, rows: number[] = []): ResolvedMapFeature {
    return {
        id, layerId: "assets", geometryType: "point", geometry: geometry as GeoJSON.GeoJsonObject, lat: null, lon: null,
        serviceAttributes: {}, powerBiAttributes: {}, joinedAttributes: {},
        powerBiRowIndices: rows, powerBiRowKeys: rows.map(index => `row-${index}`), selected: false,
    } as ResolvedMapFeature;
}
const rectangle = { type: "rectangle" as const, bounds: { west: -1, south: -1, east: 1, north: 1 } };

describe("map rectangle and lasso selection", () => {
    it("resolves replace, add, and toggle feature unions deterministically", () => {
        expect(resolveMapFeatureSelection(["a"], ["b", "b"], "replace")).toEqual(["b"]);
        expect(resolveMapFeatureSelection(["a"], ["b", "a"], "add")).toEqual(["a", "b"]);
        expect(resolveMapFeatureSelection(["a", "shared"], ["a", "b"], "toggle")).toEqual(["shared", "b"]);
    });
    it("selects points, crossing lines, and containing polygons without bbox false positives", () => {
        expect(featureIntersectsSelection(feature("point", { type: "Point", coordinates: [0, 0] }), rectangle)).toBe(true);
        expect(featureIntersectsSelection(feature("cross", { type: "LineString", coordinates: [[-2, 0], [2, 0]] }), rectangle)).toBe(true);
        expect(featureIntersectsSelection(feature("outside", { type: "LineString", coordinates: [[-2, 0.8], [0.8, 2]] }), rectangle)).toBe(false);
        expect(featureIntersectsSelection(feature("contains", { type: "Polygon", coordinates: [[[-3, -3], [3, -3], [3, 3], [-3, 3], [-3, -3]]] }), rectangle)).toBe(true);
    });

    it("does not invent connecting segments between MultiPoint coordinates", () => {
        const separated = feature("multi", { type: "MultiPoint", coordinates: [[-2, 0], [2, 0]] });
        expect(featureIntersectsSelection(separated, rectangle)).toBe(false);
    });

    it("does not select an area that is wholly inside a polygon hole", () => {
        const withHole = feature("hole", { type: "Polygon", coordinates: [
            [[-5, -5], [5, -5], [5, 5], [-5, 5], [-5, -5]],
            [[-2, -2], [-2, 2], [2, 2], [2, -2], [-2, -2]],
        ] });
        expect(featureIntersectsSelection(withHole, rectangle)).toBe(false);
    });

    it("returns canonical visible feature identities and synchronized Power BI lineage", () => {
        const visible = {
            id: "assets", name: "Assets", visible: true, sourceType: "powerbi", features: [
                feature("a", { type: "Point", coordinates: [0, 0] }, [2, 1]),
                feature("b", { type: "Point", coordinates: [5, 5] }, [4]),
            ], diagnostics: { warnings: [] }, renderer: { type: "simple" }, labels: { enabled: false }, popup: { enabled: false, fields: [], actions: [] }, tooltip: { enabled: false, fields: [] }, opacity: 1, order: 0,
        } as unknown as ResolvedMapLayer;
        const hidden = { ...visible, id: "hidden", visible: false, features: [feature("hidden", { type: "Point", coordinates: [0, 0] }, [9])] };
        const result = selectMapFeaturesByShape("operations", [visible, hidden], rectangle);
        expect(result.matchedFeatureCount).toBe(1);
        expect(result.featureKeys[0]).toContain("hp-feature");
        expect(result.sourceRowIndices).toEqual([1, 2]);
        expect(result.sourceRowKeys).toEqual(expect.arrayContaining(["row-1", "row-2"]));
    });

    it("uses geometry bounds to prefilter large layers without losing crossing features", () => {
        const outside = Array.from({ length: 600 }, (_value, index) => feature(`outside-${index}`, { type: "Point", coordinates: [20 + index / 100, 20] }));
        const crossing = { ...feature("crossing", { type: "LineString", coordinates: [[-2, 0], [2, 0]] }, [7]), lat: 50, lon: 50 };
        const layer = {
            id: "assets", name: "Assets", visible: true, sourceType: "powerbi", features: [...outside, crossing],
            diagnostics: { warnings: [] }, renderer: { type: "simple" }, labels: { enabled: false }, popup: { enabled: false, fields: [], actions: [] }, tooltip: { enabled: false, fields: [] }, opacity: 1, order: 0,
        } as unknown as ResolvedMapLayer;
        expect(selectMapFeaturesByShape("operations", [layer], rectangle).sourceRowIndices).toEqual([7]);
    });
});
