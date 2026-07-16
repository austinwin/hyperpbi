import { DataRow } from "./normalizeData";

const naturalCollator = new Intl.Collator(undefined, { numeric: true });

export function compareSortValues(left: unknown, right: unknown): number {
    return naturalCollator.compare(String(left ?? ""), String(right ?? ""));
}

export function sortRows(rows: DataRow[], field: string, direction: "asc" | "desc"): DataRow[] {
    const factor = direction === "asc" ? 1 : -1;
    return rows
        .map((row, index) => ({ row, index, value: row[field] }))
        .sort((left, right) => compareSortValues(left.value, right.value) * factor || left.index - right.index)
        .map(item => item.row);
}
