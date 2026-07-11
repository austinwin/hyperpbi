import type { ChartComponent, ChartType } from "../../../schema/hyperpbiSchema";
import type { ChartAdapter } from "./types";
import { advancedAdapter, categoryAdapter, gaugeAdapter, scatterAdapter } from "./existingAdapters";
import { comboAdapter } from "./comboAdapter";
import { waterfallAdapter } from "./waterfallAdapter";
import { sankeyAdapter } from "./sankeyAdapter";
import { treemapAdapter } from "./treemapAdapter";
import { funnelAdapter } from "./funnelAdapter";
import { radarAdapter } from "./radarAdapter";

const registry = new Map<ChartType, ChartAdapter>([
    ...(["barChart","horizontalBarChart","lineChart","areaChart","pieChart","donutChart","heatmap"] as ChartType[]).map(type => [type, { ...categoryAdapter, type }] as [ChartType, ChartAdapter]),
    ["scatterChart", scatterAdapter as ChartAdapter], ["gauge", gaugeAdapter as ChartAdapter], ["advancedChart", advancedAdapter as ChartAdapter],
    ["comboChart", comboAdapter as ChartAdapter], ["waterfallChart", waterfallAdapter as ChartAdapter], ["sankeyChart", sankeyAdapter as ChartAdapter],
    ["treemapChart", treemapAdapter as ChartAdapter], ["funnelChart", funnelAdapter as ChartAdapter], ["radarChart", radarAdapter as ChartAdapter],
]);

export const registeredChartTypes = Array.from(registry.keys());
export function getChartAdapter(component: ChartComponent): ChartAdapter { const adapter=registry.get(component.type);if(!adapter)throw new Error(`No chart adapter registered for ${component.type}.`);return adapter; }
