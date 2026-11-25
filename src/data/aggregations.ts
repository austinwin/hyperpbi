import { Aggregates, DataRow, Primitive } from "./normalizeData";

const distinctKey = (value: Primitive): string =>
    value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString() : String(value);

interface NumericSummary { count: number; sum: number; min: number; max: number }

function summarizeNumbers(rows: readonly DataRow[], field: string): NumericSummary {
    let count = 0, sum = 0, min = Infinity, max = -Infinity;
    for (const row of rows) {
        const value = row[field];
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        count++;
        sum += value;
        min = Math.min(min, value);
        max = Math.max(max, value);
    }
    return { count, sum, min, max };
}

function countDistinct(rows: readonly DataRow[], field: string, key = distinctKey): number {
    const values = new Set<string>();
    for (const row of rows) {
        const value = row[field];
        if (value != null) values.add(key(value));
    }
    return values.size;
}

export function calculateAggregates(rows: DataRow[]): Aggregates {
    const aggregates: Aggregates = { count: rows.length, sum: {}, avg: {}, min: {}, max: {}, distinctCount: {}, first: {} };
    for (const field of Object.keys(rows[0] ?? {})) {
        const summary = summarizeNumbers(rows, field);
        aggregates.first[field] = aggregateValue(rows, field, "first") ?? undefined;
        aggregates.distinctCount[field] = countDistinct(rows, field);
        if (summary.count) {
            aggregates.sum[field] = summary.sum;
            aggregates.avg[field] = summary.sum / summary.count;
            aggregates.min[field] = summary.min;
            aggregates.max[field] = summary.max;
        }
    }
    return aggregates;
}

/** Template aggregates are evaluated per referenced field, so a dashboard that
 * only counts rows never scans every bound field for distinct values. */
export function lazyAggregates(rows: DataRow[]): Aggregates {
    const aggregates: Aggregates = { count: rows.length, sum: {}, avg: {}, min: {}, max: {}, distinctCount: {}, first: {} };
    const numeric = new Map<string, NumericSummary>();
    for (const field of Object.keys(rows[0] ?? {})) {
        for (const operation of ["sum", "avg", "min", "max", "distinctCount", "first"] as const) {
            Object.defineProperty(aggregates[operation], field, {
                enumerable: true,
                configurable: true,
                get() {
                    let value: Primitive;
                    if (operation === "distinctCount") {
                        value = countDistinct(rows, field);
                    } else if (operation === "first") {
                        value = aggregateValue(rows, field, "first") ?? undefined;
                    } else {
                        let summary = numeric.get(field);
                        if (!summary) {
                            summary = summarizeNumbers(rows, field);
                            numeric.set(field, summary);
                        }
                        if (summary.count) value = operation === "avg" ? summary.sum / summary.count : summary[operation];
                    }
                    Object.defineProperty(aggregates[operation], field, { value, enumerable: true, configurable: true });
                    return value;
                }
            });
        }
    }
    return aggregates;
}

export function aggregateValue(rows: readonly DataRow[], field: string | undefined, aggregation = "first", where?: { field: string; equals: unknown }): Primitive {
    if (aggregation === "count") return rows.length;
    if (aggregation === "countWhere" && where) {
        let count = 0;
        for (const row of rows) if (row[where.field] === where.equals) count++;
        return count;
    }
    if (!field) return null;
    if (aggregation === "distinctCount") return countDistinct(rows, field, String);
    if (aggregation === "first") {
        for (const row of rows) if (row[field] != null) return row[field];
        return null;
    }
    if (!["sum", "avg", "min", "max"].includes(aggregation)) {
        for (const row of rows) {
            const value = row[field];
            if (typeof value === "number" && Number.isFinite(value)) return value;
        }
        return null;
    }
    const summary = summarizeNumbers(rows, field);
    return summary.count ? aggregation === "avg" ? summary.sum / summary.count : summary[aggregation as "sum" | "min" | "max"] : null;
}
