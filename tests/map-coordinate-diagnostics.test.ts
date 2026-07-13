import { describe, expect, it } from "vitest";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedField } from "../src/data/normalizeData";

const coordinate = (key: string, displayName: string, role: string, queryName?: string): NormalizedField => ({
    key, displayName, type: displayName === "Latitude" ? "latitude" : "longitude", dataType: "number", roles: [role],
    queryName, queryAggregation: queryName ? "sum" : undefined, isImplicitAggregation: Boolean(queryName), sourceTable: "Assets", sourceColumn: displayName.toLowerCase(), kind: "column", origin: "powerbi-column",
});

describe("structured map coordinate diagnostics", () => {
    it("reports the current visual-query wrapper precisely for Values compatibility", () => {
        const fields = { lat: coordinate("lat", "Latitude", "values", "Sum(Assets.latitude)"), lon: coordinate("lon", "Longitude", "values", "Sum(Assets.longitude)") };
        const map = normalizeMapBindings([{ lat: 29.76, lon: -95.37 }], fields);
        expect(map.diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: "MAP_COORDINATE_QUERY_AGGREGATED", fieldKey: "lat", queryName: "Sum(Assets.latitude)", queryAggregation: "sum", sourceTable: "Assets", roles: ["values"] }),
            expect.objectContaining({ code: "MAP_COORDINATE_BINDING_VALID", severity: "info" }),
        ]));
        expect(map.warnings.join(" ")).toContain("model’s default summarization and this visual-query aggregation are separate");
    });

    it("suppresses aggregation warnings for dedicated Grouping roles while validating values", () => {
        const fields = { lat: coordinate("lat", "Latitude", "mapLatitude", "Sum(Assets.latitude)"), lon: coordinate("lon", "Longitude", "mapLongitude", "Sum(Assets.longitude)") };
        const map = normalizeMapBindings([{ lat: 29.76, lon: -95.37 }], fields);
        expect(map.diagnostics?.some(item => item.code === "MAP_COORDINATE_QUERY_AGGREGATED")).toBe(false);
        expect(map.diagnostics).toContainEqual(expect.objectContaining({ code: "MAP_COORDINATE_BINDING_VALID" }));
        expect(map.warnings).toEqual([]);
    });

    it("rejects incomplete, nonnumeric, and out-of-range pairs with current data-view counts", () => {
        const fields = { lat: coordinate("lat", "Latitude", "mapLatitude"), lon: coordinate("lon", "Longitude", "mapLongitude") };
        const map = normalizeMapBindings([
            { lat: 29.76, lon: -95.37 }, { lat: "bad", lon: -95 }, { lat: 91, lon: -95 }, { lat: 29, lon: 181 }, { lat: 29, lon: null },
        ], fields);
        expect(map.layers[0].features).toHaveLength(1);
        expect(map.coordinateCounts).toEqual({ dataViewRowCount: 5, validPairCount: 1, invalidPairCount: 4, incompletePairCount: 1, nonNumericPairCount: 1, outOfRangePairCount: 2 });
        expect(map.diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: "MAP_COORDINATE_NON_NUMERIC", severity: "warning" }),
            expect.objectContaining({ code: "MAP_COORDINATE_OUT_OF_RANGE", severity: "warning" }),
            expect.objectContaining({ code: "MAP_COORDINATE_PAIR_INCOMPLETE", severity: "warning" }),
            expect.objectContaining({ code: "MAP_COORDINATE_ROWS_DROPPED", severity: "warning" }),
        ]));
        const none = normalizeMapBindings([{ lat: Infinity, lon: -95 }], fields);
        expect(none.diagnostics).toContainEqual(expect.objectContaining({ code: "MAP_COORDINATE_ROWS_DROPPED", severity: "error" }));
    });
});
