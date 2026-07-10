import { useMemo } from "preact/hooks";
import type { EChartsCoreOption } from "echarts/core";
import { aggregateValue } from "../../data/aggregations";
import { groupAndAggregate } from "../../data/groupBy";
import { ChartComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { categoricalColor } from "../../utils/colors";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { EChartRenderer } from "./EChartRenderer";
import { mergeSafeBuiltInEChartOptions, mergeSafeEChartOptions } from "./safeEChartOptions";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

type TooltipParam = {
    name?: unknown;
    value?: unknown;
    marker?: string;
    seriesName?: string;
};

const builtInNumberFormat = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
});

export function formatBuiltInChartValue(value: unknown): string {
    if (typeof value === "number" && Number.isFinite(value)) return builtInNumberFormat.format(value);
    if (value instanceof Date) return value.toLocaleDateString();
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.map(formatBuiltInChartValue).filter(Boolean).join(", ");
    if (typeof value === "object") return "";
    return String(value);
}

export function formatBuiltInChartTooltip(input: TooltipParam | TooltipParam[]): string {
    const params = Array.isArray(input) ? input : [input];
    return params.map(param => {
        const name = formatBuiltInChartValue(param.name);
        const value = formatBuiltInChartValue(param.value);
        const series = !name ? formatBuiltInChartValue(param.seriesName) : "";
        return `${param.marker ?? ""}${name || series}${name || series ? ": " : ""}${value}`;
    }).filter(Boolean).join("<br/>");
}

export function scaleScatterPointSizes(values: number[]): number[] {
    if (values.length === 0) return [];
    const valid = values.filter(Number.isFinite);
    if (valid.length === 0) return values.map(() => 12);
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    if (min === max) return values.map(() => 14);
    return values.map(value => {
        if (!Number.isFinite(value)) return 8;
        const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return Math.round(8 + Math.sqrt(normalized) * 28);
    });
}

export function ChartBlock({ component }: { component: ChartComponent }) {
    const context = useRenderContext();
    const { sourceRows, data, settings, getRowsForComponent, componentRows } = context;
    const id = component.id ?? component.type;
    const rows = getRowsForComponent(id);
    const policy = resolveInteractionPolicy(component, context.config);
    const selectedRows = componentRows(id);
    const pointSizeField = component.pointSize;
    const referencedFields = [component.category, component.measure, component.x, component.y, pointSizeField];
    const missing = referencedFields.filter((field): field is string => Boolean(field && !data.fields[field]));
    const sourceIndices = useMemo(() => new Map(sourceRows.map((row, index) => [row, index] as const)), [sourceRows]);
    const grouped = useMemo(
        () => component.category ? groupAndAggregate(rows, component.category, component.measure, component.aggregation ?? "sum") : [],
        [rows, component.category, component.measure, component.aggregation]
    );
    const scatterRows = useMemo(() => component.type === "scatterChart"
        ? rows.filter(row => Number.isFinite(Number(row[component.x ?? ""])) && Number.isFinite(Number(row[component.y ?? ""])))
        : rows, [rows, component.type, component.x, component.y]);

    const option = useMemo<EChartsCoreOption>(() => {
        const base = {
            animation: false,
            textStyle: { fontFamily: settings.theme.fontFamily, color: settings.theme.text },
            tooltip: { trigger: "item", confine: true },
            color: [settings.theme.primary, settings.theme.accent, settings.theme.success, settings.theme.warning],
            grid: { left: 44, right: 16, top: 24, bottom: 40, containLabel: true },
        };
        if (component.type === "advancedChart") {
            return mergeSafeEChartOptions({ ...base, dataset: { source: rows.slice(0, component.maxDataRows ?? 30000) } }, component.options).option;
        }

        const builtInBase = { ...base, tooltip: { ...base.tooltip, formatter: formatBuiltInChartTooltip } };
        if (component.type === "gauge") {
            return mergeSafeBuiltInEChartOptions({
                ...builtInBase,
                series: [{ type: "gauge", selectedMode: "multiple", data: [{ value: Number(aggregateValue(rows, component.measure, component.aggregation ?? "avg") ?? 0), name: component.title }], detail: { fontSize: 18 }, progress: { show: true } }],
            }, component.options).option;
        }
        if (component.type === "scatterChart") {
            const rawSizes = pointSizeField ? scatterRows.map(row => Number(row[pointSizeField])) : [];
            const pointSizes = pointSizeField ? scaleScatterPointSizes(rawSizes) : scatterRows.map(() => 12);
            return mergeSafeBuiltInEChartOptions({
                ...builtInBase,
                xAxis: { type: "value" },
                yAxis: { type: "value" },
                series: [{
                    type: "scatter",
                    selectedMode: "multiple",
                    data: scatterRows.map((row, index) => ({
                        value: [Number(row[component.x ?? ""]), Number(row[component.y ?? ""])],
                        symbolSize: pointSizes[index],
                    })),
                }],
            }, component.options).option;
        }
        if (component.type === "pieChart" || component.type === "donutChart") {
            return mergeSafeBuiltInEChartOptions({
                ...builtInBase,
                legend: { bottom: 0 },
                series: [{ type: "pie", selectedMode: "multiple", radius: component.type === "donutChart" ? ["45%", "72%"] : "72%", data: grouped.map(item => ({ name: item.key, value: item.value, itemStyle: { color: categoricalColor(item.key) } })), label: { show: grouped.length <= 12 } }],
            }, component.options).option;
        }
        if (component.type === "heatmap") {
            return mergeSafeBuiltInEChartOptions({
                ...builtInBase,
                xAxis: { type: "category", data: grouped.map(item => item.key) },
                yAxis: { type: "category", data: [component.measure ?? "Value"] },
                visualMap: { min: 0, max: Math.max(1, ...grouped.map(item => item.value)), orient: "horizontal", bottom: 0 },
                series: [{ type: "heatmap", selectedMode: "multiple", data: grouped.map((item, index) => [index, 0, item.value]) }],
            }, component.options).option;
        }
        const horizontal = component.type === "horizontalBarChart";
        const seriesType = component.type === "lineChart" || component.type === "areaChart" ? "line" : "bar";
        return mergeSafeBuiltInEChartOptions({
            ...builtInBase,
            xAxis: horizontal ? { type: "value" } : { type: "category", data: grouped.map(item => item.key), axisLabel: { hideOverlap: true } },
            yAxis: horizontal ? { type: "category", data: grouped.map(item => item.key), axisLabel: { hideOverlap: true } } : { type: "value" },
            series: [{ type: seriesType, selectedMode: "multiple", data: grouped.map(item => item.value), areaStyle: component.type === "areaChart" ? {} : undefined, smooth: component.type === "lineChart" || component.type === "areaChart", itemStyle: { color: settings.theme.primary } }],
        }, component.options).option;
    }, [rows, scatterRows, grouped, component, pointSizeField, settings.theme]);

    const selectData = (dataIndex: number, modifiers: { multiSelect: boolean; event?: Event }) => {
        if (component.type === "scatterChart" || component.type === "advancedChart" && !component.category) {
            const row = component.type === "scatterChart" ? scatterRows[dataIndex] : rows[dataIndex];
            const index = sourceIndices.get(row);
            const field = policy.field;
            executeComponentInteraction(policy, createInteractionPayload(component, { rowIndices: index !== undefined ? [index] : [], sourceRowKeys: context.sourceRowKeys, field, value: field ? row?.[field] : undefined }), context, { trigger: "click", ...modifiers });
            return;
        }
        if (component.type === "gauge") {
            if (!policy.explicit || !policy.enabled) return;
            const field = policy.field ?? component.measure;
            const value = policy.value !== undefined ? policy.value : aggregateValue(rows, field, component.aggregation ?? "avg");
            const indices = rows.map(row => sourceIndices.get(row)).filter((index): index is number => index !== undefined);
            executeComponentInteraction(policy, createInteractionPayload(component, { rowIndices: indices, sourceRowKeys: context.sourceRowKeys, field, value }), context, { trigger: "click", ...modifiers });
            return;
        }
        const group = grouped[dataIndex];
        if (!group || !component.category) return;
        const indices = rows.reduce<number[]>((matches, row) => {
            const index = sourceIndices.get(row);
            if (String(row[component.category!] ?? "(Blank)") === group.key && index !== undefined) matches.push(index);
            return matches;
        }, []);
        executeComponentInteraction(policy, createInteractionPayload(component, { rowIndices: indices, sourceRowKeys: context.sourceRowKeys, field: component.category, value: group.key }), context, { trigger: "click", ...modifiers });
    };

    let selectedDataIndices: number[] = [];
    if (component.type === "gauge") selectedDataIndices = selectedRows.length > 0 ? [0] : [];
    else if (component.type !== "advancedChart" && component.category) {
        selectedDataIndices = grouped.map((group, index) => rows.some(row => selectedRows.includes(sourceIndices.get(row) ?? -1) && String(row[component.category!] ?? "(Blank)") === group.key) ? index : -1).filter(index => index >= 0);
    } else if (component.type === "scatterChart") {
        selectedDataIndices = scatterRows.map((row, index) => selectedRows.includes(sourceIndices.get(row) ?? -1) ? index : -1).filter(index => index >= 0);
    }

    const hasRenderableData = component.type === "scatterChart" ? scatterRows.length > 0 : rows.length > 0;
    return (
        <Card title={component.title}>
            {missing.length
                ? <EmptyState title="Chart fields are unavailable">Valid fields: {Object.keys(data.fields).join(", ")}</EmptyState>
                : hasRenderableData
                    ? <EChartRenderer
                        option={option}
                        height={component.height}
                        initOptions={component.initOptions}
                        setOptionOptions={component.setOption}
                        completeOption={component.type !== "advancedChart"}
                        selectedDataIndices={selectedDataIndices}
                        selectionSeriesIndex={component.type === "advancedChart" ? undefined : 0}
                        onDataIndex={selectData}
                    />
                    : <EmptyState title="No data for this chart" />}
        </Card>
    );
}
