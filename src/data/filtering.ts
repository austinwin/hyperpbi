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

export function filterRows(rows: DataRow[], filters: ActiveFilter[], search: string): DataRow[] {
    const needle = search.trim().toLowerCase();
    return rows.filter(row => filters.every(filter => matchesFilter(row[filter.field], filter.operator, filter.value)) && (!needle || Object.values(row).some(value => String(value ?? "").toLowerCase().includes(needle))));
}

export function resolveSourceRowIndicesForFilter(field: string | undefined, operator: FilterOperator, value: unknown, sourceRows: DataRow[], currentRows: DataRow[] = sourceRows): number[] {
    const sourceIndices = new Map(sourceRows.map((row, index) => [row, index] as const));
    return currentRows.reduce<number[]>((indices, row) => {
        const matches = field ? matchesFilter(row[field], operator, value) : operator === "contains" && Object.values(row).some(item => matchesFilter(item, "contains", value));
        const sourceIndex = matches ? sourceIndices.get(row) : undefined;
        if (sourceIndex !== undefined) indices.push(sourceIndex);
        return indices;
    }, []);
}
