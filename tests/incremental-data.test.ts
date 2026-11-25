// @vitest-environment node
import type powerbi from "powerbi-visuals-api";
import { describe, expect, it, vi } from "vitest";
import { IncrementalData } from "../src/powerbi/IncrementalData";
import { aggregateValue } from "../src/data/aggregations";
import { dashboardRowView } from "../src/data/filtering";
import { evaluateDatasets, type DatasetResult } from "../src/data/datasets";
import { applyCalculations } from "../src/calculations/calculationEngine";
import { validateAuthoringData } from "../src/editor/prepareAuthoringData";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";

const columns = Array.from({ length: 21 }, (_, index) => ({
    displayName: index ? `Cost ${index}` : "Work Order",
    queryName: index ? `Orders.Cost${index}` : "Orders.WorkOrder",
    isMeasure: Boolean(index),
    type: index ? { numeric: true } : { text: true },
    roles: { values: true },
}));

function segment(ids: string[], more = false, lastMergeIndex?: number): powerbi.DataView {
    const table = {
        columns, rows: ids.map((id, index) => [id, ...columns.slice(1).map(() => index + 1)]),
        identity: ids.map(id => ({ id })), lastMergeIndex,
    };
    return { metadata: { columns, segment: more ? {} : undefined }, table };
}

describe("Power BI segmented data and selection", () => {
    it("keeps overlap, duplicates, packed row semantics and original host selection lineage correct", () => {
        const ingest = new IncrementalData();
        const hostFetch = vi.fn(() => true);
        const selectId = { getKey: () => "host-selection" };
        const withTable = vi.fn(() => ({ createSelectionId: () => selectId }));
        const host = { createSelectionIdBuilder: vi.fn(() => ({ withTable })) } as unknown as powerbi.extensibility.visual.IVisualHost;
        const first = segment(["A", "A", "B"], true);
        expect(ingest.accept(first, "replace")).toBe(true);
        const firstSnapshot = ingest.data;
        expect(ingest.requestNext({ fetchMoreData: hostFetch })).toBe(true);
        expect(ingest.requestNext({ fetchMoreData: hostFetch })).toBe(false);
        expect(hostFetch).toHaveBeenCalledExactlyOnceWith(false);
        const second = segment(["B", "C", "C"], true, 0);
        expect(ingest.accept(second, "segment")).toBe(true);
        expect(ingest.data.loadStatus).toMatchObject({ loadedRowCount: 5, completeness: "loading" });
        expect(ingest.data.rows).toBe(firstSnapshot.rows);
        expect(firstSnapshot.rows).toHaveLength(3);
        expect(ingest.requestNext({ fetchMoreData: hostFetch })).toBe(true);
        expect(ingest.accept(second, "segment")).toBe(false);
        const last = segment(["C", "D"], false, 0);
        expect(ingest.accept(last, "segment")).toBe(true);
        const data = ingest.data;
        expect(data.loadStatus).toMatchObject({ loadedRowCount: 6, segments: 3, completeness: "complete" });
        expect(data.rows.map(row => row.orders_workorder)).toEqual(["A", "A", "B", "C", "C", "D"]);
        expect(new Set(data.rowKeys).size).toBe(6);
        expect(data.rowKeys.slice(0, 3)).toEqual(firstSnapshot.rowKeys);
        expect(Object.keys(data.rows[5])).toHaveLength(21);
        expect(JSON.parse(JSON.stringify(data.rows[5]))).toEqual({ ...data.rows[5] });
        expect(data.rows[5].orders_cost1).toBe(2);
        expect(ingest.selectionCount).toBe(6);
        expect(withTable).not.toHaveBeenCalled();
        expect(ingest.getSelectionId(host, 5)).toBe(selectId);
        expect(ingest.getSelectionId(host, 5)).toBe(selectId);
        expect(withTable).toHaveBeenCalledExactlyOnceWith(last.table, 1);
        ingest.accept(segment(["D", "A", "A", "B", "C", "C"]), "replace");
        expect(ingest.data.rowKeys[0]).toBe(data.rowKeys[5]);
        expect(ingest.data.rowKeys.slice(1)).toEqual(data.rowKeys.slice(0, 5));
    });

    it("surfaces a refused segment and isolates a same-sized refresh from the old query", () => {
        const ingest = new IncrementalData();
        expect(ingest.accept(segment(["A"], true), "replace")).toBe(true);
        expect(ingest.requestNext({ fetchMoreData: () => false })).toBe(false);
        expect(ingest.data.loadStatus).toMatchObject({ completeness: "incomplete", loadedRowCount: 1, moreRowsAvailable: false });
        expect(ingest.data.rows[0].orders_workorder).toBe("A");
        expect(ingest.accept(segment(["OLD"]), "segment")).toBe(false);
        ingest.accept(segment(["B"], true), "replace");
        expect(ingest.requestNext({ fetchMoreData: () => true })).toBe(true);
        ingest.accept(segment(["C"]), "segment");
        expect(ingest.data.rows.map(row => row.orders_workorder)).toEqual(["B", "C"]);
        expect(ingest.data.loadStatus?.completeness).toBe("complete");
        ingest.reset();
        expect(ingest.data.rows).toEqual([]);
        expect(ingest.selectionCount).toBe(0);
    });
});

describe("bounded analytical work", () => {
    it("validates calculation and dataset structure without reading values, and lazily caches only requested datasets", () => {
        const ingest = new IncrementalData();
        const input = segment(["A", "B", "A"]);
        const get = vi.fn((target: powerbi.DataViewTableRow, key: string | symbol, receiver: unknown) => Reflect.get(target, key, receiver));
        input.table!.rows![0] = new Proxy(input.table!.rows![0], { get });
        ingest.accept(input, "replace");
        const data = ingest.data;
        get.mockClear();
        const source = { source: "powerbi", groupBy: ["orders_workorder"], metrics: { total: { op: "sum" as const, field: "orders_cost1" } } };
        const analysis = { source: "source", sort: [{ field: "total", direction: "desc" as const }] };
        const definitions = { source, analysis };
        const specification = JSON.stringify({ version: "2.0", data: { datasets: definitions }, components: [{ id: "status", type: "text", text: "Ready" }] });
        expect(validateAuthoringData(specification, defaultConfigJson, data).errors).toEqual([]);
        const cache = new Map<string, DatasetResult>();
        const first = evaluateDatasets(data, definitions, cache, {}, {}, true);
        expect(get).not.toHaveBeenCalled();
        expect(first.diagnostics).toEqual([]);
        expect(first.datasets.get("analysis")?.data.rows).toEqual([
            { orders_workorder: "A", total: 4 }, { orders_workorder: "B", total: 2 },
        ]);
        expect(first.datasets.get("analysis")?.lineage).toEqual([[0, 2], [1]]);
        const afterEvaluation = get.mock.calls.length;
        const second = evaluateDatasets({ ...data }, definitions, cache, {}, {}, true);
        expect(second.datasets.get("analysis")?.diagnostic.cacheStatus).toBe("hit");
        expect(get.mock.calls.length).toBe(afterEvaluation);
        const rows = [data.rows[1]];
        const third = evaluateDatasets({ ...data, rows, rowKeys: [data.rowKeys[1]] }, definitions, cache, { sourceIndices: [1], sourceRowKeys: data.rowKeys }, {}, true);
        expect(cache.size).toBe(0);
        expect(third.datasets.get("analysis")?.lineage).toEqual([[1]]);
    });

    it("retains all source positions in filters and aggregates beyond the spread argument limit", () => {
        const rows = Array.from({ length: 250_000 }, (_, index) => ({ amount: index, active: index % 2 === 0 }));
        expect(dashboardRowView(rows, [], "").rows).toBe(rows);
        const filtered = dashboardRowView(rows, [{ id: "status", field: "active", operator: "=", value: true }], "");
        expect(filtered.sourceIndices?.at(-1)).toBe(249_998);
        expect(aggregateValue(rows, "amount", "max")).toBe(249_999);
        expect(aggregateValue(rows, "amount", "min")).toBe(0);
        expect(aggregateValue(filtered.rows, "amount", "sum")).toBe(15_624_875_000);
    });

    it("preserves wide calculated fields and separates measure-only results from the row storage", () => {
        const ingest = new IncrementalData();
        ingest.accept(segment(Array.from({ length: 10_010 }, (_, index) => `WO-${index}`)), "replace");
        const data = ingest.data;
        expect(applyCalculations(data, { metrics: [{ key: "n", aggregation: "count" }] }).data.rows).toBe(data.rows);
        const result = applyCalculations(data, { fields: [{
            key: "twice", type: "number", expression: { op: "*", args: [{ field: "orders_cost1" }, { value: 2 }] },
        }] });
        expect(result.errors).toEqual([]);
        expect(result.data.rows.at(-1)).toEqual({ ...data.rows.at(-1), twice: 20_020 });
        expect(result.data.rowKeys).toBe(data.rowKeys);
    });
});
