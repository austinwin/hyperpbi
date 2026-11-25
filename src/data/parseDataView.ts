import type powerbi from "powerbi-visuals-api";
import { lazyAggregates } from "./aggregations";
import { normalizeDashboardData, type NormalizedDashboardData } from "./normalizeDashboardData";
import { lazyMapBindings } from "./normalizeMapBindings";
import type { NormalizedData } from "./normalizeData";

export function finalizeDashboardData(dashboard: NormalizedDashboardData): NormalizedData {
    return {
        ...dashboard,
        aggregates: lazyAggregates(dashboard.rows),
        map: lazyMapBindings(dashboard.rows, dashboard.fields, undefined, undefined, dashboard.rowKeys)
    };
}

export function parseDataView(dataView?: powerbi.DataView): NormalizedData {
    return finalizeDashboardData(normalizeDashboardData(dataView));
}
