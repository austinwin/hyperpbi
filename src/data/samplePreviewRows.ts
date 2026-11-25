import type { NormalizedData, Primitive } from "./normalizeData";

export function samplePreviewValue(value: Primitive): Primitive {
    return typeof value === "string" && value.length > 500 ? `${value.slice(0, 500)}…` : value;
}

export function samplePreviewRows(data: NormalizedData, count: number) {
    return data.rows.slice(0, Math.min(50, Math.max(0, count))).map(row =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [key, samplePreviewValue(value)]))
    );
}
