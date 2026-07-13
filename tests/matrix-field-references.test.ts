import { describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData, NormalizedField } from "../src/data/normalizeData";
import { prepareSpecification } from "../src/schema/prepareSpecification";

const fields: Record<string, NormalizedField> = {
    recordId: { key: "recordId", displayName: "Record ID", type: "dimension", dataType: "text", roles: [] },
    category: { key: "category", displayName: "Category", type: "dimension", dataType: "text", roles: [] },
    actual: { key: "actual", displayName: "Actual", type: "measure", dataType: "number", roles: [] },
    progress: { key: "progress", displayName: "Progress", type: "measure", dataType: "number", roles: [] },
    reportDate: { key: "reportDate", displayName: "Report date", type: "date", dataType: "datetime", roles: [] },
};
const rows = [{ recordId: "A-1", category: "Open", actual: 10, progress: .5, reportDate: new Date("2026-01-01") }];
const data: NormalizedData = { fields, rows, rowKeys: ["1"], aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };
const matrix = (aggregation: string, field?: string) => ({ type: "matrix", id: "matrix", rows: ["category"], values: [{ ...(field ? { field } : {}), aggregation }] });

describe("matrix aggregation-aware field references", () => {
    it.each([
        ["count", undefined], ["count", "recordId"], ["distinctCount", "recordId"], ["first", "recordId"], ["sum", "actual"],
    ])("accepts %s with %s", (aggregation, field) => {
        expect(prepareSpecification({ version: "2.0", components: [matrix(aggregation!, field)] }, data, { repair: false }).errors).toEqual([]);
    });

    it.each(["sum", "avg", "min", "max"])("requires numeric fields for %s", aggregation => {
        const prepared = prepareSpecification({ version: "2.0", components: [matrix(aggregation, "recordId")] }, data, { repair: false });
        expect(prepared.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "FIELD_TYPE_MISMATCH", path: "/components/0/values/0/field" })]));
    });

    it("requires a field for distinctCount and retains deeply nested paths", () => {
        const empty = prepareSpecification({ version: "2.0", components: [matrix("distinctCount")] }, data, { repair: false });
        expect(empty.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ path: "/components/0/values/0/field" })]));
        const tabs = Array.from({ length: 83 }, (_, index) => ({ title: `Tab ${index}`, children: index === 82 ? [
            { type: "text", id: "a", text: "A" }, { type: "text", id: "b", text: "B" }, matrix("sum", "recordId"),
        ] : [] }));
        const nested = prepareSpecification({ version: "2.0", components: [{ type: "tabs", id: "tabs", tabs }] }, data, { repair: false });
        expect(nested.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "FIELD_TYPE_MISMATCH", path: "/components/0/tabs/82/children/2/values/0/field" })]));
    });
});
