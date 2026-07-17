import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import type { DataRow, NormalizedData } from "../src/data/normalizeData";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { initialDashboardState } from "../src/render/stateStore";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import {
    buildTableSearchIndex,
    SimpleVirtualTable,
    tableVirtualRange,
} from "../src/components/tables/TableBlock";
import { sortRows } from "../src/data/sorting";

afterEach(() => document.body.replaceChildren());

function largeContext(rowCount: number): RenderContextValue {
    const rows: DataRow[] = Array.from({ length: rowCount }, (_value, index) => ({
        id: index,
        name: `Facility ${String(index).padStart(6, "0")}`,
        status: index % 2 ? "Open" : "Closed",
    }));
    const fields: NormalizedData["fields"] = {
        id: { key: "id", displayName: "ID", type: "measure", roles: ["values"] },
        name: { key: "name", displayName: "Name", type: "dimension", roles: ["values"] },
        status: { key: "status", displayName: "Status", type: "dimension", roles: ["values"] },
    };
    const data = {
        rows,
        rowKeys: rows.map((_row, index) => `row-${index}`),
        fields,
        aggregates: calculateAggregates(rows),
        map: { features: [], diagnostics: [] },
    } as unknown as NormalizedData;
    const settings = toRuntimeSettings(new VisualFormattingSettingsModel());
    settings.table.maxRows = 5_000;
    settings.table.pagination = false;
    return {
        data,
        rows,
        sourceRows: rows,
        sourceRowKeys: data.rowKeys,
        getRowsForComponent: () => rows,
        componentRows: () => [],
        schema: { version: "1.0", components: [] },
        settings,
        state: initialDashboardState(),
        dispatch: vi.fn(),
        warnings: [],
        selectExternal: vi.fn(() => ({ sent: true })),
        clearExternal: vi.fn(() => ({ sent: true })),
        applyExternalFilter: vi.fn(() => ({ sent: true })),
        clearExternalFilter: vi.fn(() => ({ sent: true })),
        reportInteraction: vi.fn(),
        config: defaultConfig,
        webAccessAvailable: false,
        executeUiAction: vi.fn(() => ({ success: true })),
        isOverlayOpen: () => false,
    } as unknown as RenderContextValue;
}

describe("large table runtime", () => {
    it("calculates bounded virtual windows at the beginning, middle, and end", () => {
        expect(tableVirtualRange(5_000, 0, 480)).toMatchObject({ start: 0 });
        const middle = tableVirtualRange(5_000, 50_000, 480);
        expect(middle.start).toBeGreaterThan(1_000);
        expect(middle.end - middle.start).toBeLessThan(40);
        const end = tableVirtualRange(5_000, Number.MAX_SAFE_INTEGER, 480);
        expect(end.end).toBe(5_000);
    });

    it("renders a bounded number of DOM rows for a 10,000-row source", () => {
        const host = document.createElement("div");
        const value = largeContext(10_000);
        act(() => render(
            h(RenderContext.Provider, { value }, h(SimpleVirtualTable, {
                component: {
                    type: "table",
                    id: "large-table",
                    columns: ["id", "name", "status"],
                    pagination: false,
                    search: true,
                    maxRows: 5_000,
                },
            })),
            host,
        ));
        expect(host.querySelector(".hp-table-virtual")).not.toBeNull();
        expect(host.querySelectorAll("tbody tr").length).toBeLessThan(50);
        expect(host.textContent).toContain("Showing the first 5,000 rows");
        expect(host.querySelector("table")?.getAttribute("aria-rowcount")).toBe("5000");
        act(() => render(null, host));
    });

    it("builds and searches a 100,000-row corpus within a regression budget", () => {
        const rows = Array.from({ length: 100_000 }, (_value, index) => ({
            name: `Facility ${index}`,
            status: index % 2 ? "Open" : "Closed",
        }));
        const started = performance.now();
        const index = buildTableSearchIndex(rows, ["name", "status"]);
        const matches = index.filter(value => value.includes("facility 9999"));
        const sorted = sortRows(rows, "name", "desc");
        const elapsed = performance.now() - started;
        expect(matches.length).toBeGreaterThan(0);
        expect(index).toHaveLength(100_000);
        expect(sorted[0].name).toBe("Facility 99999");
        expect(elapsed).toBeLessThan(5_000);
    });

    it("renders a 100,000-row configured table with a bounded DOM window", () => {
        const host = document.createElement("div");
        const value = largeContext(100_000);
        value.settings.table.maxRows = 100_000;
        const started = performance.now();
        act(() => render(
            h(RenderContext.Provider, { value }, h(SimpleVirtualTable, {
                component: {
                    type: "table",
                    id: "stress-table",
                    columns: ["id", "name", "status"],
                    pagination: false,
                    search: false,
                    maxRows: 100_000,
                    virtualization: { enabled: true, threshold: 50, rowHeight: 28, overscan: 10 },
                },
            })),
            host,
        ));
        expect(host.querySelector("table")?.getAttribute("aria-rowcount")).toBe("100000");
        expect(host.querySelectorAll("tbody tr").length).toBeLessThan(60);
        expect(host.textContent).not.toContain("Showing the first");
        expect(performance.now() - started).toBeLessThan(5_000);
        act(() => render(null, host));
    });
});
