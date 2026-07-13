import { aggregateValue } from "../../data/aggregations";
import { DataRow } from "../../data/normalizeData";
import { MatrixComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

const MATRIX_COLUMN_LIMIT = 50;
const MATRIX_CELL_BUDGET = 5_000;
const BLANK = "(Blank)";
const tuple = (row: DataRow, fields: string[]) => fields.map(field => String(row[field] ?? BLANK));
const titleCase = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, character => character.toUpperCase());

export function matrixVisibleRowLimit(requestedRowCount: number, dataCellsPerRow: number): number {
    return Math.min(requestedRowCount, Math.max(1, Math.floor(MATRIX_CELL_BUDGET / Math.max(1, dataCellsPerRow))));
}

function metricLabel(metric: MatrixComponent["values"][number], fields: ReturnType<typeof useRenderContext>["data"]["fields"]): string {
    if (metric.title) return metric.title;
    const field = metric.field ? fields[metric.field]?.displayName ?? titleCase(metric.field) : "";
    switch (metric.aggregation ?? "sum") {
        case "count": return field ? `Count ${field}` : "Records";
        case "distinctCount": return `Distinct ${field || "values"}`;
        case "avg": return `Average ${field || "value"}`;
        case "min": return `Minimum ${field || "value"}`;
        case "max": return `Maximum ${field || "value"}`;
        case "first": return field || "First value";
        case "countWhere": return metric.title ?? "Matching records";
        default: return `Total ${field || "value"}`;
    }
}

export function MatrixBlock({ component }: { component: MatrixComponent }) {
    const context = useRenderContext();
    const { data, sourceRows } = context;
    const id = component.id ?? "matrix";
    const rows = context.getRowsForComponent(id);
    const policy = resolveInteractionPolicy(component, context.config, "dataPoint");
    const selectedRows = context.componentRows(id);
    const sourceIndices = new Map(sourceRows.map((row, index) => [row, index] as const));
    const rowFields = component.rows;
    const columnField = component.columns?.[0];
    const allColumnValues = columnField ? Array.from(new Set(rows.map(row => String(row[columnField] ?? BLANK)))) : [""];
    const columnValues = allColumnValues.slice(0, MATRIX_COLUMN_LIMIT);
    const allRowKeys = Array.from(new Map(rows.map(row => [JSON.stringify(tuple(row, rowFields)), tuple(row, rowFields)])).values());
    const requestedRows = allRowKeys.slice(0, component.maxRows ?? 200);
    const metrics = component.values.length ? component.values : [{ aggregation: "count" as const }];
    const columnsPerRow = Math.max(1, columnValues.length) * metrics.length + (component.showTotals ? metrics.length : 0);
    const rowKeys = requestedRows.slice(0, matrixVisibleRowLimit(requestedRows.length, columnsPerRow));
    const truncated = rowKeys.length < requestedRows.length || allColumnValues.length > columnValues.length;

    const rowGroups = new Map<string, DataRow[]>();
    const cellGroups = new Map<string, DataRow[]>();
    for (const row of rows) {
        const rowKey = JSON.stringify(tuple(row, rowFields));
        const rowGroup = rowGroups.get(rowKey) ?? [];
        rowGroup.push(row);
        rowGroups.set(rowKey, rowGroup);
        const column = columnField ? String(row[columnField] ?? BLANK) : "";
        const cellKey = `${rowKey}\u0000${column}`;
        const cellGroup = cellGroups.get(cellKey) ?? [];
        cellGroup.push(row);
        cellGroups.set(cellKey, cellGroup);
    }
    const cellRows = (keys: string[], column: string) => cellGroups.get(`${JSON.stringify(keys)}\u0000${column}`) ?? [];
    const valueFor = (subset: DataRow[], metric: MatrixComponent["values"][number]) => aggregateValue(subset, metric.field, metric.aggregation ?? "sum", metric.where);
    const maxima = metrics.map((metric, metricIndex) => Math.max(1, ...rowKeys.flatMap(keys => columnValues.map(column => Math.abs(Number(valueFor(cellRows(keys, column), metrics[metricIndex] ?? metric)) || 0)))));

    const renderCell = (keys: string[], column: string, metric: MatrixComponent["values"][number], metricIndex: number) => {
        const subset = cellRows(keys, column);
        const indices = subset.map(row => sourceIndices.get(row)).filter((index): index is number => index !== undefined);
        const explicitField = policy.field;
        const values = explicitField ? Array.from(new Set(subset.map(row => row[explicitField]))) : [];
        const value = valueFor(subset, metric);
        const formatted = formatValue(value, metric.format);
        const intensity = Math.abs(Number(value) || 0) / maxima[metricIndex];
        const selected = indices.some(index => selectedRows.includes(index));
        const columnLabel = columnField ? `${column}, ` : "";
        const accessibleLabel = `${keys.join(", ")}, ${columnLabel}${metricLabel(metric, data.fields)}: ${formatted}`;
        return <td
            data-metric-index={metricIndex}
            class={selected ? "hp-row-selected" : ""}
            aria-label={accessibleLabel}
            title={accessibleLabel}
            onClick={event => executeComponentInteraction(policy, createInteractionPayload(component, { rowIndices: indices, sourceRowKeys: context.sourceRowKeys, field: explicitField, value: values.length === 1 ? values[0] : policy.value }), context, { trigger: "click", multiSelect: event.ctrlKey || event.metaKey, event })}
            style={component.heatmap ? { background: `color-mix(in srgb, var(--hp-primary) ${Math.round(intensity * 28)}%, var(--hp-surface))` } : undefined}
        >{formatted}</td>;
    };

    return <Card title={component.title}>
        {truncated && <p class="hp-inline-warning" role="status">Matrix truncated to {rowKeys.length} rows and {columnValues.length} column groups to stay within the {MATRIX_CELL_BUDGET.toLocaleString()}-cell rendering budget.</p>}
        <div class="hp-table-wrap"><table class="hp-matrix" aria-label={component.ariaLabel ?? component.title ?? "Matrix"}>
            <thead><tr>
                {rowFields.map(field => <th scope="col">{data.fields[field]?.displayName ?? field}</th>)}
                {columnValues.flatMap(column => metrics.map(metric => <th scope="col">{columnField ? `${column} — ${metricLabel(metric, data.fields)}` : metricLabel(metric, data.fields)}</th>))}
                {component.showTotals && metrics.map(metric => <th scope="col">{metricLabel(metric, data.fields)} total</th>)}
            </tr></thead>
            <tbody>{rowKeys.map(keys => {
                const rowSubset = rowGroups.get(JSON.stringify(keys)) ?? [];
                return <tr>
                    {keys.map(value => <th scope="row">{value}</th>)}
                    {columnValues.flatMap(column => metrics.map((metric, metricIndex) => renderCell(keys, column, metric, metricIndex)))}
                    {component.showTotals && metrics.map(metric => <td><strong>{formatValue(valueFor(rowSubset, metric), metric.format)}</strong></td>)}
                </tr>;
            })}</tbody>
        </table></div>
    </Card>;
}
