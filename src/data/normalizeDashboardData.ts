import type powerbi from "powerbi-visuals-api";
import { readonlyRowFactory } from "./readonlyRowView";
import { buildFieldDictionary } from "./fieldDictionary";
import { DataRow, NormalizedField, Primitive } from "./normalizeData";

export interface NormalizedDashboardData { fields: Record<string, NormalizedField>; rows: DataRow[]; rowKeys: string[]; schemaFromField?: string; }

function normalizeValue(value: powerbi.PrimitiveValue): Primitive {
    if (value == null) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    return String(value);
}

export function dataViewRows(dataView?: powerbi.DataView) {
    const table = dataView?.table;
    if (table?.columns?.length) {
        const rows = table.rows ?? [];
        return { kind: "table", columns: table.columns, count: rows.length, rows, value: (row: number, column: number) => rows[row][column] } as const;
    }
    const categorical = dataView?.categorical;
    const categories = categorical?.categories ?? [];
    const measures = Array.from(categorical?.values ?? []);
    const columns = [...categories, ...measures].map(item => item.source);
    const values = [...categories, ...measures].map(item => item.values);
    return { kind: "categorical", columns, count: values.reduce((count, column) => Math.max(count, column.length), 0), value: (row: number, column: number) => values[column]?.[row] } as const;
}

type FieldDictionary = ReturnType<typeof buildFieldDictionary>;

/** The host's opaque selection identity stays separate from the compact,
 * content-based key used by the dashboard. Duplicate records keep their own
 * ordinal across segments. Measures do not affect a dimension group's key. */
export class DashboardRowKeys {
    private readonly fields: string[];
    private readonly occurrences = new Map<string, number>();

    constructor(dictionary: FieldDictionary) {
        const dimensions = dictionary.keys.filter(key => !["measure", "schema"].includes(dictionary.fields[key].type));
        const available = dictionary.keys.filter(key => dictionary.fields[key].type !== "schema");
        this.fields = dimensions.length ? dimensions : available;
    }

    next(row: DataRow): string {
        const encoded = JSON.stringify(this.fields.map(key => row[key]));
        // Two independently seeded 53-bit fingerprints keep large text and
        // repeated field names out of retained keys. Ordinals never drop rows.
        let a = 0xdeadbeef, b = 0x41c6ce57, c = 0x6a09e667, d = 0xbb67ae85;
        for (let i = 0; i < encoded.length; i++) {
            const value = encoded.charCodeAt(i);
            a = Math.imul(a ^ value, 2654435761);
            b = Math.imul(b ^ value, 1597334677);
            c = Math.imul(c ^ value, 2246822507);
            d = Math.imul(d ^ value, 3266489909);
        }
        const base = [a ^ (b >>> 13), b ^ (a >>> 16), c ^ (d >>> 15), d ^ (c >>> 12)].map(value => (value >>> 0).toString(36)).join(".");
        const occurrence = this.occurrences.get(base) ?? 0;
        this.occurrences.set(base, occurrence + 1);
        return `${base}:${occurrence}`;
    }
}

export function appendDashboardRows(
    input: ReturnType<typeof dataViewRows>,
    dictionary: FieldDictionary,
    keys: DashboardRowKeys,
    output: NormalizedDashboardData,
    offset: number,
    useHostRows = false,
): void {
    const fields = dictionary.keys;
    const template = Object.fromEntries(fields.map(key => [key, null]));
    const schemaKey = fields.find(key => dictionary.fields[key].type === "schema");
    const packed = useHostRows && input.kind === "table" && fields.length >= 20
        ? readonlyRowFactory(fields, (values: powerbi.DataViewTableRow, _field, column) => normalizeValue(values[column]))
        : undefined;
    for (let index = offset; index < input.count; index++) {
        let row: DataRow;
        if (packed && input.kind === "table") {
            row = packed(input.rows[index]);
        } else {
            row = { ...template };
            for (let column = 0; column < fields.length; column++) row[fields[column]] = normalizeValue(input.value(index, column));
        }
        output.rows.push(row);
        output.rowKeys.push(keys.next(row));
        if (schemaKey && !output.schemaFromField && row[schemaKey]) output.schemaFromField = String(row[schemaKey]);
    }
}

export function normalizeDashboardData(dataView?: powerbi.DataView): NormalizedDashboardData {
    const input = dataViewRows(dataView);
    const dictionary = buildFieldDictionary(input.columns);
    const data: NormalizedDashboardData = { fields: dictionary.fields, rows: [], rowKeys: [] };
    appendDashboardRows(input, dictionary, new DashboardRowKeys(dictionary), data, 0);
    return data;
}
