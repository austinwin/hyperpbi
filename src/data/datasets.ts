import { ExpressionNode } from "../calculations/calculationTypes";
import { evaluateExpression } from "../calculations/expressionEvaluator";
import { FilterOperator } from "../schema/hyperpbiSchema";
import { aggregateValue, lazyAggregates } from "./aggregations";
import { matchesFilter } from "./filtering";
import { DataRow, NormalizedData, NormalizedField, Primitive } from "./normalizeData";
import { lazyMapBindings } from "./normalizeMapBindings";
import { compareSortValues } from "./sorting";
import { resolveDatasetSchemas } from "./datasetSchema";
import { Diagnostic, DiagnosticCode } from "../schema/diagnostics";

export interface DatasetFilter { field: string; operator: FilterOperator; value: unknown; }
export interface DatasetMetric { op: "sum" | "avg" | "min" | "max" | "count" | "distinctCount" | "first"; field?: string; }
export interface DatasetSort { field: string; direction: "ascending" | "descending" | "asc" | "desc"; }
export interface DatasetDefinition {
    source: "powerbi" | string;
    select?: string[];
    rename?: Record<string,string>;
    filter?: DatasetFilter | DatasetFilter[];
    sort?: DatasetSort[];
    groupBy?: string[];
    metrics?: Record<string,DatasetMetric>;
    derive?: Record<string,ExpressionNode>;
    distinct?: boolean | string[];
    limit?: number;
}
export interface DatasetDiagnostic { name:string; inputRowCount:number; outputRowCount:number; evaluationMs:number; cacheStatus:"hit"|"miss"; lineageCount:number; warnings:string[]; }
export interface DatasetResult { name:string; data:NormalizedData; lineage:number[][]; lineageAt?:(index:number)=>number[]; diagnostic:DatasetDiagnostic; signature:string; revisionToken?:string; rootRowKeys?:string[]; sourceId?:string; }
export interface DatasetEvaluation { datasets:Map<string,DatasetResult>; diagnostics:DatasetDiagnostic[]; errors:Array<{code:DiagnosticCode;dataset:string;message:string}>; schemaDiagnostics:Diagnostic[]; }

interface LineageRow { row: DataRow; source: number; lineage?: number[] }
interface LineageOptions { sourceIndices?: number[]; sourceRowKeys?: string[] }
const revisions = new WeakMap<object, number>();
let nextRevision = 0;

function revision(value: object | undefined): number {
    if (!value) return 0;
    let id = revisions.get(value);
    if (id === undefined) {
        id = ++nextRevision;
        revisions.set(value, id);
    }
    return id;
}

function fieldsForRows(rows: DataRow[], source: Record<string, NormalizedField>): Record<string, NormalizedField> {
    let result = source;
    for (const [key, field] of Object.entries(source)) {
        if (field.dataType && field.dataType !== "unknown") continue;
        let inferred: NormalizedField["dataType"] = "unknown";
        for (const row of rows) {
            const value = row[key];
            if (typeof value === "number" && Number.isFinite(value)) {
                inferred = "number";
                break;
            }
            if (value instanceof Date) inferred = "datetime";
            else if (typeof value === "boolean" && inferred !== "datetime") inferred = "boolean";
            else if (typeof value === "string" && inferred === "unknown") inferred = "text";
        }
        if (inferred !== "unknown") {
            if (result === source) result = { ...source };
            result[key] = { ...field, dataType: inferred, type: field.dataType === "unknown" && inferred === "number" ? "measure" : field.type };
        }
    }
    return result;
}

function groupItems(items: LineageRow[], keys: string[]): Map<string, LineageRow[]> {
    const groups = new Map<string, LineageRow[]>();
    for (const item of items) {
        const key = JSON.stringify(keys.map(field => item.row[field]));
        const group = groups.get(key);
        if (group) group.push(item);
        else groups.set(key, [item]);
    }
    return groups;
}

function runDefinition(definition: DatasetDefinition, input: DatasetResult, name: string, fields: Record<string, NormalizedField>, warnings: string[], signature: string): DatasetResult {
    const started = performance.now();
    const filters = definition.filter ? [definition.filter].flat() : [];
    const derives = Object.entries(definition.derive ?? {});
    const renames = Object.entries(definition.rename ?? {});
    const groupBy = definition.groupBy ?? [];
    const metrics = Object.entries(definition.metrics ?? {});
    const warningSet = new Set(warnings);
    const context = { now: new Date(), warnings: { push: (warning: string) => warningSet.add(warning) } };
    let items: LineageRow[] = [];
    const parentLineage = input.lineageAt ?? ((index: number) => input.lineage[index] ?? []);
    const indicesFor = (item: LineageRow) => item.lineage ?? parentLineage(item.source);
    const groupedLineage = (group: LineageRow[]) => {
        if (group.length === 1) return indicesFor(group[0]);
        const unique = new Set<number>();
        for (const item of group) for (const sourceIndex of indicesFor(item)) unique.add(sourceIndex);
        return Array.from(unique).sort((a, b) => a - b);
    };

    for (let index = 0; index < input.data.rows.length; index++) {
        const source = input.data.rows[index];
        if (!filters.every(filter => matchesFilter(source[filter.field], filter.operator, filter.value))) continue;
        let row = source;
        if (derives.length || renames.length) {
            row = { ...source };
            for (const [key, expression] of derives) row[key] = evaluateExpression(expression, row, context);
            for (const [from, to] of renames) {
                if (from === to || !Object.hasOwn(row, from)) continue;
                row[to] = row[from];
                delete row[from];
            }
        }
        if (definition.select) row = Object.fromEntries(definition.select.filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]));
        items.push({ row, source: index });
    }
    if (groupBy.length || definition.metrics) {
        items = Array.from(groupItems(items, groupBy).values(), group => {
            const row: DataRow = {};
            for (const field of groupBy) row[field] = group[0].row[field];
            const groupRows = metrics.length ? group.map(item => item.row) : [];
            for (const [key, metric] of metrics) row[key] = aggregateValue(groupRows, metric.field, metric.op);
            return { row, source: group[0].source, lineage: groupedLineage(group) };
        });
    }
    if (definition.distinct) {
        const keys = Array.isArray(definition.distinct) ? definition.distinct : Object.keys(items[0]?.row ?? {});
        items = Array.from(groupItems(items, keys).values(), group => ({ ...group[0], lineage: groupedLineage(group) }));
    }
    const sorts = definition.sort;
    if (sorts?.length) items.sort((left, right) => {
        for (const sort of sorts) {
            const comparison = compareSortValues(left.row[sort.field], right.row[sort.field]);
            if (comparison) return sort.direction === "descending" || sort.direction === "desc" ? -comparison : comparison;
        }
        return 0;
    });
    if (definition.limit !== undefined) items.length = Math.min(items.length, Math.max(0, Math.floor(definition.limit)));

    const sameRows = items.length === input.data.rows.length && items.every((item, index) => item.row === input.data.rows[index]);
    const rows = sameRows ? input.data.rows : items.map(item => item.row);
    const rootRowKeys = input.rootRowKeys ?? input.data.rowKeys;
    const rowKeys = sameRows ? input.data.rowKeys : items.map(item => input.data.rowKeys[item.source]);
    const lineage = items.map(indicesFor);
    const data: NormalizedData = {
        ...input.data, rows, rowKeys, fields: fieldsForRows(rows, fields),
        aggregates: sameRows ? input.data.aggregates : lazyAggregates(rows),
        map: lazyMapBindings([], fields),
    };
    const lineageCount = new Set<number>();
    for (const indices of lineage) for (const index of indices) lineageCount.add(index);
    const diagnostic: DatasetDiagnostic = {
        name, inputRowCount: input.data.rows.length, outputRowCount: rows.length,
        evaluationMs: performance.now() - started, cacheStatus: "miss", lineageCount: lineageCount.size, warnings: Array.from(warningSet),
    };
    input.data.performance?.record("datasets", started);
    return { name, data, lineage, diagnostic, signature, rootRowKeys, sourceId: input.sourceId };
}

function rootDataset(name: string, data: NormalizedData, options: LineageOptions = {}): DatasetResult {
    const rowCount = data.rows.length;
    const rootRowKeys = options.sourceRowKeys ?? data.rowKeys;
    const lineageAt = (index: number) => [options.sourceIndices?.[index] ?? index];
    let lineage: number[][] | undefined;
    return {
        name, data, sourceId: name, rootRowKeys, lineageAt,
        get lineage() { return lineage ??= Array.from({ length: rowCount }, (_, index) => lineageAt(index)); },
        diagnostic: { name, inputRowCount: rowCount, outputRowCount: rowCount, evaluationMs: 0, cacheStatus: "miss", lineageCount: rowCount, warnings: [] },
        signature: [revision(data.rows), revision(data.fields), revision(data.rowKeys), revision(rootRowKeys), revision(options.sourceIndices)].join(":"),
    };
}

class DatasetMap extends Map<string, DatasetResult> {
    constructor(names: Iterable<string>, private readonly resolve: (name: string) => DatasetResult | undefined) {
        super();
        for (const name of names) super.set(name, undefined!);
    }

    override get(name: string): DatasetResult | undefined {
        if (!this.has(name)) return undefined;
        const result = super.get(name) ?? this.resolve(name);
        if (result) super.set(name, result);
        return result;
    }

    private resolveAll() {
        for (const name of this.keys()) this.get(name);
    }

    override values() { this.resolveAll(); return super.values(); }
    override entries() { this.resolveAll(); return super.entries(); }
    override [Symbol.iterator]() { return this.entries(); }
    override forEach(callback: (value: DatasetResult, key: string, map: Map<string, DatasetResult>) => void, thisArg?: unknown) {
        this.resolveAll();
        super.forEach(callback, thisArg);
    }
}

export function evaluateDatasets(
    base: NormalizedData,
    definitions: Record<string, DatasetDefinition> = {},
    cache = new Map<string, DatasetResult>(),
    lineageOptions: LineageOptions = {},
    sourceData: Record<string, NormalizedData> = {},
    lazy = false,
): DatasetEvaluation {
    const schema = resolveDatasetSchemas(base, definitions, sourceData);
    const roots = new Map<string, DatasetResult>([["powerbi", rootDataset("powerbi", base, lineageOptions)]]);
    for (const [id, data] of Object.entries(sourceData)) if (id !== "powerbi") roots.set(id, rootDataset(id, data));
    const signatures = new Map(Array.from(roots, ([id, result]) => [id, result.signature]));
    const dependencies = new Map<string, string>();
    const diagnostics: DatasetDiagnostic[] = [];
    const definitionNames = new Set(Object.keys(definitions));
    for (const [name] of cache) if (!definitionNames.has(name)) cache.delete(name);

    const signatureFor = (name: string): string | undefined => {
        if (signatures.has(name)) return signatures.get(name);
        const definition = definitions[name];
        if (!definition || !schema.datasets.has(name)) return undefined;
        const input = signatureFor(definition.source);
        if (!input) return undefined;
        // Store one revision token per node to keep deep dependency chains small.
        const dependency = JSON.stringify([name, input, definition]);
        const cached = cache.get(name);
        const signature = cached?.signature === dependency ? cached.revisionToken! : String(++nextRevision);
        dependencies.set(name, dependency);
        signatures.set(name, signature);
        if (cached && cached.signature !== dependency) cache.delete(name);
        return signature;
    };
    for (const name of definitionNames) {
        if (!signatureFor(name)) cache.delete(name);
    }

    const datasets: DatasetMap = new DatasetMap(signatures.keys(), name => {
        const root = roots.get(name);
        if (root) {
            if (name !== "powerbi") diagnostics.push(root.diagnostic);
            return root;
        }
        const definition = definitions[name];
        const input = datasets.get(definition.source);
        const fields = schema.datasets.get(name)?.fields;
        if (!input || !fields) return undefined;
        const cached = cache.get(name);
        const dependency = dependencies.get(name)!;
        const warnings = schema.diagnostics.filter(item => item.path.startsWith(`/data/datasets/${name}/`) && item.severity !== "info").map(item => item.message);
        const result = cached
            ? {
                ...cached,
                data: { ...cached.data, calculatedMetrics: input.data.calculatedMetrics, loadStatus: input.data.loadStatus },
                diagnostic: { ...cached.diagnostic, cacheStatus: "hit" as const, evaluationMs: 0 },
            }
            : runDefinition(definition, input, name, fields, warnings, dependency);
        if (!cached) {
            result.revisionToken = signatures.get(name)!;
            cache.set(name, result);
        }
        diagnostics.push(result.diagnostic);
        return result;
    });
    if (!lazy) for (const name of datasets.keys()) datasets.get(name);
    const errors = schema.diagnostics.filter(item => item.severity === "error").map(item => ({
        code: item.code, dataset: String(item.received ?? item.path.split("/")[3] ?? "unknown"), message: item.message,
    }));
    return { datasets, diagnostics, errors, schemaDiagnostics: schema.diagnostics };
}

export function sourceIndicesForDatasetRow(result: DatasetResult, rowIndex: number): number[] {
    return [...(result.lineageAt?.(rowIndex) ?? result.lineage[rowIndex] ?? [])];
}
