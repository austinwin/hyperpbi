import powerbi from "powerbi-visuals-api";
import { calculateAggregates } from "./aggregations";
import { normalizeDashboardData } from "./normalizeDashboardData";
import { normalizeMapBindings } from "./normalizeMapBindings";
import { NormalizedData } from "./normalizeData";

export function parseDataView(dataView?: powerbi.DataView): NormalizedData {
    const dashboard = normalizeDashboardData(dataView);
    return { ...dashboard, aggregates: calculateAggregates(dashboard.rows), map: normalizeMapBindings(dashboard.rows, dashboard.fields) };
}
