export function formatValue(value: unknown, format?: string): string {
    if (value === null || value === undefined || value === "") return "—";
    if (value instanceof Date) return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(value);
    if (typeof value !== "number") return String(value);
    if (format === "currency") return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
    if (format === "percent") return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(value);
    if (format === "integer") return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}
