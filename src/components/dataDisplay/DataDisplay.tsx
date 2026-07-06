import { aggregateValue } from "../../data/aggregations";
import { DataDisplayComponent, MetricDefinition } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { DetailPanel } from "./DetailPanel";

function Metric({ metric }: { metric: MetricDefinition }) {
    const { rows, data } = useRenderContext();
    const value = metric.metric ? data.calculatedMetrics?.[metric.metric] : aggregateValue(rows, metric.field, metric.aggregation ?? "first", metric.where);
    return <div class={`hp-metric hp-intent-${metric.intent ?? "neutral"}`}><div class="hp-metric-label">{metric.title}</div><div class="hp-metric-value">{metric.prefix}{formatValue(value, metric.format)}{metric.suffix}</div></div>;
}

export function DataDisplayBlock({ component }: { component: DataDisplayComponent }) {
    const { rows } = useRenderContext();
    if (component.type === "metricGrid") return <div class="hp-metric-grid">{component.metrics?.map(metric => <Metric metric={metric} />)}</div>;
    if (component.type === "detailPanel") return <DetailPanel component={component}/>;
    if (component.type === "kpi") return <Metric metric={{ title: component.title ?? "Metric", field: component.field, aggregation: component.aggregation, format: component.format, intent: component.intent }} />;
    if (component.type === "statusBadge") return <span class={`badge hp-status hp-intent-${component.intent ?? "neutral"}`}>{formatValue(component.value ?? (component.field ? rows[0]?.[component.field] : ""))}</span>;
    if (component.type === "progressBar") {
        const value = Number(component.value ?? (component.field ? rows[0]?.[component.field] : 0)); const maximum = component.max ?? 100; const percent = Math.max(0, Math.min(100, value / maximum * 100));
        return <Card title={component.title}><div class="hp-progress-label"><span>{formatValue(value, component.format)}</span><span>{formatValue(maximum, component.format)}</span></div><div class="progress progress-sm"><div class="progress-bar" style={{ width: `${percent}%` }} /></div></Card>;
    }
    if (component.type === "statList") return <Card title={component.title}><dl class="hp-stat-list">{component.items?.map(item => <div><dt>{item.label}</dt><dd>{formatValue(item.value ?? (item.field ? rows[0]?.[item.field] : null), item.format)}</dd></div>)}</dl></Card>;
    if (component.type === "alert") return <div class={`alert hp-alert hp-intent-${component.intent ?? "neutral"}`} role="status"><strong>{component.title}</strong>{component.text && <div>{component.text}</div>}</div>;
    return <Card title={component.title}><p class="hp-info-text">{component.text ?? formatValue(component.value ?? (component.field ? rows[0]?.[component.field] : null), component.format)}</p></Card>;
}
