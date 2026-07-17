import { h, render } from "preact";
import { useReducer } from "preact/hooks";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

const chartRuntime = vi.hoisted(() => ({ props: [] as Array<Record<string, any>> }));
vi.mock("../src/components/charts/EChartRenderer", () => ({
    EChartRenderer: (props: Record<string, any>) => {
        chartRuntime.props.push(props);
        return null;
    },
}));

import { ChartBlock } from "../src/components/charts/ChartBlock";
import { calculateAggregates } from "../src/data/aggregations";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { RenderContext, type RenderContextValue, type ResolvedDatasetView } from "../src/render/RenderContext";
import { dashboardReducer, initialDashboardState, type DashboardState } from "../src/render/stateStore";
import type { ChartComponent } from "../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";

afterEach(() => {
    chartRuntime.props.length = 0;
    document.body.replaceChildren();
});

describe("preloaded hierarchical chart drill", () => {
    it("navigates dataset resolutions, applies the parent key, and preserves breadcrumbs", () => {
        const sourceRows = [
            { region: "North", site: "Alpha", amount: 5 },
            { region: "North", site: "Beta", amount: 7 },
            { region: "South", site: "Gamma", amount: 3 },
        ];
        const sourceRowKeys = ["alpha", "beta", "gamma"];
        const baseFields = {
            region: { key: "region", displayName: "Region", type: "dimension" as const, roles: [] },
            site: { key: "site", displayName: "Site", type: "dimension" as const, roles: [] },
            amount: { key: "amount", displayName: "Amount", type: "measure" as const, roles: [] },
        };
        const regions: ResolvedDatasetView = {
            name: "regions", rows: [{ area: "North", total: 12 }, { area: "South", total: 3 }],
            fields: { area: { ...baseFields.region, key: "area", displayName: "Area" }, total: { key: "total", displayName: "Total", type: "measure", roles: [] } },
            rowIndices: [0, 1], rowKeys: ["region:north", "region:south"], sourceRowIndices: [[0, 1], [2]], sourceRowKeys: [["alpha", "beta"], ["gamma"]], totalRows: 2,
        };
        const sites: ResolvedDatasetView = {
            name: "sites", rows: sourceRows, fields: baseFields, rowIndices: [0, 1, 2], rowKeys: sourceRowKeys,
            sourceRowIndices: [[0], [1], [2]], sourceRowKeys: [["alpha"], ["beta"], ["gamma"]], totalRows: 3,
        };
        const component: ChartComponent = {
            type: "barChart", id: "trend", title: "Operations", category: "region", measure: "amount",
            drill: {
                trigger: "click",
                levels: [
                    { id: "regions", label: "Regions", dataset: "regions", category: "area", measure: "total" },
                    { id: "sites", label: "Sites", dataset: "sites", category: "site", measure: "amount", parentField: "region" },
                ],
            },
            events: { rangeSelect: { enabled: true } },
        };
        const data = { rows: sourceRows, rowKeys: sourceRowKeys, fields: baseFields, aggregates: calculateAggregates(sourceRows), map: { features: [], diagnostics: [] } } as any;
        let latestState: DashboardState = initialDashboardState();
        function Harness() {
            const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState());
            latestState = state;
            const context = {
                data, rows: sourceRows, sourceRows, sourceRowKeys, powerBiSourceRows: sourceRows, powerBiSourceRowKeys: sourceRowKeys,
                getRowsForComponent: () => sourceRows,
                getDatasetView: (name?: string) => name === "regions" ? regions : name === "sites" ? sites : undefined,
                componentRows: () => [], schema: { version: "2.0", components: [component] },
                settings: toRuntimeSettings(new VisualFormattingSettingsModel()), state, dispatch, warnings: [],
                selectExternal: vi.fn(() => ({ sent: true })), clearExternal: vi.fn(() => ({ sent: true })),
                applyExternalFilter: vi.fn(() => ({ sent: true })), clearExternalFilter: vi.fn(() => ({ sent: true })), reportInteraction: vi.fn(),
                config: defaultConfig, webAccessAvailable: false, executeUiAction: vi.fn(() => ({ success: true })), isOverlayOpen: () => false,
            } as unknown as RenderContextValue;
            return <RenderContext.Provider value={context}><ChartBlock component={component} /></RenderContext.Provider>;
        }
        const host = document.createElement("div");
        act(() => render(<Harness />, host));
        const regionProps = chartRuntime.props.at(-1)!;
        act(() => regionProps.onZoom({ startValue: "North", endValue: "North" }));
        expect(latestState.interactionFilters[0]).toMatchObject({ field: "__source_row_key__", value: ["alpha", "beta"] });
        act(() => regionProps.onDataPoint({ seriesIndex: 0, dataIndex: 0, name: "North", multiSelect: false }));
        expect(latestState.chartDrillState.trend).toMatchObject({ levelId: "sites", path: [{ label: "North", value: "North" }] });
        expect(host.textContent).toContain("North");
        const siteProps = chartRuntime.props.at(-1)!;
        expect((siteProps.option.xAxis as { data: string[] }).data).toEqual(["Alpha", "Beta"]);
        const regionButton = Array.from(host.querySelectorAll<HTMLButtonElement>(".hp-chart-drill button")).find(button => button.textContent === "Regions")!;
        act(() => regionButton.click());
        expect(latestState.chartDrillState.trend).toEqual({ levelId: "regions", path: [] });
        act(() => render(null, host));
    });
});
