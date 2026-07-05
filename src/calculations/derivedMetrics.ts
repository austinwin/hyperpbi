import { DataRow, Primitive } from "../data/normalizeData";
import { aggregateValue } from "../data/aggregations";
import { CalculatedMetricDefinition } from "./calculationTypes";
import { evaluateCondition } from "./conditionEvaluator";

function metricValue(metric: CalculatedMetricDefinition, rows: DataRow[]): Primitive {
    if (metric.aggregation === "ratio" && metric.numerator && metric.denominator) { const numerator = Number(metricValue(metric.numerator, rows)); const denominator = Number(metricValue(metric.denominator, rows)); return denominator ? numerator / denominator : null; }
    const filtered = metric.where ? rows.filter(row => evaluateCondition(metric.where, row)) : rows;
    if (metric.aggregation === "count" || metric.aggregation === "countWhere") return filtered.length;
    if (metric.aggregation === "percentOfTotal") { const part = Number(aggregateValue(filtered, metric.field, "sum")) || 0; const total = Number(aggregateValue(rows, metric.field, "sum")) || 0; return total ? part / total : null; }
    const aggregation = metric.aggregation.endsWith("Where") ? metric.aggregation.replace("Where", "") : metric.aggregation;
    return aggregateValue(filtered, metric.field, aggregation);
}
export function calculateDerivedMetrics(rows: DataRow[], definitions: CalculatedMetricDefinition[] = []): Record<string, Primitive> { return Object.fromEntries(definitions.map(metric => [metric.key, metricValue(metric, rows)])); }
