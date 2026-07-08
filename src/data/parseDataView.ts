import powerbi from "powerbi-visuals-api";
import { calculateAggregates } from "./aggregations";
import { normalizeDashboardData } from "./normalizeDashboardData";
import { normalizeMapBindings } from "./normalizeMapBindings";
import { NormalizedData } from "./normalizeData";

export function parseDataView(dataView?: powerbi.DataView): NormalizedData {
    const dashboard = normalizeDashboardData(dataView);
    return { ...dashboard, aggregates: calculateAggregates(dashboard.rows), map: normalizeMapBindings(dashboard.rows, dashboard.fields, undefined, undefined, dashboard.rowKeys) };
}

export function mergeNormalizedData(current: NormalizedData, incoming: NormalizedData): NormalizedData {
    const rows = [...current.rows];
    const rowKeys = [...current.rowKeys];
    const known = new Set(rowKeys);

    incoming.rowKeys.forEach((rowKey, index) => {
        if (known.has(rowKey)) return;

        const row = incoming.rows[index];
        if (!row) return;

        known.add(rowKey);
        rowKeys.push(rowKey);
        rows.push(row);
    });

    const fields = {
        ...current.fields,
        ...incoming.fields
    };

    return {
        ...incoming,
        fields,
        rows,
        rowKeys,
        schemaFromField:
            incoming.schemaFromField ??
            current.schemaFromField,
        aggregates: calculateAggregates(rows),
        map: normalizeMapBindings(
            rows,
            fields,
            undefined,
            undefined,
            rowKeys
        )
    };
}
