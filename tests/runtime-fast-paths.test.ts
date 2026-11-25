import type powerbi from "powerbi-visuals-api";
import { describe, expect, it, vi } from "vitest";
import { bindingWithLineage } from "../src/components/charts/adapters/shared";
import { cartesianDataPatch } from "../src/components/charts/echartDataPatch";
import { resolveSvgDataContextRow, svgTemplateFields } from "../src/components/svg/svgBindings";
import { createDashboardRowSelector, resolveSourceRowIndicesForFilter, scalarFilterKey } from "../src/data/filtering";
import { parseDataView } from "../src/data/parseDataView";
import { createComponentRowRouter } from "../src/interactions/componentInteraction";
import type { InternalInteractionFilter } from "../src/interactions/interactionTypes";
import { IncrementalData } from "../src/powerbi/IncrementalData";
import { defaultRuntimeSettings } from "../src/runtime/runtimeSettings";

describe("runtime fast paths", () => {
    it("keeps packed row keys and values identical to normalized rows for dates, blanks and duplicate groups", () => {
        const columns = Array.from({ length: 25 }, (_, index) => ({
            displayName: `Field ${index}`, queryName: `field${index}`, isMeasure: index === 0,
        }));
        const date = new Date("2026-02-01T00:00:00.000Z");
        const rows = [[12, date, null], [18, date, null], [13, date.toISOString(), ""], [0, null, false]];
        const view = { metadata: { columns }, table: { columns, rows } } as powerbi.DataView;
        const ingested = new IncrementalData();
        ingested.accept(view, "replace");
        const ordinary = parseDataView(view);
        expect(ingested.data.rowKeys).toEqual(ordinary.rowKeys);
        expect(ingested.data.rows.map(row => ({ ...row }))).toEqual(ordinary.rows);
        expect(new Set(ordinary.rowKeys).size).toBe(rows.length);
    });

    it("reuses routed predicates and global queries only inside their own source snapshot", () => {
        const rows = [{ status: "Open" }, { status: "Closed" }, { status: "Open" }, { status: null }];
        const filter: InternalInteractionFilter = { originComponentId: "control", scope: "others", field: "status", operator: "=", value: "Open", targets: ["orders"] };
        const route = createComponentRowRouter(rows, ["a", "b", "c", "d"], rows);
        const open = route("orders", [filter]);
        expect(open).toEqual([rows[0], rows[2]]);
        expect(route("orders", [{ ...filter }])).toBe(open);
        expect(route("totals", [filter])).toBe(rows);
        const selector = createDashboardRowSelector(rows, ["status"]);
        expect(selector([], "open").sourceIndices).toEqual([0, 2]);
        expect(selector([], " Open ")).toBe(selector([], "open"));
        const incoming = [{ status: "Closed" }, { status: "Open" }];
        expect(createDashboardRowSelector(incoming, ["status"])([], "open").sourceIndices).toEqual([1]);
        expect(resolveSourceRowIndicesForFilter("status", "=", "Open", rows)).toEqual([0, 2]);
        expect(resolveSourceRowIndicesForFilter("status", "=", "Open", incoming)).toEqual([1]);
        expect(scalarFilterKey("status", "in", Array(1))).toBeUndefined();
    });

    it("defers lineage until requested and deduplicates source indices in original order", () => {
        const rows = [{ label: "A" }, { label: "B" }];
        const sourceIndicesForRow = vi.fn(row => row === rows[0] ? [4, 9] : [9, 12]);
        const binding = bindingWithLineage({ seriesIndex: 0, dataIndex: 0 }, rows, {
            theme: defaultRuntimeSettings.theme, sourceRows: rows, sourceRowKeys: [], sourceIndex: new Map(), sourceIndicesForRow,
        });
        expect(sourceIndicesForRow).not.toHaveBeenCalled();
        expect(binding.sourceRowIndices).toEqual([4, 9, 12]);
        expect(binding.sourceRowIndices).toBe(binding.sourceRowIndices);
        expect(sourceIndicesForRow).toHaveBeenCalledTimes(2);
    });

    it("patches only compatible Cartesian data and replaces options when structure changes", () => {
        const previous = { xAxis: { type: "category", data: ["A", "B"] }, yAxis: { type: "value" }, series: [{ type: "bar", data: [1, 2] }] };
        const filtered = { ...previous, xAxis: { type: "category", data: ["B"] }, series: [{ type: "bar", data: [2] }] };
        expect(cartesianDataPatch(previous, filtered)).toEqual({ xAxis: { data: ["B"] }, series: [{ type: "bar", data: [2] }] });
        expect(cartesianDataPatch(filtered, structuredClone(filtered))).toEqual({});
        expect(cartesianDataPatch(previous, { ...filtered, yAxis: { type: "log" } })).toBeUndefined();
        expect(cartesianDataPatch(previous, { ...filtered, series: [{ type: "bar" }] })).toBeUndefined();
    });

    it("matches full SVG aggregate semantics for referenced mixed and nullable columns", () => {
        const fields = svgTemplateFields("{{row.cost}} {{region}} {{blank}} {{missing}} {{state.asset}} {{$count}}");
        expect(fields).toEqual(["cost", "region", "blank", "missing"]);
        const rows = [{ cost: 3, region: 12, blank: null }, { cost: 2, region: "North", blank: null }, { cost: null, region: "South", blank: null }];
        const aggregate = resolveSvgDataContextRow(undefined, rows, [], [], []);
        expect(resolveSvgDataContextRow(undefined, rows, [], [], [], fields)).toEqual(aggregate);
        expect(aggregate).toEqual({ cost: 5, region: 12, blank: null });
    });
});
