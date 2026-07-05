import { Aggregates, DataRow, Primitive } from "./normalizeData";

export function calculateAggregates(rows: DataRow[]): Aggregates {
    const aggregates: Aggregates = { count: rows.length, sum: {}, avg: {}, min: {}, max: {}, distinctCount: {}, first: {} };
    if (!rows.length) return aggregates;
    const keys = Object.keys(rows[0]);
    for (const key of keys) {
        const values = rows.map(row => row[key]).filter(value => value !== null && value !== undefined);
        aggregates.first[key] = values[0] as Primitive;
        aggregates.distinctCount[key] = new Set(values.map(value => value instanceof Date ? value.toISOString() : String(value))).size;
        const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
        if (numbers.length) {
            aggregates.sum[key] = numbers.reduce((total, value) => total + value, 0);
            aggregates.avg[key] = aggregates.sum[key] / numbers.length;
            aggregates.min[key] = Math.min(...numbers);
            aggregates.max[key] = Math.max(...numbers);
        }
    }
    return aggregates;
}

export function aggregateValue(rows: DataRow[], field: string | undefined, aggregation = "first", where?: { field: string; equals: unknown }): Primitive {
    if (aggregation === "count") return rows.length;
    if (aggregation === "countWhere" && where) return rows.filter(row => row[where.field] === where.equals).length;
    if (!field) return null;
    const values = rows.map(row => row[field]).filter(value => value !== null && value !== undefined);
    if (aggregation === "distinctCount") return new Set(values.map(String)).size;
    if (aggregation === "first") return values[0] ?? null;
    const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (!numbers.length) return null;
    if (aggregation === "sum") return numbers.reduce((a, b) => a + b, 0);
    if (aggregation === "avg") return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    if (aggregation === "min") return Math.min(...numbers);
    if (aggregation === "max") return Math.max(...numbers);
    return numbers[0];
}
