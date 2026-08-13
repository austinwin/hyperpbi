import type { ChartComponent, ChartType } from "../../../schema/hyperpbiSchema";
import type { ChartAdapter } from "./types";
import { advancedAdapter, categoryAdapter, gaugeAdapter, scatterAdapter } from "./existingAdapters";
import { comboAdapter } from "./comboAdapter";
import { waterfallAdapter } from "./waterfallAdapter";
import { sankeyAdapter } from "./sankeyAdapter";
import { treemapAdapter } from "./treemapAdapter";
import { funnelAdapter } from "./funnelAdapter";
import { radarAdapter } from "./radarAdapter";
import { networkGraphAdapter } from "./networkGraphAdapter";

const registry = new Map<string, ChartAdapter<any>>([
    ...(["barChart","horizontalBarChart","lineChart","areaChart","pieChart","donutChart","heatmap"] as ChartType[]).map(type => [type, { ...categoryAdapter, type }] as [string, ChartAdapter<any>]),
    ["scatterChart", scatterAdapter], ["gauge", gaugeAdapter], ["advancedChart", advancedAdapter],
    ["comboChart", comboAdapter], ["waterfallChart", waterfallAdapter], ["sankeyChart", sankeyAdapter],
    ["treemapChart", treemapAdapter], ["funnelChart", funnelAdapter], ["radarChart", radarAdapter],
    ["networkGraph", networkGraphAdapter],
]);

export const registeredChartTypes = Array.from(registry.keys());
export function getChartAdapter(component: ChartComponent | { type: string }): ChartAdapter<any> {
    const adapter = registry.get(component.type);
    if (!adapter) throw new Error(`No chart adapter registered for ${component.type}.`);
    return adapter;
}
