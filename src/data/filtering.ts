import { indexRows } from "./rowIndex";
import { FilterOperator } from "../schema/hyperpbiSchema";
import { DataRow, Primitive } from "./normalizeData";

export interface ActiveFilter { id: string; field: string; operator: FilterOperator; value: unknown; }

function equal(actual: unknown, expected: unknown): boolean { return actual === expected || actual != null && expected != null && String(actual) === String(expected); }
const isoDate = /^\d{4}-\d{2}-\d{2}(?:$|T)/;
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
const dateValue = (value: unknown): number => {
    if (value instanceof Date) return value.getTime();
    return typeof value === "string" && isoDate.test(value) ? Date.parse(value) : NaN;
};

export function exclusiveEndDate(value: unknown): string | undefined {
    if (typeof value !== "string" || !dateOnly.test(value)) return undefined;
    const day = dateValue(value);
    return Number.isFinite(day) ? new Date(day + 86_400_000).toISOString().slice(0, 10) : undefined;
}

function compareRange(expected: unknown, component: boolean): (actual: Primitive) => boolean {
    if (!Array.isArray(expected) || expected.length < 2) return () => false;
    const [start, end] = expected;
    if (start == null || start === "" || end == null || end === "") return () => false;
    const dateStart = dateValue(start);
    const dateEnd = dateValue(end);
    if (Number.isFinite(dateStart) && Number.isFinite(dateEnd)) {
        const entireEndDate = typeof end === "string" && dateOnly.test(end);
        return actual => {
            const point = dateValue(actual);
            return point >= dateStart && (entireEndDate ? point < dateEnd + 86_400_000 : point <= dateEnd);
        };
    }
    const low = Number(start);
    const high = Number(end);
    if (Number.isFinite(low) && Number.isFinite(high)) {
        return actual => actual != null && actual !== "" && Number(actual) >= low && Number(actual) <= high;
    }
    if (component && typeof start === "string" && typeof end === "string") {
        return actual => actual != null && String(actual) >= start && String(actual) <= end;
    }
    return () => false;
}

/** Prepare operands once for both dashboard and routed component filters. */
export function compileFilter(operator: FilterOperator, expected: unknown, mode: "dashboard" | "component" = "dashboard"): (actual: Primitive) => boolean {
    const component = mode === "component";
    const equals = component ? (actual: unknown, value: unknown) => actual === value : equal;
    if (operator === "=") return actual => equals(actual, expected);
    if (operator === "!=") return actual => !equals(actual, expected);
    if (operator === "contains") {
        const text = String(expected ?? "").toLowerCase();
        return actual => String(actual ?? "").toLowerCase().includes(text);
    }
    if (operator === "in") {
        if (!Array.isArray(expected)) return () => false;
        const values = new Set(expected);
        if (component) return actual => values.has(actual) && !(typeof actual === "number" && Number.isNaN(actual));
        const strings = new Set(expected.filter(value => value != null).map(String));
        return actual => values.has(actual) && !(typeof actual === "number" && Number.isNaN(actual)) || actual != null && strings.has(String(actual));
    }
    if (operator === "between") return compareRange(expected, component);
    const time = dateValue(expected);
    const right = Number.isFinite(time) ? time : Number(expected);
    if (!Number.isFinite(right)) return () => false;
    return actual => {
        const left = Number.isFinite(time) ? dateValue(actual) : Number(actual);
        if (!Number.isFinite(left)) return false;
        if (operator === ">") return left > right;
        if (operator === ">=") return left >= right;
        if (operator === "<") return left < right;
        return left <= right;
    };
}

export function matchesFilter(actual: Primitive, operator: FilterOperator, expected: unknown): boolean {
    return compileFilter(operator, expected)(actual);
}

/** Keep source positions as we filter. No reverse row/key indexes or copies
 * are needed when all rows pass. */
export function dashboardRowView(rows: DataRow[], filters: ActiveFilter[], search: string, fieldKeys?: string[]): { rows: DataRow[]; sourceIndices?: number[] } {
    const needle = search.trim().toLowerCase();
    if (!filters.length && !needle) return { rows };
    const predicates = filters.map(filter => ({ field: filter.field, match: compileFilter(filter.operator, filter.value) }));
    let selected: DataRow[] | undefined;
    let indices: number[] | undefined;
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const matches = predicates.every(filter => filter.match(row[filter.field])) &&
            (!needle || (fieldKeys
                ? fieldKeys.some(field => String(row[field] ?? "").toLowerCase().includes(needle))
                : Object.values(row).some(value => String(value ?? "").toLowerCase().includes(needle))));
        if (!matches && !selected) {
            selected = rows.slice(0, index);
            indices = Array.from({ length: index }, (_, i) => i);
        } else if (matches && selected) {
            selected.push(row);
            indices!.push(index);
        }
    }
    return { rows: selected ?? rows, sourceIndices: indices };
}

export function filterRows(rows: DataRow[], filters: ActiveFilter[], search: string): DataRow[] {
    return dashboardRowView(rows, filters, search).rows;
}

export function resolveSourceRowIndicesForFilter(field: string | undefined, operator: FilterOperator, value: unknown, sourceRows: DataRow[], currentRows: DataRow[] = sourceRows): number[] {
    const sourceIndices = indexRows(sourceRows);
    const match = compileFilter(operator, value);
    return currentRows.reduce<number[]>((indices, row) => {
        const matches = field ? match(row[field]) : operator === "contains" && Object.values(row).some(match);
        const sourceIndex = matches ? sourceIndices.get(row) : undefined;
        if (sourceIndex !== undefined) indices.push(sourceIndex);
        return indices;
    }, []);
}
