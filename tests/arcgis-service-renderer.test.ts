// ── ArcGIS Service Renderer Tests ─────────────────────────────────────
import { describe, it, expect } from "vitest";
import { adaptArcGisRenderer, arcGisSymbolToResolved, adaptArcGisLabels } from "../src/maps/renderers/arcGisRendererAdapter";
import type { ArcGisRendererDef, ArcGisLabelInfo } from "../src/maps/arcgis/arcGisServiceTypes";

describe("ArcGIS Renderer Adapter", () => {
    describe("simple renderer", () => {
        it("converts esriSMS point symbol", () => {
            const renderer: ArcGisRendererDef = {
                type: "simple",
                symbol: {
                    type: "esriSMS",
                    color: [51, 136, 255, 255],
                    size: 12,
                    outline: { color: [51, 51, 51, 255], width: 1 },
                },
            };

            const result = adaptArcGisRenderer(renderer);
            expect(result.usedServiceSymbology).toBe(true);
            expect(result.renderer.type).toBe("simple");
            expect(result.renderer.symbol?.color).toMatch(/rgb/);
            expect(result.renderer.symbol?.radius).toBe(6);
        });

        it("converts esriSLS line symbol", () => {
            const renderer: ArcGisRendererDef = {
                type: "simple",
                symbol: {
                    type: "esriSLS",
                    color: [255, 0, 0, 255],
                    width: 3,
                },
            };

            const result = adaptArcGisRenderer(renderer);
            expect(result.renderer.symbol?.color).toMatch(/rgba?\(255,\s*0,\s*0/);
            expect(result.renderer.symbol?.weight).toBe(3);
        });

        it("converts esriSFS fill symbol", () => {
            const renderer: ArcGisRendererDef = {
                type: "simple",
                symbol: {
                    type: "esriSFS",
                    color: [0, 128, 0, 128],
                    outline: { color: [0, 64, 0, 255], width: 1 },
                },
            };

            const result = adaptArcGisRenderer(renderer);
            expect(result.renderer.symbol?.fillColor).toMatch(/rgba?\(0,\s*128,\s*0/);
            expect(result.renderer.symbol?.outlineColor).toMatch(/rgba?\(0,\s*64,\s*0/);
        });
    });

    describe("uniqueValue renderer", () => {
        it("converts unique value infos", () => {
            const renderer: ArcGisRendererDef = {
                type: "uniqueValue",
                field1: "STATUS",
                defaultSymbol: {
                    type: "esriSMS",
                    color: [200, 200, 200, 255],
                    size: 10,
                },
                defaultLabel: "Other",
                uniqueValueInfos: [
                    {
                        value: "Active",
                        label: "Active",
                        symbol: { type: "esriSMS", color: [0, 255, 0, 255], size: 14 },
                    },
                    {
                        value: "Inactive",
                        label: "Inactive",
                        symbol: { type: "esriSMS", color: [255, 0, 0, 255], size: 10 },
                    },
                ],
            };

            const result = adaptArcGisRenderer(renderer);
            expect(result.renderer.type).toBe("uniqueValue");
            expect(result.renderer.field).toBe("STATUS");
            expect(result.renderer.fieldSource).toBe("service");
            expect(result.renderer.valueMap?.get("Active")).toBeDefined();
            expect(result.renderer.defaultLabel).toBe("Other");
        });
    });

    describe("classBreaks renderer", () => {
        it("converts class break infos", () => {
            const renderer: ArcGisRendererDef = {
                type: "classBreaks",
                field1: "POPULATION",
                classificationMethod: "esriClassifyQuantile",
                classBreakInfos: [
                    {
                        classMinValue: 0,
                        classMaxValue: 1000,
                        label: "Low",
                        symbol: { type: "esriSFS", color: [255, 255, 200, 255] },
                    },
                    {
                        classMinValue: 1001,
                        classMaxValue: 5000,
                        label: "Medium",
                        symbol: { type: "esriSFS", color: [255, 200, 100, 255] },
                    },
                ],
            };

            const result = adaptArcGisRenderer(renderer);
            expect(result.renderer.type).toBe("classBreaks");
            expect(result.renderer.field).toBe("POPULATION");
            expect(result.renderer.method).toBe("quantile");
            expect(result.renderer.breaks).toHaveLength(2);
        });
    });

    describe("fallback behavior", () => {
        it("returns safe defaults for undefined renderer", () => {
            const result = adaptArcGisRenderer(undefined);
            expect(result.usedServiceSymbology).toBe(false);
            expect(result.renderer.type).toBe("simple");
            expect(result.warnings).toContain("No service renderer defined.");
        });

        it("warns on unsupported renderer type", () => {
            const renderer: ArcGisRendererDef = {
                type: "heatmapRenderer",
                symbol: { type: "esriSMS", color: [0, 0, 255, 255] },
            };

            const result = adaptArcGisRenderer(renderer);
            expect(result.usedServiceSymbology).toBe(true);
            expect(result.warnings.some(w => w.includes("Unsupported"))).toBe(true);
        });
    });
});

describe("ArcGIS Label Adapter", () => {
    it("converts labeling info", () => {
        const labelingInfo: ArcGisLabelInfo[] = [{
            labelPlacement: "esriServerPointLabelPlacementAboveCenter",
            labelExpression: "[NAME]",
            symbol: {
                type: "esriTS",
                color: [51, 51, 51, 255],
                fontSize: 12,
                fontFamily: "Arial",
                fontWeight: "bold",
                haloColor: [255, 255, 255, 200],
                haloSize: 1,
            },
        }];

        const result = adaptArcGisLabels(labelingInfo);
        expect(result.usedServiceLabels).toBe(true);
        expect(result.labels?.enabled).toBe(true);
        expect(result.labels?.field).toBe("NAME");
        expect(result.labels?.color).toMatch(/rgba?\(51,\s*51,\s*51/);
        expect(result.labels?.size).toBe(12);
        expect(result.labels?.placement).toBe("above");
    });

    it("returns empty for undefined labeling", () => {
        const result = adaptArcGisLabels(undefined);
        expect(result.usedServiceLabels).toBe(false);
        expect(result.labels).toBeUndefined();
    });
});
