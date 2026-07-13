import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatrixBlock, matrixVisibleRowLimit } from "../src/components/tables/MatrixBlock";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData, NormalizedField } from "../src/data/normalizeData";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { initialDashboardState } from "../src/render/stateStore";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import type { MatrixComponent } from "../src/schema/hyperpbiSchema";
import { getComponentDescriptor } from "../src/catalog/componentDescriptors";
import { validateSchema } from "../src/schema/validateSchema";

const fields: Record<string, NormalizedField> = {
    region: { key: "region", displayName: "Region", type: "dimension", dataType: "text", roles: [] },
    month: { key: "month", displayName: "Month", type: "dimension", dataType: "text", roles: [] },
    actual: { key: "actual", displayName: "Actual", type: "measure", dataType: "number", roles: [] },
    recordId: { key: "recordId", displayName: "Record ID", type: "dimension", dataType: "text", roles: [] },
};
const rows = [
    { region: "North", month: "January", actual: 1000, recordId: "N1" },
    { region: "South", month: "January", actual: 500, recordId: "S1" },
    { region: "South", month: "January", actual: 0, recordId: "S2" },
];
const data: NormalizedData = { fields, rows, rowKeys: ["N1", "S1", "S2"], aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };

function mount(component: MatrixComponent) {
    const host = document.createElement("div");
    const value = { data, rows, sourceRows: rows, sourceRowKeys: data.rowKeys, getRowsForComponent: () => rows, componentRows: () => [], schema: { version: "2.0", components: [component] }, settings: toRuntimeSettings(new VisualFormattingSettingsModel()), state: initialDashboardState(), dispatch: vi.fn(), warnings: [], selectExternal: vi.fn(() => ({ sent: true })), clearExternal: vi.fn(() => ({ sent: true })), applyExternalFilter: vi.fn(() => ({ sent: true })), clearExternalFilter: vi.fn(() => ({ sent: true })), reportInteraction: vi.fn(), config: defaultConfig, webAccessAvailable: false, executeUiAction: vi.fn(() => ({ success: true })), isOverlayOpen: () => false } as unknown as RenderContextValue;
    act(() => render(h(RenderContext.Provider, { value }, h(MatrixBlock, { component })), host));
    return host;
}

afterEach(() => document.body.replaceChildren());

describe("MatrixBlock multi-value contract", () => {
    it("renders every metric with independent labels, formats, and totals", () => {
        const host = mount({ type: "matrix", id: "matrix", rows: ["region"], values: [
            { field: "actual", aggregation: "sum", title: "Total actual", format: "currency" },
            { aggregation: "count", title: "Records", format: "integer" },
        ], showTotals: true });
        expect(Array.from(host.querySelectorAll("thead th")).map(cell => cell.textContent)).toEqual(["Region", "Total actual", "Records", "Total actual total", "Records total"]);
        expect(host.textContent).toContain("$1,000");
        expect(host.textContent).toContain("2");
        expect(host.querySelectorAll("tbody tr")).toHaveLength(2);
    });

    it("creates unambiguous column/metric headers and metric-specific heatmap scales", () => {
        const host = mount({ type: "matrix", id: "matrix", rows: ["region"], columns: ["month"], values: [
            { field: "actual", aggregation: "sum", format: "currency" }, { aggregation: "count", format: "integer" },
        ], heatmap: true });
        const headers = Array.from(host.querySelectorAll("thead th")).map(cell => cell.textContent);
        expect(headers).toEqual(["Region", "January — Total Actual", "January — Records"]);
        const cells = Array.from(host.querySelectorAll<HTMLTableCellElement>("td[data-metric-index]"));
        expect(cells).toHaveLength(4);
        expect(cells[1].style.background).not.toBe(cells[0].style.background);
    });

    it("keeps a compatible single-value layout and calculates deterministic cell-budget truncation", () => {
        const single = mount({ type: "matrix", id: "matrix", rows: ["region"], values: [{ field: "actual", aggregation: "sum" }] });
        expect(single.querySelectorAll("tbody td")).toHaveLength(2);
        expect(matrixVisibleRowLimit(6000, 2)).toBe(2500);
        expect(matrixVisibleRowLimit(40, 200)).toBe(25);
        expect(matrixVisibleRowLimit(12, 1)).toBe(12);
    });

    it("validates and renders the canonical multi-value descriptor example", () => {
        const source = JSON.stringify(getComponentDescriptor("matrix")!.example)
            .replaceAll("__category_field_key__", "region")
            .replaceAll("__measure_field_key__", "actual");
        const component = JSON.parse(source) as MatrixComponent;
        expect(validateSchema({ version: "2.0", components: [component] }).valid).toBe(true);
        const host = mount(component);
        expect(host.querySelectorAll("td[data-metric-index]").length).toBeGreaterThan(2);
        expect(new Set(Array.from(host.querySelectorAll("td[data-metric-index]")).map(cell => cell.getAttribute("data-metric-index")))).toEqual(new Set(["0", "1"]));
    });
});
