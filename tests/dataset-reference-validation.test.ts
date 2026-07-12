import { describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { NormalizedData, NormalizedField } from "../src/data/normalizeData";
import { prepareSpecification } from "../src/schema/prepareSpecification";
import { validateReferences } from "../src/schema/validateReferences";

const numeric = (key: string): NormalizedField => ({ key, displayName: key, type: "measure", kind: "column", dataType: "number", origin: "powerbi-column", sourceTable: "Work", sourceColumn: key, roles: [] });
const text = (key: string): NormalizedField => ({ key, displayName: key, type: "dimension", kind: "column", dataType: "text", origin: "powerbi-column", sourceTable: "Work", sourceColumn: key, roles: [] });
const fields = { budget: numeric("budget"), actual: numeric("actual"), completion: numeric("completion"), risk: numeric("risk"), month: text("month"), status: text("status"), work_id: { ...text("work_id"), displayName: "Work ID", sourceColumn: "Work ID" } };
const data: NormalizedData = { fields, rows: [], rowKeys: [], aggregates: calculateAggregates([]), map: normalizeMapBindings([], fields) };
const datasets = {
    workItems: { source: "powerbi", derive: { variance: { op: "-", args: [{ field: "budget" }, { field: "actual" }] }, costUtilization: { op: "*", args: [{ op: "/", args: [{ field: "actual" }, { field: "budget" }] }, { value: 100 }] } } },
    monthlyPerformance: { source: "workItems", groupBy: ["month"], metrics: { totalBudget: { op: "sum", field: "budget" }, totalActual: { op: "sum", field: "actual" }, averageCompletion: { op: "avg", field: "completion" } } },
    statusSummary: { source: "workItems", groupBy: ["status"], metrics: { itemCount: { op: "count" } } },
    rankedWork: { source: "workItems", sort: [{ field: "risk", direction: "descending" }] }
};
const valid = { version: "2.0", data: { datasets }, components: [
    { type: "comboChart", id: "monthly-performance-chart", dataset: "monthlyPerformance", category: "month", series: [{ field: "totalBudget", chartType: "bar" }, { field: "totalActual", chartType: "line" }, { field: "averageCompletion", chartType: "line" }] },
    { type: "horizontalBarChart", id: "status-summary-chart", dataset: "statusSummary", category: "status", measure: "itemCount" },
    { type: "table", id: "work-record-explorer--table", dataset: "workItems", columns: ["workID", "variance", "costUtilization"] }
] };

describe("dataset-aware component reference validation", () => {
    it("accepts fields exposed by each selected logical dataset, including base aliases", () => {
        const prepared = prepareSpecification(valid, data);
        expect(prepared.errors).toEqual([]);
        expect(prepared.schema?.components[2]).toMatchObject({ columns: ["work_id", "variance", "costUtilization"] });
        expect(validateReferences(prepared.schema!, data)).toEqual([]);
    });

    it.each([
        ["monthlyPerformance", "totalBudegt", "totalBudget"], ["statusSummary", "totalBudget", undefined], [undefined, "variance", undefined], ["rankedWork", "unknownField", undefined]
    ])("rejects %s.%s without allowing unrelated dataset fields", (dataset, field, suggestion) => {
        const specification = { version: "2.0", data: { datasets }, components: [{ type: "horizontalBarChart", id: "bad", ...(dataset ? { dataset } : {}), category: "status", measure: field }] };
        const prepared = prepareSpecification(specification, data);
        expect(prepared.errors.join(" ")).toContain(field);
        if (suggestion) expect(prepared.errors.join(" ")).toContain(suggestion);
    });

    it("rejects statically known text output as a numeric measure with zero rows", () => {
        const specification = { version: "2.0", data: { datasets: { derived: { source: "powerbi", derive: { label: { value: "hello" } } } } }, components: [{ type: "barChart", id: "bad-text", dataset: "derived", category: "status", measure: "label" }] };
        expect(prepareSpecification(specification, data).errors.join(" ")).toMatch(/numeric|number/i);
    });

    it("reports generated fields as existing but unavailable for external model filtering", () => {
        const prepared = prepareSpecification({ version: "2.0", data: { datasets }, components: [{ type: "horizontalBarChart", id: "status-summary-chart", dataset: "statusSummary", category: "status", measure: "itemCount", interaction: { enabled: true, field: "itemCount", externalMode: "filter" } }] }, data);
        expect(prepared.errors).toEqual([]);
        expect(validateReferences(prepared.schema!, data).join(" ")).toContain("dataset metric");
        expect(validateReferences(prepared.schema!, data).join(" ")).toContain("no Power BI model-column target");
    });
});
