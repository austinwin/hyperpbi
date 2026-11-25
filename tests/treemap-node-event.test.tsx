import { render } from "preact";
import { act } from "preact/test-utils";
import { expect, it, vi } from "vitest";
import { ChartBlock } from "../src/components/charts/ChartBlock";
import type { EChartDataEvent } from "../src/components/charts/EChartRenderer";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { finalizeDashboardData } from "../src/data/parseDataView";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { initialDashboardState } from "../src/render/stateStore";
import { defaultRuntimeSettings } from "../src/runtime/runtimeSettings";

const chart = vi.hoisted(() => ({ click: undefined as ((event: EChartDataEvent) => void) | undefined }));
vi.mock("../src/components/charts/EChartRenderer", () => ({
    EChartRenderer: ({ onDataPoint }: { onDataPoint: typeof chart.click }) => {
        chart.click = onDataPoint;
        return <div>Chart canvas</div>;
    },
}));

it("routes nested Treemap clicks by stable identity and publishes both event contracts", () => {
    const rows = [{ region: "North", site: "A", amount: 2 }, { region: "South", site: "A", amount: 7 }];
    const fields = Object.fromEntries(Object.keys(rows[0]).map(key => [key, { key, displayName: key, type: "dimension" as const, roles: [] }]));
    const data = finalizeDashboardData({ rows, fields, rowKeys: ["north-a", "south-a"] });
    const dispatch = vi.fn();
    const select = vi.fn(() => ({ sent: true }));
    const emitDynamicEvent = vi.fn();
    const context = {
        data, rows, sourceRows: rows, sourceRowKeys: data.rowKeys, schema: { version: "2.0", components: [] }, config: defaultConfig,
        getRowsForComponent: () => rows, componentRows: () => [], dispatch, state: initialDashboardState(),
        selectExternal: select, emitDynamicEvent, dynamicEventKeys: new Set(["map:select", "map:nodeClick"]), settings: defaultRuntimeSettings,
    } as unknown as RenderContextValue;
    const host = document.createElement("div");
    act(() => render(<RenderContext.Provider value={context}><ChartBlock component={{
        type: "treemapChart", id: "map", pathFields: ["region", "site"], valueField: "amount",
        events: { nodeClick: { enabled: true, targets: ["details"], interaction: { externalMode: "selection", internalMode: "filter", stateKey: "site" } } },
    }} /></RenderContext.Provider>, host));
    act(() => chart.click?.({ seriesIndex: 0, seriesType: "treemap", dataIndex: 1, datumId: '["South","A"]', multiSelect: true }));
    expect(emitDynamicEvent).toHaveBeenCalledWith("map", "nodeClick", expect.objectContaining({
        $nodeId: '["South","A"]', $parentId: '["South"]', $path: "South / A", $level: 1, $value: 7, $category: "A", $multiSelect: true,
        region: "South",
    }));
    expect(emitDynamicEvent).toHaveBeenCalledWith("map", "select", expect.objectContaining({ $value: "A" }));
    expect(select).toHaveBeenCalledWith([1], true, expect.objectContaining({ componentId: "map" }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "interactionFilter", filter: expect.objectContaining({ targets: ["details"], field: "__source_row_key__", value: ["south-a"] }) }));
    act(() => render(null, host));
});
