import { describe, expect, it, vi } from "vitest";
import { runMapJoinPreview } from "../src/maps/join/mapJoinPreview";

describe("bounded runtime join preview", () => {
    it("uses the query and join engines for normalized matched, duplicate, unmatched, and aggregation counts", async () => {
        const query = vi.fn(async () => ({ features: [
            { objectId: 1, attributes: { CODE: "a" }, geometry: { type: "Point" as const, coordinates: [0, 0] } },
            { objectId: 2, attributes: { CODE: "C" }, geometry: { type: "Point" as const, coordinates: [1, 1] } },
        ], metadata: null, requestCount: 2, truncated: true, objectIdField: "OBJECTID", geometryType: "point", spatialReference: { wkid: 4326 }, warnings: [], sourceUrl: "fixture", usedCache: false, queryStrategy: "joinKeys" as const }));
        const result = await runMapJoinPreview({ source: { type: "arcgisFeature", url: "https://services.arcgis.com/x/FeatureServer/0", mode: "join" }, definition: { enabled: true, powerBiField: "code", serviceField: "CODE", normalization: ["trim", "upper"], aggregations: [{ field: "amount", aggregation: "sum", as: "total" }] }, rows: [{ code: " A ", amount: 2 }, { code: "a", amount: 3 }, { code: "B", amount: 4 }], rowKeys: ["a", "b", "c"], query });
        expect(result).toMatchObject({ powerBiRowCount: 3, duplicatePowerBiKeyCount: 1, matchedPowerBiRowCount: 2, unmatchedPowerBiKeyCount: 1, unmatchedServiceFeatureCount: 1, sampleUnmatchedPowerBiKeys: ["B"], sampleUnmatchedServiceKeys: ["C"], outputFeatureCount: 1, requestCount: 2, truncated: true, aggregationAliases: ["total"] });
        expect(query).toHaveBeenCalledWith(expect.objectContaining({ maxFeatures: 500, signal: undefined, joinKeys: expect.objectContaining({ field: "CODE" }) }));
    });
    it("honors an already aborted preview", async () => {
        const controller = new AbortController(); controller.abort();
        await expect(runMapJoinPreview({ source: { type: "arcgisFeature", url: "https://services.arcgis.com/x/FeatureServer/0" }, definition: { enabled: true, powerBiField: "code", serviceField: "CODE" }, rows: [], rowKeys: [], signal: controller.signal, query: vi.fn(async () => { throw new DOMException("aborted", "AbortError"); }) })).rejects.toMatchObject({ name: "AbortError" });
    });
});
