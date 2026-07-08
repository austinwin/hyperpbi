import { aggregateValue } from "../../data/aggregations";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { useRenderContext } from "../../render/RenderContext";
import { DataDisplayComponent, MetricDefinition } from "../../schema/hyperpbiSchema";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { DetailPanel } from "./DetailPanel";

function Metric({ metric, rows, calculatedMetrics }: { metric: MetricDefinition; rows: ReturnType<typeof useRenderContext>["rows"]; calculatedMetrics?: Record<string, unknown> }) {
    const value = metric.metric ? calculatedMetrics?.[metric.metric] : aggregateValue(rows, metric.field, metric.aggregation ?? "first", metric.where);
    return <div class={`hp-metric hp-intent-${metric.intent ?? "neutral"}`}><div class="hp-metric-label">{metric.title}</div><div class="hp-metric-value">{metric.prefix}{formatValue(value, metric.format)}{metric.suffix}</div></div>;
}

function payloadDefinition(component: DataDisplayComponent): { field?: string; aggregation?: MetricDefinition["aggregation"]; value?: unknown } {
    if (component.interaction?.field || component.interaction?.value !== undefined) return { field: component.interaction.field, value: component.interaction.value };
    if (component.type === "metricGrid") return { field: component.metrics?.[0]?.field, aggregation: component.metrics?.[0]?.aggregation };
    if (component.type === "statList") return { field: component.items?.[0]?.field, value: component.items?.[0]?.value };
    if (component.type === "detailPanel") { const entry=component.groups?.[0]?.fields?.[0];return {field:typeof entry==="string"?entry:entry?.field}; }
    return { field: component.field, aggregation: component.aggregation, value: component.value };
}

export function DataDisplayBlock({ component }: { component: DataDisplayComponent }) {
    const context=useRenderContext();const id=component.id??component.type;const rows=context.getRowsForComponent(id);const policy=resolveInteractionPolicy(component,context.config,"display");const selected=context.componentRows(id).length>0;
    const run=(event:Event)=>{const definition=payloadDefinition(component);const field=definition.field;const value=definition.value!==undefined?definition.value:field?aggregateValue(rows,field,definition.aggregation??"first"):undefined;const indices=field?(definition.aggregation&&definition.aggregation!=="first"?rows.map(row=>context.sourceRows.indexOf(row)).filter(index=>index>=0):context.sourceRows.map((row,index)=>row[field]===value?index:-1).filter(index=>index>=0)):[];if(!field&&value===undefined&&!indices.length){context.reportInteraction({componentId:id,componentType:component.type},"interaction payload unavailable");event.stopPropagation();return;}executeComponentInteraction(policy,createInteractionPayload(component,{rowIndices:indices,sourceRowKeys:context.sourceRowKeys,field,value}),context,{trigger:"click",event});};
    let content;
    if (component.type === "metricGrid") content=<div class="hp-metric-grid">{component.metrics?.map(metric => <Metric metric={metric} rows={rows} calculatedMetrics={context.data.calculatedMetrics}/>)}</div>;
    else if (component.type === "detailPanel") content=<DetailPanel component={component}/>;
    else if (component.type === "kpi") content=<Metric metric={{ title: component.title ?? "Metric", field: component.field, aggregation: component.aggregation, format: component.format, intent: component.intent }} rows={rows} calculatedMetrics={context.data.calculatedMetrics}/>;
    else if (component.type === "statusBadge") content=<span class={`badge hp-status hp-intent-${component.intent ?? "neutral"}`}>{formatValue(component.value ?? (component.field ? rows[0]?.[component.field] : ""))}</span>;
    else if (component.type === "progressBar") { const value=Number(component.value??(component.field?rows[0]?.[component.field]:0));const maximum=component.max??100;const percent=Math.max(0,Math.min(100,value/maximum*100));content=<Card title={component.title}><div class="hp-progress-label"><span>{formatValue(value,component.format)}</span><span>{formatValue(maximum,component.format)}</span></div><div class="progress progress-sm"><div class="progress-bar" style={{width:`${percent}%`}}/></div></Card>; }
    else if (component.type === "statList") content=<Card title={component.title}><dl class="hp-stat-list">{component.items?.map(item => <div><dt>{item.label}</dt><dd>{formatValue(item.value ?? (item.field ? rows[0]?.[item.field] : null), item.format)}</dd></div>)}</dl></Card>;
    else if (component.type === "alert") content=<div class={`alert hp-alert hp-intent-${component.intent ?? "neutral"}`} role="status"><strong>{component.title}</strong>{component.text && <div>{component.text}</div>}</div>;
    else content=<Card title={component.title}><p class="hp-info-text">{component.text ?? formatValue(component.value ?? (component.field ? rows[0]?.[component.field] : null), component.format)}</p></Card>;
    return <div class={selected?"hp-interaction-highlight":""} role={policy.enabled?"button":undefined} tabIndex={policy.enabled?0:undefined} onClick={policy.enabled?event=>run(event):undefined} onKeyDown={policy.enabled?event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();run(event);}}:undefined}>{content}</div>;
}
