import type { DataRow, Primitive } from "../../data/normalizeData";
import type { DashboardState } from "../../render/stateStore";
import type { SvgBoundValue, SvgConditionDefinition, SvgDataContextDefinition, SvgPrimitive, SvgScaleDefinition, SvgValue } from "./svgTypes";
import { compareSortValues } from "../../data/sorting";
import { compileSvgScale } from "./svgScales";

export interface SvgBindingContext { row: DataRow; rows: DataRow[]; state: DashboardState; index?: number; count?: number; warnings?: string[]; }
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const fieldValue = (field: string, context: SvgBindingContext): unknown => field === "$index" ? context.index ?? 0 : field === "$count" ? context.count ?? context.rows.length : context.row[field];
const compare = (condition: SvgConditionDefinition, context: SvgBindingContext): boolean => { const left = fieldValue(condition.field, context), right = condition.value; switch (condition.operator) { case "=": return left === right || String(left) === String(right); case "!=": return !(left === right || String(left) === String(right)); case ">": return Number(left) > Number(right); case ">=": return Number(left) >= Number(right); case "<": return Number(left) < Number(right); case "<=": return Number(left) <= Number(right); case "contains": return String(left ?? "").includes(String(right ?? "")); case "in": return Array.isArray(right) && right.some(item => String(item) === String(left)); case "between": return Array.isArray(right) && right.length === 2 && Number(left) >= Number(right[0]) && Number(left) <= Number(right[1]); } };
export const renderSvgTemplate = (template: string, context: SvgBindingContext): string => template.replace(/\{\{\s*([A-Za-z_$][\w$.-]*)\s*\}\}/g, (_match, token: string) => { const key = token.startsWith("row.") ? token.slice(4) : token.startsWith("state.") ? token.slice(6) : token; const value = token.startsWith("state.") ? context.state.values[key] : fieldValue(key, context); if (value === undefined) { context.warnings?.push(`SVG template field “${token}” was not found.`); return ""; } return String(value); });
const scaleByRows = new WeakMap<DataRow[], WeakMap<SvgScaleDefinition, Map<string, (value: unknown) => SvgPrimitive>>>();
const aggregatesByRows = new WeakMap<DataRow[], DataRow>();

function boundScale(rows: DataRow[], field: string, scale: SvgScaleDefinition) {
    let byScale = scaleByRows.get(rows);
    if (!byScale) scaleByRows.set(rows, byScale = new WeakMap());
    let byField = byScale.get(scale);
    if (!byField) byScale.set(scale, byField = new Map());
    let compiled = byField.get(field);
    if (!compiled) {
        const values = function* () { for (const row of rows) yield row[field]; };
        compiled = compileSvgScale(scale, values());
        byField.set(field, compiled);
    }
    return compiled;
}

function resolveBound(value: SvgBoundValue, context: SvgBindingContext): SvgPrimitive {
    if (value.when) return compare(value.when, context) ? value.then ?? null : value.else ?? null;
    if (value.state) { const actual = context.state.values[value.state], expected = object(value.equals) && typeof value.equals.template === "string" ? renderSvgTemplate(value.equals.template, context) : value.equals; return String(actual) === String(expected) ? value.then ?? true : value.else ?? false; }
    if (value.template !== undefined) return renderSvgTemplate(value.template, context);
    if (value.bind !== undefined) { const raw = fieldValue(value.bind, context); if (raw === undefined) context.warnings?.push(`SVG field “${value.bind}” was not found.`); if (value.map) return value.map[String(raw)] ?? value.fallback ?? null; if (value.scale) return boundScale(context.rows, value.bind, value.scale)(raw); return raw == null || ["string", "number", "boolean"].includes(typeof raw) ? raw as SvgPrimitive : String(raw); }
    return value.fallback ?? null;
}
export function resolveSvgValue(value: SvgValue | undefined, context: SvgBindingContext): SvgPrimitive | undefined { if (value === undefined) return undefined; return object(value) ? resolveBound(value as SvgBoundValue, context) : value as SvgPrimitive; }
export function compileSvgPosition(position: { x?: SvgValue; y?: SvgValue; rotate?: SvgValue; scale?: SvgValue } | undefined, context: SvgBindingContext): string | undefined { if (!position) return undefined; const x = Number(resolveSvgValue(position.x, context) ?? 0), y = Number(resolveSvgValue(position.y, context) ?? 0), rotate = Number(resolveSvgValue(position.rotate, context) ?? 0), scale = Number(resolveSvgValue(position.scale, context) ?? 1); if (![x, y, rotate, scale].every(Number.isFinite)) { context.warnings?.push("SVG position contains a nonnumeric value."); return undefined; } return `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`; }
export function aggregateSvgRow(rows: DataRow[]): DataRow {
    const cached = aggregatesByRows.get(rows);
    if (cached) return cached;
    const columns = new Map<string, { first: Primitive; numeric: boolean; sum: number }>();
    for (const row of rows) for (const field of Object.keys(row)) {
        const value = row[field];
        let column = columns.get(field);
        if (!column) {
            column = { first: null, numeric: true, sum: 0 };
            columns.set(field, column);
        }
        if (value == null) continue;
        if (column.first == null) column.first = value;
        if (typeof value === "number" && Number.isFinite(value)) column.sum += value;
        else column.numeric = false;
    }
    const result = Object.fromEntries(Array.from(columns, ([key, value]) => [key, value.numeric && value.first != null ? value.sum : value.first]));
    aggregatesByRows.set(rows, result);
    return result;
}

export function resolveSvgDataContextRow(dataContext: SvgDataContextDefinition | undefined, rows: DataRow[], rowKeys: string[], selectedKeys: string[], warnings: string[]): DataRow {
    const mode = dataContext?.mode ?? "aggregate";
    if (mode === "selectedRow") {
        const selected = selectedKeys.length ? rowKeys.indexOf(selectedKeys[0]) : -1;
        if (selected >= 0 && rows[selected]) return rows[selected];
        warnings.push("SVG selectedRow context has no selected row; aggregate context was used.");
    }
    if (mode !== "first") return aggregateSvgRow(rows);
    const field = dataContext?.sortBy;
    let first = rows[0];
    if (field) {
        const direction = dataContext.sortDirection === "asc" ? 1 : -1;
        for (const row of rows) if (compareSortValues(row[field], first[field]) * direction < 0) first = row;
    } else if (rows.length > 1) warnings.push("SVG first-row context is nondeterministic without sortBy.");
    return first ?? {};
}
