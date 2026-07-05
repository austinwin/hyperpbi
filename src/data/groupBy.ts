import { aggregateValue } from "./aggregations";
import { DataRow, Primitive } from "./normalizeData";

export function groupAndAggregate(rows: DataRow[], category: string, measure: string | undefined, aggregation = "sum"): Array<{ key: string; rawKey: Primitive; value: number }> {
    const groups = new Map<string, { rawKey: Primitive; rows: DataRow[] }>();
    for (const row of rows) {
        const rawKey = row[category];
        const key = String(rawKey ?? "(Blank)");
        const group = groups.get(key) ?? { rawKey, rows: [] };
        group.rows.push(row);
        groups.set(key, group);
    }
    return Array.from(groups.entries()).map(([key, group]) => ({ key, rawKey: group.rawKey, value: Number(aggregateValue(group.rows, measure, aggregation) ?? 0) }));
}
