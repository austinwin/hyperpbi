import { Primitive } from "../data/normalizeData";

export type CalculationValueType = "number" | "text" | "boolean" | "date";
export type CalculationOperator = "+" | "-" | "*" | "/" | "%" | "round" | "floor" | "ceil" | "abs" | "min" | "max" | "=" | "!=" | ">" | ">=" | "<" | "<=" | "and" | "or" | "not" | "concat" | "contains" | "startsWith" | "endsWith" | "lower" | "upper" | "trim" | "replace" | "dateDiff" | "dateAdd" | "year" | "quarter" | "month" | "week" | "day" | "today" | "now" | "coalesce" | "isNull" | "isNotNull" | "if" | "case";

export type ExpressionNode =
    | { field: string }
    | { value: Primitive }
    | { op: CalculationOperator; [key: string]: unknown };

export interface CalculatedFieldDefinition {
    key: string;
    label?: string;
    type: CalculationValueType;
    expression: ExpressionNode;
}

export type MetricAggregation = "count" | "countWhere" | "sum" | "sumWhere" | "avg" | "avgWhere" | "min" | "max" | "distinctCount" | "ratio" | "percentOfTotal";
export interface CalculatedMetricDefinition {
    key: string;
    label?: string;
    aggregation: MetricAggregation;
    field?: string;
    where?: ExpressionNode;
    numerator?: CalculatedMetricDefinition;
    denominator?: CalculatedMetricDefinition;
    format?: string;
}

export interface CalculationSpecification {
    fields?: CalculatedFieldDefinition[];
    metrics?: CalculatedMetricDefinition[];
}

export interface CalculationMessage { level: "error" | "warning"; path: string; message: string; }
export interface EvaluationContext { now?: Date; warnings?: string[]; }
