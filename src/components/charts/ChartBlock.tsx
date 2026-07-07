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
import { mergeSafeEChartOptions } from "./safeEChartOptions";

export function ChartBlock({ component }: { component: ChartComponent }) {
    const { rows, sourceRows, data, settings, selectExternal, reportInteraction } = useRenderContext();
    const missing = [component.category, component.measure, component.x, component.y].filter((field): field is string => Boolean(field && !data.fields[field]));
    const sourceIndices = useMemo(() => new Map(sourceRows.map((row,index)=>[row,index] as const)), [sourceRows]);
    const grouped = useMemo(() => component.category ? groupAndAggregate(rows, component.category, component.measure, component.aggregation ?? "sum") : [], [rows, component.category, component.measure, component.aggregation]);
    const option = useMemo<EChartsCoreOption>(() => {
        const base = { animation: false, textStyle: { fontFamily: settings.theme.fontFamily, color: settings.theme.text }, tooltip: { trigger: "item" }, color: [settings.theme.primary, settings.theme.accent, settings.theme.success, settings.theme.warning], grid: { left: 44, right: 16, top: 24, bottom: 40, containLabel: true } };
        if (component.type === "advancedChart") return mergeSafeEChartOptions({ ...base, dataset: { source: rows.slice(0, 2000) } }, component.options).option;
        if (component.type === "gauge") return mergeSafeEChartOptions({ ...base, series: [{ type: "gauge", data: [{ value: Number(aggregateValue(rows, component.measure, component.aggregation ?? "avg") ?? 0), name: component.title }], detail: { fontSize: 18 }, progress: { show: true } }] }, component.options).option;
        if (component.type === "scatterChart") return mergeSafeEChartOptions({ ...base, xAxis: { type: "value" }, yAxis: { type: "value" }, series: [{ type: "scatter", data: rows.map(row => [Number(row[component.x ?? ""]), Number(row[component.y ?? ""])]) }] }, component.options).option;
        if (component.type === "pieChart" || component.type === "donutChart") return mergeSafeEChartOptions({ ...base, legend: { bottom: 0 }, series: [{ type: "pie", radius: component.type === "donutChart" ? ["45%", "72%"] : "72%", data: grouped.map(item => ({ name: item.key, value: item.value, itemStyle: { color: categoricalColor(item.key) } })), label: { show: grouped.length <= 12 } }] }, component.options).option;
        if (component.type === "heatmap") return mergeSafeEChartOptions({ ...base, xAxis: { type: "category", data: grouped.map(item => item.key) }, yAxis: { type: "category", data: [component.measure ?? "Value"] }, visualMap: { min: 0, max: Math.max(1, ...grouped.map(item => item.value)), orient: "horizontal", bottom: 0 }, series: [{ type: "heatmap", data: grouped.map((item, index) => [index, 0, item.value]) }] }, component.options).option;
        const horizontal = component.type === "horizontalBarChart";
        const seriesType = component.type === "lineChart" || component.type === "areaChart" ? "line" : "bar";
        return mergeSafeEChartOptions({ ...base, xAxis: horizontal ? { type: "value" } : { type: "category", data: grouped.map(item => item.key), axisLabel: { hideOverlap: true } }, yAxis: horizontal ? { type: "category", data: grouped.map(item => item.key), axisLabel: { hideOverlap: true } } : { type: "value" }, series: [{ type: seriesType, data: grouped.map(item => item.value), areaStyle: component.type === "areaChart" ? {} : undefined, smooth: component.type === "lineChart" || component.type === "areaChart", itemStyle: { color: settings.theme.primary } }] }, component.options).option;
    }, [rows, component, settings.theme]);
    const selectData = (dataIndex: number) => {
        if (component.type === "scatterChart" || component.type === "advancedChart" && !component.category) { const row = rows[dataIndex]; const index = sourceIndices.get(row); const indices=index !== undefined ? [index] : []; const details={componentId:component.id,componentType:component.type,field:component.x,value:row?.[component.x??""]}; if(component.external===false)reportInteraction(details,"component did not call selectExternal",indices);else selectExternal(indices,false,details); return; }
        const group = grouped[dataIndex]; if (!group || !component.category) return;
        const details={componentId:component.id,componentType:component.type,field:component.category,value:group.key};
        const indices=rows.reduce<number[]>((matches,row)=>{const index=sourceIndices.get(row);if(String(row[component.category!]??"(Blank)")===group.key&&index!==undefined)matches.push(index);return matches;},[]);
        if(component.external===false)reportInteraction(details,"component did not call selectExternal",indices);else selectExternal(indices,false,details);
    };
    return <Card title={component.title}>{missing.length ? <EmptyState title="Chart fields are unavailable">Valid fields: {Object.keys(data.fields).join(", ")}</EmptyState> : rows.length ? <EChartRenderer option={option} height={component.height} onDataIndex={selectData} /> : <EmptyState title="No data for this chart" />}</Card>;
}
