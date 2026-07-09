// ── Map Renderer Runtime Tests ────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { featureStyle, featureStyleWithDomain, computeFeatureDomain } from "../src/maps/renderers/mapFeatureSymbol";
import type { ResolvedMapFeature, ResolvedMapRenderer } from "../src/maps/model/resolvedMapTypes";

function makeFeature(overrides?: Partial<ResolvedMapFeature>): ResolvedMapFeature {
    return {
        id: "f1",
        layerId: "l1",
        geometryType: "point",
        geometry: null,
        lat: 29.7,
        lon: -95.3,
        serviceAttributes: { CODE: "ABC", VALUE: 50 },
        powerBiAttributes: { name: "Test", value: 100 },
        powerBiRowIndices: [0],
        powerBiRowKeys: ["r0"],
        joinedAttributes: { combined: 75 },
        selected: false,
        ...overrides,
    };
}

describe("Feature Style Renderer", () => {
    describe("simple", () => {
        it("returns default when no symbol", () => {
            const renderer: ResolvedMapRenderer = { type: "simple" };
            const style = featureStyle(makeFeature(), renderer);
            expect(style.color).toBeDefined();
            expect(style.radius).toBeGreaterThan(0);
        });

        it("uses configured symbol", () => {
            const renderer: ResolvedMapRenderer = {
                type: "simple",
                symbol: { color: "#ff0000", radius: 10, fillOpacity: 0.5 },
            };
            const style = featureStyle(makeFeature(), renderer);
            expect(style.color).toBe("#ff0000");
            expect(style.radius).toBe(10);
            expect(style.fillOpacity).toBe(0.5);
        });
    });

    describe("uniqueValue", () => {
        it("matches value to symbol", () => {
            const valueMap = new Map<string, any>();
            valueMap.set("ABC", { color: "#00ff00", radius: 8 });

            const renderer: ResolvedMapRenderer = {
                type: "uniqueValue",
                field: "CODE",
                fieldSource: "service",
                valueMap,
                defaultSymbol: { color: "#0000ff", radius: 6 },
            };

            const style = featureStyle(makeFeature(), renderer);
            expect(style.color).toBe("#00ff00");
            expect(style.radius).toBe(8);
        });

        it("falls back to default symbol for unmatched value", () => {
            const valueMap = new Map<string, any>();
            valueMap.set("XYZ", { color: "#00ff00" });

            const renderer: ResolvedMapRenderer = {
                type: "uniqueValue",
                field: "CODE",
                fieldSource: "service",
                valueMap,
                defaultSymbol: { color: "#cccccc", radius: 5 },
            };

            const style = featureStyle(makeFeature(), renderer);
            expect(style.color).toBe("#cccccc");
        });
    });

    describe("classBreaks", () => {
        it("matches value to break class", () => {
            const renderer: ResolvedMapRenderer = {
                type: "classBreaks",
                field: "VALUE",
                fieldSource: "service",
                breaks: [
                    { min: 0, max: 25, symbol: { color: "#00ff00", radius: 4 } },
                    { min: 26, max: 75, symbol: { color: "#ffff00", radius: 8 } },
                    { min: 76, max: 100, symbol: { color: "#ff0000", radius: 12 } },
                ],
            };

            const style = featureStyle(makeFeature(), renderer);
            // VALUE is 50, should match second break
            expect(style.color).toBe("#ffff00");
            expect(style.radius).toBe(8);
        });

        it("falls back to default for out-of-range values", () => {
            const renderer: ResolvedMapRenderer = {
                type: "classBreaks",
                field: "VALUE",
                fieldSource: "service",
                breaks: [
                    { min: 0, max: 25, symbol: { color: "#00ff00" } },
                ],
                defaultSymbol: { color: "#999999" },
            };

            const style = featureStyle(makeFeature(), renderer);
            expect(style.color).toBe("#999999");
        });
    });

    describe("continuousColor", () => {
        it("computes color with domain", () => {
            const features = [
                makeFeature({ serviceAttributes: { VALUE: 0 } }),
                makeFeature({ id: "f2", serviceAttributes: { VALUE: 100 } }),
            ];

            const renderer: ResolvedMapRenderer = {
                type: "continuousColor",
                field: "VALUE",
                fieldSource: "service",
                minColor: "#0000ff",
                maxColor: "#ff0000",
            };

            const domain = computeFeatureDomain(features, "VALUE", "service");
            expect(domain).toEqual([0, 100]);

            const style = featureStyleWithDomain(features[0], renderer, domain!);
            expect(style.color).toBeDefined();
            expect(style.fillColor).toBeDefined();
        });

        it("handles single-value domain without divide-by-zero", () => {
            const features = [makeFeature({ serviceAttributes: { VALUE: 50 } })];
            const renderer: ResolvedMapRenderer = {
                type: "continuousColor",
                field: "VALUE",
                fieldSource: "service",
            };

            const domain = computeFeatureDomain(features, "VALUE", "service");
            expect(domain).toEqual([50, 50]);

            const style = featureStyleWithDomain(features[0], renderer, domain!);
            expect(style.color).toBeDefined();
        });

        it("handles non-numeric values", () => {
            const features = [
                makeFeature({ serviceAttributes: { VALUE: "abc" } }),
                makeFeature({ id: "f2", serviceAttributes: { VALUE: 50 } }),
            ];

            const domain = computeFeatureDomain(features, "VALUE", "service");
            expect(domain).toEqual([50, 50]);
        });
    });

    describe("proportionalSize", () => {
        it("computes size with domain", () => {
            const features = [
                makeFeature({ serviceAttributes: { VALUE: 0 } }),
                makeFeature({ id: "f2", serviceAttributes: { VALUE: 100 } }),
            ];

            const renderer: ResolvedMapRenderer = {
                type: "proportionalSize",
                field: "VALUE",
                fieldSource: "service",
                minSize: 4,
                maxSize: 24,
                baseColor: "#3388ff",
            };

            const domain = computeFeatureDomain(features, "VALUE", "service");
            expect(domain).toEqual([0, 100]);

            const style = featureStyleWithDomain(features[0], renderer, domain!);
            expect(style.radius).toBe(4);

            const styleMax = featureStyleWithDomain(features[1], renderer, domain!);
            expect(styleMax.radius).toBe(24);
        });
    });

    describe("service renderer", () => {
        it("returns default style", () => {
            const renderer: ResolvedMapRenderer = { type: "service" };
            const style = featureStyle(makeFeature(), renderer);
            expect(style.color).toBeDefined();
        });
    });
});
