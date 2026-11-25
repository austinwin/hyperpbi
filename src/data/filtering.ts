import { indexRows } from "./rowIndex";
import { FilterOperator } from "../schema/hyperpbiSchema";
import { DataRow, Primitive } from "./normalizeData";

export interface ActiveFilter { id: string; field: string; operator: FilterOperator; value: unknown; }

function equal(actual: unknown, expected: unknown): boolean { return actual === expected || actual != null && expected != null && String(actual) === String(expected); }
export function matchesFilter(actual: Primitive, operator: FilterOperator, expected: unknown): boolean {
    if (operator === "=") return equal(actual, expected);
    if (operator === "!=") return !equal(actual, expected);
    if (operator === "contains") return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    if (operator === "in") return Array.isArray(expected) && expected.some(value => equal(actual, value));
    if (operator === "between") return Array.isArray(expected) && expected.length >= 2 && Number(actual) >= Number(expected[0]) && Number(actual) <= Number(expected[1]);
    const left = actual instanceof Date ? actual.getTime() : Number(actual);
    const right = expected instanceof Date ? expected.getTime() : Number(expected);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    if (operator === ">") return left > right;
    if (operator === ">=") return left >= right;
    if (operator === "<") return left < right;
    return left <= right;
}

/** Keep source positions as we filter. No reverse row/key indexes or copies
 * are needed when all rows pass. */
export function dashboardRowView(rows: DataRow[], filters: ActiveFilter[], search: string, fieldKeys?: string[]): { rows: DataRow[]; sourceIndices?: number[] } {
    const needle = search.trim().toLowerCase();
    if (!filters.length && !needle) return { rows };
    let selected: DataRow[] | undefined;
    let indices: number[] | undefined;
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const matches = filters.every(filter => matchesFilter(row[filter.field], filter.operator, filter.value)) &&
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
    return currentRows.reduce<number[]>((indices, row) => {
        const matches = field ? matchesFilter(row[field], operator, value) : operator === "contains" && Object.values(row).some(item => matchesFilter(item, "contains", value));
        const sourceIndex = matches ? sourceIndices.get(row) : undefined;
        if (sourceIndex !== undefined) indices.push(sourceIndex);
        return indices;
    }, []);
}
