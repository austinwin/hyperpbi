import powerbi from "powerbi-visuals-api";
import { buildFieldDictionary } from "./fieldDictionary";
import { DataRow, NormalizedField, Primitive } from "./normalizeData";

export interface NormalizedDashboardData { fields: Record<string, NormalizedField>; rows: DataRow[]; rowKeys: string[]; schemaFromField?: string; }

function normalizeValue(value: powerbi.PrimitiveValue): Primitive {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    return String(value);
}

function serializedValue(value: Primitive): unknown {
    return value instanceof Date ? value.toISOString() : value;
}

function fallbackRowKeys(
    rows: DataRow[],
    fields: Record<string, NormalizedField>
): string[] {
    const identityFields = Object.values(fields)
        .filter(field =>
            field.type !== "measure" &&
            field.type !== "schema"
        )
        .map(field => field.key);

    const keys = identityFields.length
        ? identityFields
        : Object.keys(fields);

    const occurrenceByValue = new Map<string, number>();

    return rows.map(row => {
        const base = JSON.stringify(
            keys.map(key => [key, serializedValue(row[key])])
        );

        const occurrence = occurrenceByValue.get(base) ?? 0;
        occurrenceByValue.set(base, occurrence + 1);

        return `fallback:${base}:${occurrence}`;
    });
}

export function normalizeDashboardData(dataView?: powerbi.DataView): NormalizedDashboardData {
    const table = dataView?.table;
    if (table?.columns?.length) {
        const dictionary = buildFieldDictionary(table.columns);
        const rows: DataRow[] = (table.rows ?? []).map(values => Object.fromEntries(dictionary.keys.map((key, index) => [key, normalizeValue(values[index])]))) as DataRow[];
        const schemaKey = dictionary.keys.find(key => dictionary.fields[key].type === "schema");
        return { fields: dictionary.fields, rows, rowKeys: fallbackRowKeys(rows, dictionary.fields), schemaFromField: schemaKey ? String(rows.find(row => row[schemaKey])?.[schemaKey] ?? "") : undefined };
    }
    const categorical = dataView?.categorical;
    const columns = [...(categorical?.categories ?? []).map(item => item.source), ...(categorical?.values ? Array.from(categorical.values).map(item => item.source) : [])];
    const dictionary = buildFieldDictionary(columns);
    const valueColumns = [...(categorical?.categories ?? []).map(item => item.values), ...(categorical?.values ? Array.from(categorical.values).map(item => item.values) : [])];
    const rowCount = Math.max(0, ...valueColumns.map(values => values.length));
    const rows = Array.from({ length: rowCount }, (_, rowIndex) => Object.fromEntries(dictionary.keys.map((key, columnIndex) => [key, normalizeValue(valueColumns[columnIndex]?.[rowIndex])]))) as DataRow[];
    return { fields: dictionary.fields, rows, rowKeys: fallbackRowKeys(rows, dictionary.fields) };
}
