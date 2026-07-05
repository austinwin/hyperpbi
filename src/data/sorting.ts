import { DataRow } from "./normalizeData";

export function sortRows(rows: DataRow[], field: string, direction: "asc" | "desc"): DataRow[] {
    const factor = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => String(a[field] ?? "").localeCompare(String(b[field] ?? ""), undefined, { numeric: true }) * factor);
}
