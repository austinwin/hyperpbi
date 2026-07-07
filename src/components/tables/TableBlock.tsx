import { useEffect, useMemo, useState } from "preact/hooks";
import { sortRows } from "../../data/sorting";
import { TableColumn, TableComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { SlotRenderer } from "../custom/slotRenderer";

function columnDefinition(column: string | TableColumn): TableColumn { return typeof column === "string" ? { field: column } : column; }
export const MAX_RENDERED_TABLE_ROWS = 5000;
export function nextTableSelection(current: number[], index: number, multi: boolean): number[] { const selected=current.includes(index); return multi?(selected?current.filter(item=>item!==index):[...current,index]):(selected?[]:[index]); }
export function tableRowsForSelection<T>(rows:T[],sourceRows:T[],selectedRows:number[],mode:TableComponent["selectionMode"],internal=true):T[]{if(!internal||mode==="highlight"||!selectedRows.length)return rows;const indices=new Map(sourceRows.map((row,index)=>[row,index] as const));const selected=new Set(selectedRows);return rows.filter(row=>{const index=indices.get(row);return index!==undefined&&selected.has(index);});}

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
    const { rows, sourceRows, data, settings, state, dispatch, selectExternal, clearExternal, reportInteraction } = useRenderContext();
    const id = component.id ?? "table";
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }>();
    const columns: TableColumn[] = (component.columns?.length ? component.columns.map(columnDefinition) : Object.keys(data.fields).map(field => ({ field }))).filter(column => data.fields[column.field]);
    const maxRows = Math.min(component.maxRows ?? settings.table.maxRows, settings.table.maxRows, MAX_RENDERED_TABLE_ROWS);
    const needle = (state.tableSearch[id] ?? "").trim().toLowerCase();
    const selectedRows = state.componentSelectedRows[id] ?? (component.internal === false ? [] : state.selectedRows);
    const sourceIndices = useMemo(() => new Map(sourceRows.map((row,index)=>[row,index] as const)), [sourceRows]);
    const tableRows = tableRowsForSelection(rows,sourceRows,selectedRows,component.selectionMode,component.internal !== false);
    const prepared = useMemo(() => {
        const matching = needle ? tableRows.filter(row => columns.some(column => String(row[column.field] ?? "").toLowerCase().includes(needle))) : tableRows;
        return sort ? sortRows(matching, sort.field, sort.direction) : matching;
    }, [tableRows, needle, sort, columns.map(column => column.field).join("|")]);
    const limited = prepared.slice(0, maxRows);
    const pageSize = Math.max(5, component.pageSize ?? 25);
    const paginate = component.pagination ?? settings.table.pagination;
    const pages = Math.max(1, Math.ceil(limited.length / pageSize));
    useEffect(() => setPage(current => Math.min(current, pages)), [pages]);
    const visible = paginate ? limited.slice((page - 1) * pageSize, page * pageSize) : limited;
    const toggleSort = (field: string) => setSort(current => ({ field, direction: current?.field === field && current.direction === "asc" ? "desc" : "asc" }));

    return <>
        {(component.search ?? settings.table.search) && <div class="hp-table-toolbar"><input class="form-control form-control-sm" type="search" placeholder="Search table…" value={state.tableSearch[id] ?? ""} onInput={event => dispatch({ type: "tableSearch", id, value: event.currentTarget.value })} />{selectedRows.length > 0 && <button type="button" class="btn btn-sm" onClick={() => { dispatch({ type: "selectComponentRows", id, rows: [] }); if (component.internal !== false) dispatch({ type: "selectRows", rows: [] }); if (component.external !== false) clearExternal({ componentId: id, componentType: component.type }); else reportInteraction({ componentId: id, componentType: component.type }); }}>{component.selectionMode === "highlight" || component.internal === false ? "Clear selection" : "Show all"}</button>}<span>{limited.length.toLocaleString()} rows</span></div>}
        {columns.length && rows.length ? <div class="hp-table-wrap"><table class="table table-sm table-vcenter hp-table"><thead><tr>
            {component.selectable && <th aria-label="Selection" />}
            {columns.map(column => <th style={{ width: column.width ? `${column.width}px` : undefined }}><button type="button" onClick={() => toggleSort(column.field)}>{column.title ?? data.fields[column.field]?.displayName ?? column.field}{sort?.field === column.field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button></th>)}
        </tr></thead><tbody>{visible.map(row => {
            const index = sourceIndices.get(row) ?? -1; const selected = selectedRows.includes(index);
            return <tr class={selected ? "hp-row-selected" : ""} onClick={event => { if (!component.selectable) return; const multi = event.ctrlKey || event.metaKey; const next = nextTableSelection(selectedRows,index,multi); dispatch({ type: "selectComponentRows", id, rows: next }); if (component.internal !== false) dispatch({ type: "selectRows", rows: next }); const firstField=columns.find(column=>data.fields[column.field]?.sourceTable&&data.fields[column.field]?.sourceColumn)?.field??columns[0]?.field;const values=firstField?Array.from(new Set(next.map(rowIndex=>sourceRows[rowIndex]?.[firstField]).filter(value=>value!==undefined))):[]; const details={componentId:id,componentType:component.type,field:firstField,value:values.length>1?values:values[0],filterOperator:(values.length>1?"in":"=") as "in"|"=",matchedRowCount:next.length}; if(component.external!==false)selectExternal(next,multi,details);else reportInteraction(details,"component did not call selectExternal",next); }}>
                {component.selectable && <td><input type="checkbox" checked={selected} aria-label="Select row" /></td>}
                {columns.map(column => <td class={column.hozAlign ? `text-${column.hozAlign}` : ""} style={cellStyle(column, row[column.field])}>{formatValue(row[column.field], column.format ?? data.fields[column.field]?.format)}</td>)}
            </tr>;
        })}</tbody></table></div> : component.slots?.empty ? <SlotRenderer component={component} name="empty" /> : <EmptyState title="No table data">Bind fields or clear active filters.</EmptyState>}
        {prepared.length > maxRows && <div class="hp-table-warning">Showing the first {maxRows.toLocaleString()} rows for performance.</div>}
        {paginate && pages > 1 && <div class="hp-pagination"><button type="button" class="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" class="btn btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </>;
}

export function TableBlock({ component }: { component: TableComponent }) { return <Card title={component.title}><SimpleVirtualTable component={component} /></Card>; }
