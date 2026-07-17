import { describe, expect, it } from "vitest";
import {
    bindingsForBrush,
    bindingsForZoom,
    enableDeclarativeChartEvents,
    sourceRowsForBindings,
} from "../src/components/charts/chartEvents";
import type { ChartDatumBinding } from "../src/components/charts/adapters/types";
import { dashboardReducer, initialDashboardState } from "../src/render/stateStore";

const bindings: ChartDatumBinding[] = [
    { seriesIndex: 0, dataIndex: 0, sourceRowIndices: [0, 1], field: "month", value: "Jan" },
    { seriesIndex: 0, dataIndex: 1, sourceRowIndices: [2], field: "month", value: "Feb" },
    { seriesIndex: 0, dataIndex: 2, sourceRowIndices: [3, 4], field: "month", value: "Mar" },
    { seriesIndex: 1, dataIndex: 0, sourceRowIndices: [0], field: "month", value: "Jan" },
];

describe("declarative chart events", () => {
    it("maps zoom windows and brush selections back to deduplicated source rows", () => {
        expect(bindingsForZoom(bindings, { startValue: "Feb", endValue: "Mar" })).toEqual(bindings.slice(1, 3));
        const brushed = bindingsForBrush(bindings, { selections: [{ seriesIndex: 0, dataIndices: [0, 2] }] });
        expect(brushed).toEqual([bindings[0], bindings[2]]);
        expect(sourceRowsForBindings(brushed)).toEqual([0, 1, 3, 4]);
        expect(bindingsForZoom(bindings, { start: 50, end: 100 }).some(binding => binding.dataIndex === 2)).toBe(true);
    });

    it("adds safe ECharts controls without mutating authored options", () => {
        const option = { series: [{ type: "bar", data: [1, 2] }], toolbox: { show: true } };
        const snapshot = JSON.stringify(option);
        const result = enableDeclarativeChartEvents(option, { zoom: { enabled: true }, brush: { enabled: true } }) as Record<string, unknown>;
        expect(result.dataZoom).toEqual(expect.any(Array));
        expect(result.brush).toMatchObject({ brushMode: "single" });
        expect(result.toolbox).toMatchObject({ show: true, feature: { brush: { type: ["rect", "polygon", "clear"] } } });
        expect(JSON.stringify(option)).toBe(snapshot);
    });

    it("persists and clears chart view and hierarchical drill state", () => {
        let state = initialDashboardState();
        state = dashboardReducer(state, { type: "chartView", id: "trend", value: { zoom: { start: 20, end: 80 }, brushRowKeys: ["a"] } });
        state = dashboardReducer(state, { type: "chartDrill", id: "trend", value: { levelId: "sites", path: [{ levelId: "regions", label: "North", field: "region", value: "North" }] } });
        expect(state.chartViewState.trend.zoom).toEqual({ start: 20, end: 80 });
        expect(state.chartDrillState.trend.path[0].label).toBe("North");
        state = dashboardReducer(state, { type: "clearFilters" });
        expect(state.chartViewState).toEqual({});
        expect(state.chartDrillState).toEqual({});
    });
});
