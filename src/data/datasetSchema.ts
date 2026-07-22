import { ExpressionNode } from "../calculations/calculationTypes";
import { Diagnostic } from "../schema/diagnostics";
import type { DatasetDefinition, DatasetMetric } from "./datasets";
import { aggregationFieldRequirement } from "../fields/aggregationFieldPolicy";
import { NormalizedData, NormalizedField } from "./normalizeData";

export interface DatasetSchemaResult {
    name: string;
    fields: Record<string, NormalizedField>;
}

export interface DatasetSchemaEvaluation {
    datasets: Map<string, DatasetSchemaResult>;
    diagnostics: Diagnostic[];
}

type PrimitiveType = NonNullable<NormalizedField["dataType"]>;
const cloneFields = (fields: Record<string, NormalizedField>): Record<string, NormalizedField> => Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, { ...field, roles: [...field.roles] }]));
const pathFor = (name: string, suffix: string): string => `/data/datasets/${name}/${suffix}`;

function generatedField(key: string, dataType: PrimitiveType, origin: "dataset-derived" | "dataset-metric"): NormalizedField {
    return { key, displayName: key, type: dataType === "number" ? "measure" : dataType === "date" || dataType === "datetime" ? "date" : "dimension", kind: "unknown", dataType, origin, roles: [] };
}

function expressionChildren(node: Record<string, unknown>): ExpressionNode[] {
    const children: ExpressionNode[] = [];
    for (const [key, value] of Object.entries(node)) {
        if (key === "op" || key === "field" || key === "value" || key === "valueFromRow") continue;
        if (Array.isArray(value)) value.forEach(item => { if (item && typeof item === "object") children.push(item as ExpressionNode); });
        else if (value && typeof value === "object") children.push(value as ExpressionNode);
    }
    return children;
}

function inferExpressionType(expression: ExpressionNode, fields: Record<string, NormalizedField>): PrimitiveType {
    if (!expression || typeof expression !== "object") return "unknown";
    if ("field" in expression) return fields[String(expression.field)]?.dataType ?? "unknown";
    if ("valueFromRow" in expression) return fields[String(expression.valueFromRow)]?.dataType ?? "unknown";
    if ("value" in expression) {
        const value = expression.value;
        return value instanceof Date ? "datetime" : typeof value === "number" ? "number" : typeof value === "string" ? "text" : typeof value === "boolean" ? "boolean" : "unknown";
    }
    const node = expression as Record<string, unknown> & { op: string };
    const childTypes = expressionChildren(node).map(child => inferExpressionType(child, fields));
    if (["+", "-", "*", "/", "%", "round", "floor", "ceil", "abs", "min", "max", "dateDiff", "year", "quarter", "month", "week", "day"].includes(node.op)) return "number";
    if (["=", "!=", ">", ">=", "<", "<=", "and", "or", "not", "contains", "startsWith", "endsWith", "isNull", "isNotNull"].includes(node.op)) return "boolean";
    if (["concat", "lower", "upper", "trim", "replace"].includes(node.op)) return "text";
    if (["today", "now", "dateAdd"].includes(node.op)) return "datetime";
    if (["coalesce", "if", "case"].includes(node.op)) {
        const known = Array.from(new Set(childTypes.filter(type => type !== "unknown")));
        return known.length === 1 ? known[0] : "unknown";
    }
    return "unknown";
}

function validateExpressionFields(expression: ExpressionNode, fields: Record<string, NormalizedField>, diagnostics: Diagnostic[], path: string, dataset: string): void {
    if (!expression || typeof expression !== "object") return;
    const node = expression as Record<string, unknown>;
    for (const property of ["field", "valueFromRow"] as const) {
        const reference = node[property];
        if (typeof reference === "string" && !fields[reference]) diagnostics.push({ code: "UNKNOWN_DATASET_FIELD", severity: "error", path: `${path}/${property}`, message: `Dataset “${dataset}” references missing field “${reference}” at this operation stage.`, received: reference });
    }
    expressionChildren(node).forEach((child, index) => validateExpressionFields(child, fields, diagnostics, `${path}/args/${index}`, dataset));
}

function metricType(metric: DatasetMetric, fields: Record<string, NormalizedField>): PrimitiveType {
    if (["sum", "avg", "min", "max", "count", "distinctCount"].includes(metric.op)) return "number";
    if (metric.op === "first" && metric.field) return fields[metric.field]?.dataType ?? "unknown";
    return "unknown";
}

function propagateDefinition(name: string, definition: DatasetDefinition, input: DatasetSchemaResult, diagnostics: Diagnostic[]): DatasetSchemaResult {
    let fields = cloneFields(input.fields);
    const unknown = (reference: string, suffix: string, operation: string): void => {
        diagnostics.push({ code: "UNKNOWN_DATASET_FIELD", severity: "error", path: pathFor(name, suffix), message: `Dataset “${name}” ${operation} references missing field “${reference}”.`, received: reference });
    };

    const filters = definition.filter ? (Array.isArray(definition.filter) ? definition.filter : [definition.filter]) : [];
    filters.forEach((filter, index) => { if (!fields[filter.field]) unknown(filter.field, `filter/${index}/field`, "filter"); });

    for (const [key, expression] of Object.entries(definition.derive ?? {})) {
        validateExpressionFields(expression, fields, diagnostics, pathFor(name, `derive/${key}`), name);
        fields[key] = generatedField(key, inferExpressionType(expression, fields), "dataset-derived");
    }

    for (const [from, rawTarget] of Object.entries(definition.rename ?? {})) {
        const target = rawTarget.trim();
        if (!fields[from]) { unknown(from, `rename/${from}`, "rename"); continue; }
        if (!target) { diagnostics.push({ code: "INVALID_DATASET_DEFINITION", severity: "error", path: pathFor(name, `rename/${from}`), message: `Dataset “${name}” rename target for “${from}” cannot be empty.`, received: rawTarget }); continue; }
        if (target !== from && fields[target]) diagnostics.push({ code: "INVALID_DATASET_DEFINITION", severity: "error", path: pathFor(name, `rename/${from}`), message: `Dataset “${name}” cannot rename “${from}” to “${target}” because that output already exists.`, received: target });
        const source = fields[from]; fields[target] = { ...source, key: target, displayName: target }; if (target !== from) delete fields[from];
    }

    if (definition.select) {
        const selected: Record<string, NormalizedField> = {};
        definition.select.forEach((field, index) => { if (!fields[field]) unknown(field, `select/${index}`, "select"); else selected[field] = fields[field]; });
        fields = selected;
    }

    if (definition.groupBy?.length || definition.metrics) {
        const grouped: Record<string, NormalizedField> = {};
        (definition.groupBy ?? []).forEach((field, index) => {
            if (!fields[field]) unknown(field, `groupBy/${index}`, "groupBy");
            else grouped[field] = { ...fields[field], origin: "dataset-group" };
        });
        for (const [key, metric] of Object.entries(definition.metrics ?? {})) {
            const policy = aggregationFieldRequirement(metric.op, "first");
            if (policy.fieldRequired && !metric.field) diagnostics.push({ code: "INVALID_DATASET_DEFINITION", severity: "error", path: pathFor(name, `metrics/${key}/field`), message: `Dataset metric “${name}.${key}” requires a field for ${metric.op}.` });
            else if (metric.field && !fields[metric.field]) unknown(metric.field, `metrics/${key}/field`, `metric “${key}”`);
            else if (metric.field && policy.requirement === "numeric" && fields[metric.field].dataType !== "number" && fields[metric.field].dataType !== "unknown") diagnostics.push({ code: "NON_NUMERIC_DATASET_FIELD", severity: "error", path: pathFor(name, `metrics/${key}/field`), message: `Dataset metric “${name}.${key}” requires a numeric field for ${metric.op}, but “${metric.field}” is ${fields[metric.field].dataType}.`, received: metric.field });
            if (grouped[key]) diagnostics.push({ code: "INVALID_DATASET_DEFINITION", severity: "error", path: pathFor(name, `metrics/${key}`), message: `Dataset metric “${name}.${key}” collides with a group-by field.` });
            grouped[key] = generatedField(key, metricType(metric, fields), "dataset-metric");
        }
        fields = grouped;
    }

    if (Array.isArray(definition.distinct)) definition.distinct.forEach((field, index) => { if (!fields[field]) unknown(field, `distinct/${index}`, "distinct"); });
    (definition.sort ?? []).forEach((sort, index) => { if (!fields[sort.field]) unknown(sort.field, `sort/${index}/field`, "sort"); });
    return { name, fields };
}

export function resolveDatasetSchemas(
    base: NormalizedData,
    definitions: Record<string, DatasetDefinition> = {},
    sourceData: Record<string, NormalizedData> = {}
): DatasetSchemaEvaluation {
    const diagnostics: Diagnostic[] = [];
    const datasets = new Map<string, DatasetSchemaResult>([["powerbi", { name: "powerbi", fields: cloneFields(base.fields) }]]);
    const sourceSchemas = new Map(
        Object.entries(sourceData).map(([name, data]) => [
            name,
            { name, fields: cloneFields(data.fields) } satisfies DatasetSchemaResult
        ])
    );
    const visiting: string[] = [];
    const failed = new Set<string>();
    const resolve = (name: string): DatasetSchemaResult | undefined => {
        const existing = datasets.get(name); if (existing) return existing;
        if (failed.has(name)) return undefined;
        const definition = definitions[name];
        if (!definition) {
            diagnostics.push({ code: "UNKNOWN_DATASET", severity: "error", path: pathFor(name, "source"), message: `Dataset “${name}” is not defined.`, received: name }); failed.add(name); return undefined;
        }
        const cycleAt = visiting.indexOf(name);
        if (cycleAt >= 0) {
            const cycle = [...visiting.slice(cycleAt), name];
            diagnostics.push({ code: "DATASET_CYCLE", severity: "error", path: pathFor(name, "source"), message: `Dataset cycle: ${cycle.join(" → ")}.`, received: name }); cycle.forEach(item => failed.add(item)); return undefined;
        }
        visiting.push(name);
        let input: DatasetSchemaResult | undefined;
        if (definition.source === "powerbi") input = datasets.get("powerbi");
        else if (sourceSchemas.has(definition.source)) input = sourceSchemas.get(definition.source);
        else if (!definitions[definition.source]) diagnostics.push({ code: "UNKNOWN_DATASET", severity: "error", path: pathFor(name, "source"), message: `Dataset “${name}” references unknown source dataset or workspace source “${definition.source}”.`, received: definition.source });
        else input = resolve(definition.source);
        visiting.pop();
        if (!input) { failed.add(name); return undefined; }
        const result = propagateDefinition(name, definition, input, diagnostics); datasets.set(name, result); return result;
    };
    Object.keys(definitions).sort().forEach(resolve);
    return { datasets, diagnostics };
}
