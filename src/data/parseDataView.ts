import powerbi from "powerbi-visuals-api";
import { calculateAggregates } from "./aggregations";
import { normalizeDashboardData } from "./normalizeDashboardData";
import { normalizeMapBindings } from "./normalizeMapBindings";
import { NormalizedData } from "./normalizeData";

export function parseDataView(dataView?: powerbi.DataView): NormalizedData {
    const dashboard = normalizeDashboardData(dataView);
    return { ...dashboard, aggregates: calculateAggregates(dashboard.rows), map: normalizeMapBindings(dashboard.rows, dashboard.fields) };
}

export function mergeNormalizedData(current: NormalizedData, incoming: NormalizedData): NormalizedData {
    const rows = [...current.rows, ...incoming.rows]; const fields = { ...current.fields, ...incoming.fields };
    return { ...incoming, fields, rows, schemaFromField: incoming.schemaFromField ?? current.schemaFromField, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };
}
