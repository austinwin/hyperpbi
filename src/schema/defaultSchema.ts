import { ChartComponent, DashboardComponent, HyperPbiSchema, MapComponent, TableComponent } from "./hyperpbiSchema";
import { NormalizedData } from "../data/normalizeData";

export const defaultSchema: HyperPbiSchema = {
    version: "1.0",
    title: "Operations Dashboard",
    theme: { mode: "light", density: "compact", primaryColor: "#206bc4", accentColor: "#4299e1", surfaceColor: "#ffffff", textColor: "#182433", radius: 8, cardPadding: 12, gap: 8 },
    layout: { type: "grid", columns: 12, gap: 8 },
    state: { search: "", activeTab: "overview", filters: {} },
    toolbar: [{ type: "searchBox", id: "globalSearch", placeholder: "Search records..." }, { type: "button", id: "clear", title: "Clear filters", action: "clearFilters" }],
    components: [
        { type: "metricGrid", id: "summary", span: 12, metrics: [{ title: "Records", aggregation: "count", format: "integer" }] },
        { type: "infoCard", id: "getting-started", title: "HyperPBI is ready", text: "Open Studio to generate an AI prompt, import JSON, validate, and preview your dashboard.", span: 12 }
    ]
};

export const smallWorkingSchema = JSON.stringify(defaultSchema, null, 2);

export function createDefaultSchema(data: NormalizedData): HyperPbiSchema {
    if (!data.rows.length || !Object.keys(data.fields).length) return defaultSchema;
    const measure = Object.values(data.fields).find(field => field.type === "measure");
    const category = Object.values(data.fields).find(field => field.type === "dimension");
    const hasMap = data.map.mode !== "none";
    const components: DashboardComponent[] = [{ type: "metricGrid", id: "summary", span: 12, metrics: [{ title: "Records", aggregation: "count", format: "integer", intent: "primary" }, ...(measure ? [{ title: `Total ${measure.displayName}`, field: measure.key, aggregation: "sum" as const, format: measure.format }] : [])] }];
    if (measure && category) components.push({ type: "barChart", id: "overview-chart", title: `${measure.displayName} by ${category.displayName}`, category: category.key, measure: measure.key, aggregation: "sum", span: hasMap ? 7 : 12 } as ChartComponent);
    if (hasMap) components.push({ type: "map", id: "overview-map", title: "Locations", settings: { fitBounds: true, showLayerControl: true, showLegend: true, basemap: "none", enableExternalTiles: false, coordinateSystem: "EPSG:4326" }, span: measure && category ? 5 : 12 } as MapComponent);
    components.push({ type: "table", id: "details", title: "Record Details", columns: Object.keys(data.fields).filter(key => data.fields[key].type !== "schema").slice(0, 12), pagination: true, search: true, interaction:{enabled:true,trigger:"auto",internalMode:"highlight",internalScope:"self",externalMode:"auto",selectionMode:"replace",multiSelect:true,showSelector:true,clearOnSecondClick:true}, span: 12 } as TableComponent);
    return {
        ...defaultSchema,
        toolbar: [{ type: "searchBox", id: "globalSearch", placeholder: "Search all records..." }, { type: "filterChips", id: "activeFilters" }, { type: "button", id: "clear", title: "Clear filters", action: "clearFilters" }],
        components
    };
}
