import type { EChartsCoreOption } from "echarts/core";
import type { ChartEventsDefinition } from "../../schema/hyperpbiSchema";
import type { ChartDatumBinding } from "./adapters/types";

export interface EChartZoomEvent {
    start?: number;
    end?: number;
    startValue?: unknown;
    endValue?: unknown;
}

export interface EChartBrushSelection {
    seriesIndex: number;
    dataIndices: number[];
}

export interface EChartBrushEvent {
    selections: EChartBrushSelection[];
}

const comparable = (value: unknown): number | string => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    return String(value ?? "");
};
const sameCategory = (left: unknown, right: unknown): boolean => left === right || String(left ?? "") === String(right ?? "");

export function bindingsForZoom(bindings: readonly ChartDatumBinding[], zoom: EChartZoomEvent): ChartDatumBinding[] {
    if (!bindings.length) return [];
    if (zoom.startValue !== undefined || zoom.endValue !== undefined) {
        const quantitative = [zoom.startValue, zoom.endValue].filter(value => value !== undefined).every(value => typeof value === "number" || value instanceof Date);
        if (!quantitative) {
            const bySeries = new Map<number, ChartDatumBinding[]>();
            for (const binding of bindings) bySeries.set(binding.seriesIndex, [...(bySeries.get(binding.seriesIndex) ?? []), binding]);
            return bindings.filter(binding => {
                const series = bySeries.get(binding.seriesIndex) ?? [];
                const first = zoom.startValue === undefined ? Number.NEGATIVE_INFINITY : series.find(candidate => sameCategory(candidate.value, zoom.startValue))?.dataIndex;
                const last = zoom.endValue === undefined ? Number.POSITIVE_INFINITY : series.find(candidate => sameCategory(candidate.value, zoom.endValue))?.dataIndex;
                return first !== undefined && last !== undefined && binding.dataIndex >= Math.min(first, last) && binding.dataIndex <= Math.max(first, last);
            });
        }
        const lower = zoom.startValue === undefined ? undefined : comparable(zoom.startValue);
        const upper = zoom.endValue === undefined ? undefined : comparable(zoom.endValue);
        return bindings.filter(binding => {
            const value = comparable(binding.value);
            return (lower === undefined || value >= lower) && (upper === undefined || value <= upper);
        });
    }
    const start = Math.max(0, Math.min(100, zoom.start ?? 0));
    const end = Math.max(start, Math.min(100, zoom.end ?? 100));
    const maximumBySeries = new Map<number, number>();
    for (const binding of bindings) maximumBySeries.set(binding.seriesIndex, Math.max(maximumBySeries.get(binding.seriesIndex) ?? 0, binding.dataIndex));
    return bindings.filter(binding => {
        const maximum = maximumBySeries.get(binding.seriesIndex) ?? 0;
        const first = Math.floor(start / 100 * maximum);
        const last = Math.ceil(end / 100 * maximum);
        return binding.dataIndex >= first && binding.dataIndex <= last;
    });
}

export function bindingsForBrush(bindings: readonly ChartDatumBinding[], brush: EChartBrushEvent): ChartDatumBinding[] {
    const selected = new Set(brush.selections.flatMap(selection => selection.dataIndices.map(dataIndex => `${selection.seriesIndex}:${dataIndex}`)));
    return bindings.filter(binding => selected.has(`${binding.seriesIndex}:${binding.dataIndex}`));
}

export function sourceRowsForBindings(bindings: readonly ChartDatumBinding[]): number[] {
    return Array.from(new Set(bindings.flatMap(binding => binding.sourceRowIndices))).sort((left, right) => left - right);
}

export function enableDeclarativeChartEvents(option: EChartsCoreOption, events: ChartEventsDefinition | undefined): EChartsCoreOption {
    if (!events || !events.zoom?.enabled && !events.rangeSelect?.enabled && !events.brush?.enabled) return option;
    const result = { ...(option as Record<string, unknown>) };
    if ((events.zoom?.enabled || events.rangeSelect?.enabled) && result.dataZoom === undefined) {
        result.dataZoom = [{ type: "inside", filterMode: "filter" }, { type: "slider", height: 18, bottom: 4 }];
    }
    if (events.brush?.enabled) {
        result.brush = {
            toolbox: ["rect", "polygon", "clear"],
            brushMode: "single",
            throttleType: "debounce",
            throttleDelay: 80,
        };
        const toolbox = result.toolbox && typeof result.toolbox === "object" && !Array.isArray(result.toolbox)
            ? result.toolbox as Record<string, unknown>
            : {};
        const feature = toolbox.feature && typeof toolbox.feature === "object" && !Array.isArray(toolbox.feature)
            ? toolbox.feature as Record<string, unknown>
            : {};
        result.toolbox = { ...toolbox, feature: { ...feature, brush: { type: ["rect", "polygon", "clear"] } } };
    }
    return result as EChartsCoreOption;
}
