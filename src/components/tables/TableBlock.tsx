import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { sortRows } from "../../data/sorting";
import { DataRow } from "../../data/normalizeData";
import { TableColumn, TableComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { SlotRenderer } from "../custom/slotRenderer";
import { clearComponentInteraction, executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

function columnDefinition(column: string | TableColumn): TableColumn {
    return typeof column === "string" ? { field: column } : column;
}

export const MAX_RENDERED_TABLE_ROWS = 5_000;
export const TABLE_VIRTUALIZATION_THRESHOLD = 100;
export const TABLE_ROW_HEIGHT = 31;
const TABLE_OVERSCAN_ROWS = 8;

export interface TableVirtualRange {
    start: number;
    end: number;
    topSpacer: number;
    bottomSpacer: number;
}

export function tableVirtualRange(
    rowCount: number,
    scrollTop: number,
    viewportHeight: number,
    rowHeight = TABLE_ROW_HEIGHT,
    overscan = TABLE_OVERSCAN_ROWS,
): TableVirtualRange {
    if (rowCount <= 0) return { start: 0, end: 0, topSpacer: 0, bottomSpacer: 0 };
    const safeHeight = Math.max(rowHeight, viewportHeight);
    const visibleCount = Math.ceil(safeHeight / rowHeight);
    const rawStart = Math.min(
        Math.max(0, rowCount - visibleCount),
        Math.floor(Math.max(0, scrollTop) / rowHeight),
    );
    const start = Math.max(0, Math.min(rowCount, rawStart - overscan));
    const end = Math.max(start, Math.min(rowCount, rawStart + visibleCount + overscan));
    return {
        start,
        end,
        topSpacer: start * rowHeight,
        bottomSpacer: Math.max(0, (rowCount - end) * rowHeight),
    };
}

export function buildTableSearchIndex(rows: readonly DataRow[], fields: readonly string[]): string[] {
    return rows.map(row => fields.map(field => String(row[field] ?? "").toLowerCase()).join("\u0000"));
}

export function nextTableSelection(current: number[], index: number, multi: boolean): number[] {
    const selected = current.includes(index);
    return multi
        ? selected ? current.filter(item => item !== index) : [...current, index]
        : selected ? [] : [index];
}

export function tableRowsForSelection<T>(
    rows: T[],
    sourceRows: T[],
    selectedRows: number[],
    mode: TableComponent["selectionMode"],
    internal = true,
): T[] {
    if (!internal || mode === "highlight" || !selectedRows.length) return rows;
    const indices = new Map(sourceRows.map((row, index) => [row, index] as const));
    const selected = new Set(selectedRows);
    return rows.filter(row => {
        const index = indices.get(row);
        return index !== undefined && selected.has(index);
    });
}

function cellStyle(column: TableColumn, value: unknown): Record<string, string> | undefined {
    const rule = column.conditional?.find(item => {
        if (item.operator === "=") return value === item.value;
        if (item.operator === "!=") return value !== item.value;
        if (item.operator === ">") return Number(value) > Number(item.value);
        if (item.operator === ">=") return Number(value) >= Number(item.value);
        if (item.operator === "<") return Number(value) < Number(item.value);
        if (item.operator === "<=") return Number(value) <= Number(item.value);
        return item.operator === "contains" && String(value).includes(String(item.value));
    });
    if (!rule) return undefined;
    const safe = (input?: string) => input && /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\))$/i.test(input) ? input : undefined;
    return { color: safe(rule.color) ?? "inherit", background: safe(rule.background) ?? "transparent" };
}

export function SimpleVirtualTable({ component }: { component: TableComponent }) {
    const context = useRenderContext();
    const { sourceRows, sourceRowKeys, data, settings, state, dispatch, getRowsForComponent, componentRows } = context;
    const id = component.id ?? "table";
    const policy = resolveInteractionPolicy(component, context.config, "dataPoint");
    const rows = getRowsForComponent(id);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>();
    const [scrollTop, setScrollTop] = useState(0);
    const scrollFrameRef = useRef<number>();
    const pendingScrollTopRef = useRef(0);
    const tableWrapRef = useRef<HTMLDivElement>(null);
    const anonymousRowKeysRef = useRef(new WeakMap<object, string>());
    const anonymousRowKeySequenceRef = useRef(0);

    const columns = useMemo<TableColumn[]>(
        () => (component.columns?.length
            ? component.columns.map(columnDefinition)
            : Object.keys(data.fields).map(field => ({ field })))
            .filter(column => data.fields[column.field]),
        [component.columns, data.fields],
    );
    const columnFields = useMemo(() => columns.map(column => column.field), [columns]);
    const maxRows = Math.min(component.maxRows ?? settings.table.maxRows, settings.table.maxRows, MAX_RENDERED_TABLE_ROWS);
    const needle = (state.tableSearch[id] ?? "").trim().toLowerCase();
    const selectedRows = state.componentSelectedRows[id] ?? [];
    const highlightedRows = componentRows(id);
    const selectedRowSet = useMemo(() => new Set(selectedRows), [selectedRows]);
    const highlightedRowSet = useMemo(() => new Set(highlightedRows), [highlightedRows]);
    const sourceIndices = useMemo(
        () => new Map(sourceRows.map((row, index) => [row, index] as const)),
        [sourceRows],
    );
    const searchIndex = useMemo(
        () => buildTableSearchIndex(rows, columnFields),
        [rows, columnFields],
    );
    const prepared = useMemo(() => {
        const matching = needle ? rows.filter((_row, index) => searchIndex[index].includes(needle)) : rows;
        return sort ? sortRows(matching, sort.field, sort.direction) : matching;
    }, [rows, searchIndex, needle, sort]);
    const limited = useMemo(() => prepared.slice(0, maxRows), [prepared, maxRows]);
    const pageSize = Math.max(5, component.pageSize ?? 25);
    const paginate = component.pagination ?? settings.table.pagination;
    const pages = Math.max(1, Math.ceil(limited.length / pageSize));
    const virtualized = !paginate && limited.length > TABLE_VIRTUALIZATION_THRESHOLD;
    const range = virtualized
        ? tableVirtualRange(limited.length, scrollTop, 480)
        : { start: 0, end: limited.length, topSpacer: 0, bottomSpacer: 0 };
    const visible = paginate
        ? limited.slice((page - 1) * pageSize, page * pageSize)
        : limited.slice(range.start, range.end);

    useEffect(() => setPage(current => Math.min(current, pages)), [pages]);
    useEffect(() => {
        setPage(1);
        setScrollTop(0);
        if (tableWrapRef.current) tableWrapRef.current.scrollTop = 0;
    }, [needle, sort?.field, sort?.direction]);
    useEffect(() => () => {
        if (scrollFrameRef.current !== undefined) cancelAnimationFrame(scrollFrameRef.current);
    }, []);

    const toggleSort = (field: string) =>
        setSort(current => ({
            field,
            direction: current?.field === field && current.direction === "asc" ? "desc" : "asc",
        }));
    const onScroll = (event: Event) => {
        pendingScrollTopRef.current = event.currentTarget instanceof HTMLElement ? event.currentTarget.scrollTop : 0;
        if (scrollFrameRef.current !== undefined) return;
        scrollFrameRef.current = requestAnimationFrame(() => {
            scrollFrameRef.current = undefined;
            setScrollTop(pendingScrollTopRef.current);
        });
    };
    const rowKey = (row: DataRow, fallbackIndex: number) => {
        const sourceIndex = sourceIndices.get(row);
        if (sourceIndex !== undefined)
            return sourceRowKeys[sourceIndex] ?? `source-row-${sourceIndex}`;
        let key = anonymousRowKeysRef.current.get(row);
        if (!key) {
            key = `table-row-${fallbackIndex}-${++anonymousRowKeySequenceRef.current}`;
            anonymousRowKeysRef.current.set(row, key);
        }
        return key;
    };

    return <>
        {(component.search ?? settings.table.search) && <div class="hp-table-toolbar">
            <input class="form-control form-control-sm" type="search" placeholder="Search table…" value={state.tableSearch[id] ?? ""} onInput={event => dispatch({ type: "tableSearch", id, value: event.currentTarget.value })} />
            {selectedRows.length > 0 && <button type="button" class="btn btn-sm" onClick={() => clearComponentInteraction(policy, id, context)}>{policy.internalMode === "filter" ? "Show all" : "Clear selection"}</button>}
            <span>{limited.length.toLocaleString()} rows</span>
        </div>}
        {columns.length > 0 && rows.length > 0 ? <div ref={tableWrapRef} class={`hp-table-wrap${virtualized ? " hp-table-virtual" : ""}`} onScroll={virtualized ? onScroll : undefined}>
            <table class="table table-sm table-vcenter hp-table" aria-rowcount={limited.length}>
                <thead><tr>
                    {policy.showSelector && <th aria-label="Selection" />}
                    {columns.map(column => <th key={column.field} style={{ width: column.width ? `${column.width}px` : undefined }} aria-sort={sort?.field === column.field ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>
                        <button type="button" onClick={() => toggleSort(column.field)}>{column.title ?? data.fields[column.field]?.displayName ?? column.field}{sort?.field === column.field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button>
                    </th>)}
                </tr></thead>
                <tbody>
                    {range.topSpacer > 0 && <tr key="virtual-top" class="hp-table-spacer" aria-hidden="true"><td colSpan={columns.length + (policy.showSelector ? 1 : 0)} style={{ height: `${range.topSpacer}px` }} /></tr>}
                    {visible.map((row, visibleIndex) => {
                        const preparedIndex = (paginate ? (page - 1) * pageSize : range.start) + visibleIndex;
                        const index = sourceIndices.get(row) ?? -1;
                        const selected = selectedRowSet.has(index);
                        const highlighted = highlightedRowSet.has(index);
                        return <tr key={rowKey(row, preparedIndex)} class={highlighted ? "hp-row-selected" : ""} aria-rowindex={preparedIndex + 2} onClick={event => {
                            const field = policy.field;
                            executeComponentInteraction(policy, createInteractionPayload(component, {
                                rowIndices: index >= 0 ? [index] : [],
                                sourceRowKeys: context.sourceRowKeys,
                                field,
                                value: field ? row[field] : undefined,
                            }), context, { trigger: "click", multiSelect: event.ctrlKey || event.metaKey, event });
                        }}>
                            {policy.showSelector && <td><input type="checkbox" checked={selected} aria-label="Select row" /></td>}
                            {columns.map(column => <td key={column.field} class={column.hozAlign ? `text-${column.hozAlign}` : ""} style={cellStyle(column, row[column.field])}>{formatValue(row[column.field], column.format ?? data.fields[column.field]?.format)}</td>)}
                        </tr>;
                    })}
                    {range.bottomSpacer > 0 && <tr key="virtual-bottom" class="hp-table-spacer" aria-hidden="true"><td colSpan={columns.length + (policy.showSelector ? 1 : 0)} style={{ height: `${range.bottomSpacer}px` }} /></tr>}
                </tbody>
            </table>
        </div> : component.slots?.empty ? <SlotRenderer component={component} name="empty" /> : <EmptyState title="No table data">Bind fields or clear active filters.</EmptyState>}
        {prepared.length > maxRows && <div class="hp-table-warning">Showing the first {maxRows.toLocaleString()} rows for performance.</div>}
        {paginate && pages > 1 && <div class="hp-pagination"><button type="button" class="btn btn-sm" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" class="btn btn-sm" disabled={page >= pages} onClick={() => setPage(current => current + 1)}>Next</button></div>}
    </>;
}

export function TableBlock({ component }: { component: TableComponent }) {
    return <Card title={component.title}><SimpleVirtualTable component={component} /></Card>;
}
