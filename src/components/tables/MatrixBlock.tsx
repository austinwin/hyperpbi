import { indexRows } from "../../data/rowIndex";
import { aggregateValue } from "../../data/aggregations";
import { DataRow } from "../../data/normalizeData";
import { MatrixComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { useMemo } from "preact/hooks";

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
    const selectedRowSet = useMemo(() => new Set(selectedRows), [selectedRows]);
    const rowFields = component.rows;
    const columnField = component.columns?.[0];
    const metrics = component.values;
    const displayedMetrics = useMemo(() => metrics.length ? metrics : [{ aggregation: "count" as const }], [metrics]);
    const matrix = useMemo(() => {
        const columns = new Set<string>();
        if (!columnField) columns.add("");
        let moreColumns = false;
        const candidates = new Map<string, string[]>();
        const maxRows = Math.min(MATRIX_CELL_BUDGET, component.maxRows ?? 200);
        let moreRows = false;
        for (const row of rows) {
            if (columnField) {
                const value = String(row[columnField] ?? BLANK);
                if (columns.size < MATRIX_COLUMN_LIMIT) columns.add(value);
                else if (!columns.has(value)) moreColumns = true;
            }
            if (candidates.size < maxRows || !moreRows) {
                const keys = tuple(row, rowFields);
                const key = JSON.stringify(keys);
                if (candidates.size < maxRows && !candidates.has(key)) candidates.set(key, keys);
                else if (!candidates.has(key)) moreRows = true;
            }
        }
        const columnValues = Array.from(columns);
        const columnsPerRow = Math.max(1, columnValues.length) * displayedMetrics.length + (component.showTotals ? displayedMetrics.length : 0);
        const limit = matrixVisibleRowLimit(candidates.size, columnsPerRow);
        const rowKeys = Array.from(candidates.values()).slice(0, limit);
        const truncated = moreRows || moreColumns || rowKeys.length < candidates.size;
        const groups = new Map(rowKeys.map(keys => [JSON.stringify(keys), { rows: [] as DataRow[], cells: new Map<string, DataRow[]>() }]));
        for (const row of rows) {
            const group = groups.get(JSON.stringify(tuple(row, rowFields)));
            if (!group) continue;
            if (component.showTotals) group.rows.push(row);
            const column = columnField ? String(row[columnField] ?? BLANK) : "";
            if (!columns.has(column)) continue;
            const cell = group.cells.get(column);
            if (cell) cell.push(row);
            else group.cells.set(column, [row]);
        }
        const cellValues = new Map<DataRow[], ReturnType<typeof aggregateValue>[]>();
        const maxima = displayedMetrics.map(() => 1);
        for (const group of groups.values()) for (const subset of group.cells.values()) {
            const values = displayedMetrics.map(metric => aggregateValue(subset, metric.field, metric.aggregation ?? "sum", metric.where));
            cellValues.set(subset, values);
            values.forEach((value, index) => { maxima[index] = Math.max(maxima[index], Math.abs(Number(value) || 0)); });
        }
        return { columnValues, rowKeys, groups, truncated, cellValues, maxima };
    }, [rows, rowFields, columnField, displayedMetrics, component.maxRows, component.showTotals]);
    const { columnValues, rowKeys, truncated, groups, cellValues, maxima } = matrix;
    const valueFor = (subset: DataRow[], metric: MatrixComponent["values"][number]) => aggregateValue(subset, metric.field, metric.aggregation ?? "sum", metric.where);

    const renderCell = (keys: string[], column: string, metric: MatrixComponent["values"][number], metricIndex: number) => {
        const subset = groups.get(JSON.stringify(keys))?.cells.get(column) ?? [];
        const values = cellValues.get(subset);
        const value = values ? values[metricIndex] : valueFor([], metric);
        const resolveIndices = () => subset.map(row => indexRows(sourceRows).get(row)).filter((index): index is number => index !== undefined);
        const explicitField = policy.field;
        const formatted = formatValue(value, metric.format);
        const intensity = Math.abs(Number(value) || 0) / maxima[metricIndex];
        const selected = selectedRowSet.size > 0 && subset.some(row => selectedRowSet.has(indexRows(sourceRows).get(row) ?? -1));
        const columnLabel = columnField ? `${column}, ` : "";
        const accessibleLabel = `${keys.join(", ")}, ${columnLabel}${metricLabel(metric, data.fields)}: ${formatted}`;
        return <td
            key={`${column}\u0000${metric.field ?? "count"}\u0000${metricIndex}`}
            data-metric-index={metricIndex}
            class={selected ? "hp-row-selected" : ""}
            aria-label={accessibleLabel}
            title={accessibleLabel}
            onClick={event => {
                if (!policy.enabled) return;
                const values = explicitField ? Array.from(new Set(subset.map(row => row[explicitField]))) : [];
                executeComponentInteraction(policy, createInteractionPayload(component, { rowIndices: resolveIndices(), sourceRowKeys: context.sourceRowKeys, field: explicitField, value: values.length === 1 ? values[0] : policy.value }), context, { trigger: "click", multiSelect: event.ctrlKey || event.metaKey, event });
            }}
            style={component.heatmap ? { background: `color-mix(in srgb, var(--hp-primary) ${Math.round(intensity * 28)}%, var(--hp-surface))` } : undefined}
        >{formatted}</td>;
    };

    return <Card title={component.title}>
        {truncated && <p class="hp-inline-warning" role="status">Matrix truncated to {rowKeys.length} rows and {columnValues.length} column groups to stay within the {MATRIX_CELL_BUDGET.toLocaleString()}-cell rendering budget.</p>}
        <div class="hp-table-wrap"><table class="hp-matrix" aria-label={component.ariaLabel ?? component.title ?? "Matrix"}>
            <thead><tr>
                {rowFields.map(field => <th key={field} scope="col">{data.fields[field]?.displayName ?? field}</th>)}
                {columnValues.flatMap(column => displayedMetrics.map((metric, metricIndex) => <th key={`${column}\u0000${metric.field ?? "count"}\u0000${metricIndex}`} scope="col">{columnField ? `${column} — ${metricLabel(metric, data.fields)}` : metricLabel(metric, data.fields)}</th>))}
                {component.showTotals && displayedMetrics.map((metric, metricIndex) => <th key={`total-${metric.field ?? "count"}-${metricIndex}`} scope="col">{metricLabel(metric, data.fields)} total</th>)}
            </tr></thead>
            <tbody>{rowKeys.map(keys => {
                const serializedKeys = JSON.stringify(keys);
                const rowSubset = groups.get(serializedKeys)?.rows ?? [];
                return <tr key={serializedKeys}>
                    {keys.map((value, index) => <th key={`${index}-${value}`} scope="row">{value}</th>)}
                    {columnValues.flatMap(column => displayedMetrics.map((metric, metricIndex) => renderCell(keys, column, metric, metricIndex)))}
                    {component.showTotals && displayedMetrics.map((metric, metricIndex) => <td key={`total-${metric.field ?? "count"}-${metricIndex}`}><strong>{formatValue(valueFor(rowSubset, metric), metric.format)}</strong></td>)}
                </tr>;
            })}</tbody>
        </table></div>
    </Card>;
}
