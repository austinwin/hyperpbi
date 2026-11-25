import type { EChartsCoreOption } from "echarts/core";
import { aggregateValue } from "../../../data/aggregations";
import type { DataRow, Primitive } from "../../../data/normalizeData";
import type { BaseChartComponent, MetricDefinition, UiIntent } from "../../../schema/hyperpbiSchema";
import { mergeSemanticChartOptions } from "../safeEChartOptions";
import type { ChartBuildContext, ChartBuildResult, ChartDatumBinding } from "./types";

type TooltipParam = { name?: unknown; value?: unknown; marker?: string; seriesName?: string };
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
export function formatBuiltInChartValue(value: unknown): string { if (typeof value === "number" && Number.isFinite(value)) return numberFormat.format(value); if (value instanceof Date) return value.toLocaleDateString(); if (value == null) return ""; if (Array.isArray(value)) return value.map(formatBuiltInChartValue).filter(Boolean).join(", "); if (typeof value === "object") return ""; return String(value); }
const escapeTooltip=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]!));
export function formatBuiltInChartTooltip(input: TooltipParam | TooltipParam[]): string { return (Array.isArray(input) ? input : [input]).map(param => { const name=escapeTooltip(formatBuiltInChartValue(param.name));const value=escapeTooltip(formatBuiltInChartValue(param.value));const series=!name?escapeTooltip(formatBuiltInChartValue(param.seriesName)):"";return `${param.marker??""}${name||series}${name||series?": ":""}${value}`; }).filter(Boolean).join("<br/>"); }
export function scaleScatterPointSizes(values: number[]): number[] {
    let min = Infinity, max = -Infinity;
    for (const value of values) if (Number.isFinite(value)) {
        min = Math.min(min, value);
        max = Math.max(max, value);
    }
    if (min === Infinity) return values.map(() => 12);
    if (min === max) return values.map(() => 14);
    return values.map(value => !Number.isFinite(value) ? 8 : Math.round(8 + Math.sqrt(Math.max(0, Math.min(1, (value - min) / (max - min)))) * 28));
}

export function baseOption(context: ChartBuildContext): EChartsCoreOption { return { animation:false,textStyle:{fontFamily:context.theme.fontFamily,color:context.theme.text},tooltip:{trigger:"item",confine:true,formatter:formatBuiltInChartTooltip},color:[context.theme.primary,context.theme.accent,context.theme.success,context.theme.warning],grid:{left:44,right:16,top:24,bottom:40,containLabel:true} }; }
export function sourceIndices(rows: DataRow[], context: ChartBuildContext): number[] {
    const unique = new Set<number>();
    for (const row of rows) {
        if (context.sourceIndicesForRow) {
            for (const index of context.sourceIndicesForRow(row)) unique.add(index);
        } else {
            const index = context.sourceIndex.get(row);
            if (index !== undefined) unique.add(index);
        }
    }
    return Array.from(unique);
}
/** Rendering uses values only. Resolve row lineage when a chart is clicked or highlighted. */
export function bindingWithLineage(
    binding: Omit<ChartDatumBinding, "sourceRowIndices">,
    rows: DataRow[],
    context: ChartBuildContext,
): ChartDatumBinding {
    let lineage: number[] | undefined;
    return {
        ...binding,
        get sourceRowIndices() { return lineage ??= sourceIndices(rows, context); },
    };
}
export function groupRows(rows: DataRow[], category: string, measure: string|undefined, aggregation: MetricDefinition["aggregation"] = "sum") { const groups=new Map<string,{key:string;rawKey:Primitive;rows:DataRow[]}>();for(const row of rows){const rawKey=row[category];const key=String(rawKey??"(Blank)");const group=groups.get(key)??{key,rawKey,rows:[]};group.rows.push(row);groups.set(key,group);}return Array.from(groups.values()).map(group=>({...group,value:Number(aggregateValue(group.rows,measure,aggregation)??0)})); }
export function semanticResult(base: EChartsCoreOption, component: BaseChartComponent, bindings: ChartDatumBinding[], warnings: string[] = []): ChartBuildResult { const merged=mergeSemanticChartOptions(base,component.options);return{option:merged.option,bindings,warnings:Array.from(new Set([...warnings,...merged.warnings]))}; }
export function intentColor(intent: UiIntent|undefined, context: ChartBuildContext, fallback: string): string { if(intent==="success")return context.theme.success;if(intent==="warning")return context.theme.warning;if(intent==="danger")return context.theme.danger;if(intent==="primary")return context.theme.primary;return fallback; }
