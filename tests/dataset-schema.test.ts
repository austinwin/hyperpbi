import { describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { resolveDatasetSchemas } from "../src/data/datasetSchema";
import { DatasetDefinition, evaluateDatasets } from "../src/data/datasets";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { NormalizedData, NormalizedField } from "../src/data/normalizeData";
import { externalFilterTargetFor } from "../src/powerbi/externalFilters";

const fields: Record<string, NormalizedField> = {
    budget: { key: "budget", displayName: "Budget", type: "measure", kind: "column", dataType: "number", origin: "powerbi-column", sourceTable: "Work", sourceColumn: "Budget", roles: [] },
    actual: { key: "actual", displayName: "Actual", type: "measure", kind: "column", dataType: "number", origin: "powerbi-column", sourceTable: "Work", sourceColumn: "Actual", roles: [] },
    status: { key: "status", displayName: "Status", type: "dimension", kind: "column", dataType: "text", origin: "powerbi-column", sourceTable: "Work", sourceColumn: "Status", roles: [] },
    month: { key: "month", displayName: "Month", type: "dimension", kind: "column", dataType: "text", origin: "powerbi-column", sourceTable: "Work", sourceColumn: "Month", roles: [] }
};
const makeData = (rows: NormalizedData["rows"]): NormalizedData => ({ fields, rows, rowKeys: rows.map((_, index) => String(index)), aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) });
const definitions: Record<string, DatasetDefinition> = {
    work: { source: "powerbi", derive: { variance: { op: "-", args: [{ field: "budget" }, { field: "actual" }] }, doubled: { op: "*", args: [{ field: "variance" }, { value: 2 }] } }, rename: { status: "workStatus" }, select: ["month", "budget", "actual", "variance", "doubled", "workStatus"] },
    monthly: { source: "work", groupBy: ["month"], metrics: { totalBudget: { op: "sum", field: "budget" }, lowestStatus: { op: "first", field: "workStatus" }, itemCount: { op: "count" } }, distinct: ["month"], sort: [{ field: "totalBudget", direction: "descending" }], limit: 10 }
};

describe("logical dataset schema propagation", () => {
    it("propagates derive, chained derive, rename, select, groupBy, and metrics", () => {
        const result = resolveDatasetSchemas(makeData([]), definitions);
        expect(result.diagnostics).toEqual([]);
        expect(result.datasets.get("work")?.fields).toMatchObject({ variance: { dataType: "number", origin: "dataset-derived" }, doubled: { dataType: "number", origin: "dataset-derived" }, workStatus: { sourceTable: "Work", sourceColumn: "Status" } });
        expect(Object.keys(result.datasets.get("monthly")!.fields)).toEqual(["month", "totalBudget", "lowestStatus", "itemCount"]);
        expect(result.datasets.get("monthly")?.fields).toMatchObject({ totalBudget: { dataType: "number", origin: "dataset-metric" }, lowestStatus: { dataType: "text" }, itemCount: { dataType: "number" } });
    });

    it("retains generated fields for empty base data and zero-row filters", () => {
        const empty = evaluateDatasets(makeData([]), definitions);
        expect(empty.datasets.get("work")?.data.fields.variance.dataType).toBe("number");
        expect(empty.datasets.get("monthly")?.data.fields.totalBudget.dataType).toBe("number");
        const filtered = evaluateDatasets(makeData([{ budget: 10, actual: 5, status: "Open", month: "Jan" }]), { none: { source: "powerbi", filter: { field: "status", operator: "=", value: "__NO_MATCH__" }, derive: { variance: { op: "-", args: [{ field: "budget" }, { field: "actual" }] } } } });
        expect(filtered.datasets.get("none")?.data.rows).toEqual([]);
        expect(filtered.datasets.get("none")?.data.fields.variance.dataType).toBe("number");
    });

    it("diagnoses unknown sources, cycles, stage-invalid fields, collisions, and missing metric fields", () => {
        const result = resolveDatasetSchemas(makeData([]), {
            a: { source: "b" }, b: { source: "a" }, missing: { source: "nope" },
            invalid: { source: "powerbi", filter: { field: "noField", operator: "=", value: 1 }, rename: { status: "budget" }, select: ["alsoMissing"], metrics: { bad: { op: "sum" }, count: { op: "count" } } }
        });
        const codes = result.diagnostics.map(item => item.code);
        expect(codes).toEqual(expect.arrayContaining(["DATASET_CYCLE", "UNKNOWN_DATASET", "UNKNOWN_DATASET_FIELD", "INVALID_DATASET_DEFINITION"]));
        expect(result.datasets.get("invalid")?.fields.count.dataType).toBe("number");
    });

    it("preserves filter targets only for direct, renamed, and group-by model columns", () => {
        const result = resolveDatasetSchemas(makeData([]), definitions);
        expect(externalFilterTargetFor(result.datasets.get("work")?.fields.workStatus)).toEqual({ table: "Work", column: "Status" });
        expect(externalFilterTargetFor(result.datasets.get("monthly")?.fields.month)).toEqual({ table: "Work", column: "Month" });
        expect(externalFilterTargetFor(result.datasets.get("work")?.fields.variance)).toBeUndefined();
        expect(externalFilterTargetFor(result.datasets.get("monthly")?.fields.totalBudget)).toBeUndefined();
    });
});
