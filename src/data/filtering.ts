import { FilterOperator } from "../schema/hyperpbiSchema";
import { DataRow, Primitive } from "./normalizeData";

export interface ActiveFilter { id: string; field: string; operator: FilterOperator; value: unknown; }

function compare(actual: Primitive, operator: FilterOperator, expected: unknown): boolean {
    if (operator === "=") return actual === expected;
    if (operator === "!=") return actual !== expected;
    if (operator === "contains") return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    if (operator === "in") return Array.isArray(expected) && expected.some(value => value === actual);
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
    return rows.filter(row => filters.every(filter => compare(row[filter.field], filter.operator, filter.value)) && (!needle || Object.values(row).some(value => String(value ?? "").toLowerCase().includes(needle))));
}
