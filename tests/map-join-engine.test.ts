// ── Map Join Engine Tests ─────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { executeMapJoin } from "../src/maps/join/mapJoinEngine";
import type { MapJoinInput } from "../src/maps/join/mapJoinEngine";
import type { MapJoinDefinition } from "../src/schema/mapSchema";
import type { ParsedArcGisFeature } from "../src/maps/arcgis/arcGisResponseParser";

function makeJoinDef(overrides?: Partial<MapJoinDefinition>): MapJoinDefinition {
    return {
        enabled: true,
        powerBiField: "code",
        serviceField: "CODE",
        normalization: ["trim", "upper"],
        powerBiDuplicatePolicy: "aggregate",
        serviceDuplicatePolicy: "first",
        unmatchedPolicy: "diagnose",
        ...overrides,
    };
}

function makePowerBiRows(data: Array<Record<string, unknown>>) {
    return data.map(r => ({ ...r } as any));
}

function makeServiceFeatures(attrsList: Array<Record<string, unknown>>): ParsedArcGisFeature[] {
    return attrsList.map((attrs, i) => ({
        objectId: i + 1,
        attributes: attrs,
        geometry: { type: "Point", coordinates: [0, 0] } as any,
    }));
}

describe("Map Join Engine", () => {
    describe("basic matching", () => {
        it("matches one-to-one on normalized keys", () => {
            const rows = makePowerBiRows([{ code: "ABC", name: "Alpha" }]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service Alpha" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.features).toHaveLength(1);
            expect(result.features[0].powerBiRowIndices).toEqual([0]);
            expect(result.features[0].serviceAttributes.CODE).toBe("ABC");
            expect(result.diagnostics.matchRate).toBe(1);
            expect(result.diagnostics.matchedPowerBiRowCount).toBe(1);
            expect(result.diagnostics.matchedServiceFeatureCount).toBe(1);
        });

        it("handles trim normalization", () => {
            const rows = makePowerBiRows([{ code: "  ABC  ", name: "Alpha" }]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef({ normalization: ["trim"] }),
                layerId: "test",
            });

            expect(result.features).toHaveLength(1);
        });

        it("handles case normalization", () => {
            const rows = makePowerBiRows([{ code: "abc", name: "Alpha" }]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef({ normalization: ["upper"] }),
                layerId: "test",
            });

            expect(result.features).toHaveLength(1);
        });

        it("handles multiple Power BI rows for one service feature", () => {
            const rows = makePowerBiRows([
                { code: "ABC", name: "Alpha" },
                { code: "ABC", name: "Beta" },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["row-0", "row-1"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.features).toHaveLength(1);
            expect(result.features[0].powerBiRowIndices).toEqual([0, 1]);
            expect(result.diagnostics.matchedPowerBiRowCount).toBe(2);
        });
    });

    describe("blank keys", () => {
        it("skips blank Power BI keys", () => {
            const rows = makePowerBiRows([
                { code: "", name: "Blank" },
                { code: "ABC", name: "Alpha" },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["row-0", "row-1"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.diagnostics.blankPowerBiKeyCount).toBe(1);
            expect(result.features).toHaveLength(1);
        });

        it("skips blank service keys", () => {
            const rows = makePowerBiRows([{ code: "ABC", name: "Alpha" }]);
            const features = makeServiceFeatures([
                { CODE: "", desc: "Blank" },
                { CODE: "ABC", desc: "Service" },
            ]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.diagnostics.blankServiceKeyCount).toBe(1);
            expect(result.features).toHaveLength(1);
        });

        it("blank keys never match", () => {
            const rows = makePowerBiRows([{ code: "", name: "Blank" }]);
            const features = makeServiceFeatures([{ CODE: "", desc: "Blank" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.features).toHaveLength(0);
        });
    });

    describe("duplicate policies", () => {
        it("powerBiDuplicatePolicy: first uses only the first matching row", () => {
            const rows = makePowerBiRows([
                { code: "ABC", name: "First" },
                { code: "ABC", name: "Second" },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["row-0", "row-1"],
                serviceFeatures: features,
                definition: makeJoinDef({ powerBiDuplicatePolicy: "first" }),
                layerId: "test",
            });

            expect(result.features).toHaveLength(1);
            expect(result.features[0].powerBiRowIndices).toEqual([0]);
            expect(result.features[0].powerBiAttributes.name).toBe("First");
        });

        it("powerBiDuplicatePolicy: error throws on duplicates", () => {
            const rows = makePowerBiRows([
                { code: "ABC", name: "One" },
                { code: "ABC", name: "Two" },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            expect(() => executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["row-0", "row-1"],
                serviceFeatures: features,
                definition: makeJoinDef({ powerBiDuplicatePolicy: "error" }),
                layerId: "test",
            })).toThrow(/Duplicate Power BI join keys/);
        });

        it("serviceDuplicatePolicy: first uses only the first service feature", () => {
            const rows = makePowerBiRows([{ code: "ABC", name: "Alpha" }]);
            const features = makeServiceFeatures([
                { CODE: "ABC", desc: "First" },
                { CODE: "ABC", desc: "Second" },
            ]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef({ serviceDuplicatePolicy: "first" }),
                layerId: "test",
            });

            expect(result.features).toHaveLength(1);
            expect(result.features[0].serviceAttributes.desc).toBe("First");
        });

        it("serviceDuplicatePolicy: all includes all matching service features", () => {
            const rows = makePowerBiRows([{ code: "ABC", name: "Alpha" }]);
            const features = makeServiceFeatures([
                { CODE: "ABC", desc: "First" },
                { CODE: "ABC", desc: "Second" },
            ]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef({ serviceDuplicatePolicy: "all" }),
                layerId: "test",
            });

            expect(result.features).toHaveLength(2);
            expect(result.diagnostics.matchedServiceFeatureCount).toBe(2);
        });

        it("serviceDuplicatePolicy: error throws on duplicates", () => {
            const rows = makePowerBiRows([{ code: "ABC", name: "Alpha" }]);
            const features = makeServiceFeatures([
                { CODE: "ABC", desc: "First" },
                { CODE: "ABC", desc: "Second" },
            ]);

            expect(() => executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["row-0"],
                serviceFeatures: features,
                definition: makeJoinDef({ serviceDuplicatePolicy: "error" }),
                layerId: "test",
            })).toThrow(/Duplicate service join keys/);
        });
    });

    describe("diagnostics", () => {
        it("reports accurate match statistics", () => {
            const rows = makePowerBiRows([
                { code: "ABC", name: "Alpha" },
                { code: "DEF", name: "Delta" },
                { code: "GHI", name: "Gamma" },
            ]);
            const features = makeServiceFeatures([
                { CODE: "ABC", desc: "S1" },
                { CODE: "XYZ", desc: "S2" },
            ]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1, 2],
                powerBiRowKeys: ["r0", "r1", "r2"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.diagnostics.powerBiRowCount).toBe(3);
            expect(result.diagnostics.powerBiDistinctKeyCount).toBe(3);
            expect(result.diagnostics.serviceFeatureCount).toBe(2);
            expect(result.diagnostics.matchedPowerBiRowCount).toBe(1);
            expect(result.diagnostics.matchedServiceFeatureCount).toBe(1);
            expect(result.diagnostics.unmatchedPowerBiKeyCount).toBe(2);
            expect(result.diagnostics.matchRate).toBeCloseTo(1 / 3);
            expect(result.diagnostics.sampleUnmatchedPowerBiKeys).toContain("DEF");
            expect(result.diagnostics.sampleUnmatchedPowerBiKeys).toContain("GHI");
        });

        it("reports duplicate Power BI keys", () => {
            const rows = makePowerBiRows([
                { code: "ABC", name: "Alpha" },
                { code: "ABC", name: "Beta" },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["r0", "r1"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.diagnostics.duplicatePowerBiKeyCount).toBe(1);
        });

        it("reports blank keys", () => {
            const rows = makePowerBiRows([
                { code: null, name: "Null" },
                { code: "ABC", name: "Alpha" },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["r0", "r1"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.diagnostics.blankPowerBiKeyCount).toBe(1);
        });
    });

    describe("aggregations", () => {
        it("aggregates count of joined Power BI rows", () => {
            const rows = makePowerBiRows([
                { code: "ABC", value: 10 },
                { code: "ABC", value: 20 },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["r0", "r1"],
                serviceFeatures: features,
                definition: makeJoinDef({
                    aggregations: [{ field: "value", aggregation: "count", as: "totalRows" }],
                }),
                layerId: "test",
            });

            expect(result.features[0].joinedAttributes.totalRows).toBe(2);
        });

        it("aggregates sum of joined Power BI field", () => {
            const rows = makePowerBiRows([
                { code: "ABC", value: 10 },
                { code: "ABC", value: 20 },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["r0", "r1"],
                serviceFeatures: features,
                definition: makeJoinDef({
                    aggregations: [{ field: "value", aggregation: "sum", as: "totalValue" }],
                }),
                layerId: "test",
            });

            expect(result.features[0].joinedAttributes.totalValue).toBe(30);
        });

        it("aggregates avg correctly", () => {
            const rows = makePowerBiRows([
                { code: "ABC", value: 10 },
                { code: "ABC", value: 20 },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["r0", "r1"],
                serviceFeatures: features,
                definition: makeJoinDef({
                    aggregations: [{ field: "value", aggregation: "avg", as: "avgValue" }],
                }),
                layerId: "test",
            });

            expect(result.features[0].joinedAttributes.avgValue).toBe(15);
        });

        it("aggregates first and last", () => {
            const rows = makePowerBiRows([
                { code: "ABC", value: 10 },
                { code: "ABC", value: 20 },
            ]);
            const features = makeServiceFeatures([{ CODE: "ABC", desc: "Service" }]);

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0, 1],
                powerBiRowKeys: ["r0", "r1"],
                serviceFeatures: features,
                definition: makeJoinDef({
                    aggregations: [
                        { field: "value", aggregation: "first", as: "firstVal" },
                        { field: "value", aggregation: "last", as: "lastVal" },
                    ],
                }),
                layerId: "test",
            });

            expect(result.features[0].joinedAttributes.firstVal).toBe(10);
            expect(result.features[0].joinedAttributes.lastVal).toBe(20);
        });
    });

    describe("geometry type", () => {
        it("sets correct geometry type for points", () => {
            const rows = makePowerBiRows([{ code: "ABC", name: "Alpha" }]);
            const features: ParsedArcGisFeature[] = [{
                objectId: 1,
                attributes: { CODE: "ABC" },
                geometry: { type: "Point", coordinates: [0, 0] } as any,
            }];

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["r0"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.features[0].geometryType).toBe("point");
        });

        it("sets correct geometry type for polygons", () => {
            const rows = makePowerBiRows([{ code: "ABC" }]);
            const features: ParsedArcGisFeature[] = [{
                objectId: 1,
                attributes: { CODE: "ABC" },
                geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } as any,
            }];

            const result = executeMapJoin({
                powerBiRows: rows,
                powerBiRowIndices: [0],
                powerBiRowKeys: ["r0"],
                serviceFeatures: features,
                definition: makeJoinDef(),
                layerId: "test",
            });

            expect(result.features[0].geometryType).toBe("polygon");
        });
    });
});
