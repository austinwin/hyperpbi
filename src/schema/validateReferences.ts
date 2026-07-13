import { resolveDatasetSchemas } from "../data/datasetSchema";
import { NormalizedData, NormalizedField } from "../data/normalizeData";
import { externalFilterTargetFor } from "../powerbi/externalFilters";
import { closestMatches } from "./diagnostics";
import { DashboardComponent, HyperPbiSchema, TableComponent, TabsComponent } from "./hyperpbiSchema";
import { specificationFieldReferences } from "../fields/specificationFieldReferences";

interface FieldScope { name: string; fields: Record<string, NormalizedField>; rows: NormalizedData["rows"]; }

export function validateReferences(schema: HyperPbiSchema, data: NormalizedData): string[] {
    const errors: string[] = [];
    const schemas = resolveDatasetSchemas(data, schema.data?.datasets ?? {});
    errors.push(...schemas.diagnostics.map(item => item.message));
    const baseScope: FieldScope = { name: "powerbi", fields: data.fields, rows: data.rows };
    for(const occurrence of specificationFieldReferences(schema)){const scope=schemas.datasets.get(occurrence.datasetName)??schemas.datasets.get("powerbi");const field=scope?.fields[occurrence.reference];if(!field)errors.push(`${occurrence.path} references missing field “${occurrence.reference}” in dataset “${occurrence.datasetName}”.`);else if(occurrence.requirement==="numeric"&&field.dataType&&field.dataType!=="unknown"&&field.dataType!=="number")errors.push(`${occurrence.path} requires numeric field “${occurrence.reference}” in dataset “${occurrence.datasetName}”, but it is ${field.dataType}.`);}
    const ignored: Record<string,string> = {
        externalSelection: "Property externalSelection is not used. Use component.interaction.externalMode instead.",
        selectionTarget: "Property selectionTarget is not used. Use component.interaction.field instead.",
        crossFilter: "Property crossFilter is not used in dashboard JSON. Use component.interaction and the Runtime Config global gate.",
        powerBISelection: "Property powerBISelection is not used. Use component.interaction.externalMode instead."
    };
    const scopeFor = (dataset: string | undefined, inherited: FieldScope): FieldScope => {
        if (!dataset) return inherited;
        const resolved = schemas.datasets.get(dataset);
        if (!resolved) return { name: dataset, fields: {}, rows: [] };
        return { name: dataset, fields: resolved.fields, rows: [] };
    };
    const check = (field: string | undefined, owner: string, scope: FieldScope) => {
        if (!field || scope.fields[field]) return;
        const suggestions = closestMatches(field, Object.keys(scope.fields));
        errors.push(`${owner} references missing field “${field}” in dataset “${scope.name}”.${suggestions.length ? ` Did you mean “${suggestions[0]}”?` : ""}`);
    };
    const checkNumeric = (field: string | undefined, owner: string, scope: FieldScope) => {
        check(field, owner, scope); if (!field) return;
        const metadata = scope.fields[field]; if (!metadata) return;
        if (metadata.dataType && metadata.dataType !== "unknown" && metadata.dataType !== "number") { errors.push(`${owner} requires numeric field “${field}” in dataset “${scope.name}”, but it is ${metadata.dataType}.`); return; }
        if (!metadata.dataType || metadata.dataType === "unknown") { const values=scope.rows.map(row=>row[field]).filter(value=>value!==null&&value!==undefined);if(values.length&&!values.some(value=>typeof value==="number"&&Number.isFinite(value)))errors.push(`${owner} requires numeric field “${field}” in dataset “${scope.name}”.`); }
    };
    const checkExpression = (value: unknown, owner: string, scope: FieldScope): void => {
        if (!value || typeof value !== "object") return; const node=value as Record<string,unknown>;
        if(typeof node.field==="string")check(node.field,owner,scope);if(typeof node.valueFromRow==="string")check(node.valueFromRow,owner,scope);
        Object.values(node).forEach(child=>{if(child&&typeof child==="object")Array.isArray(child)?child.forEach(item=>checkExpression(item,owner,scope)):checkExpression(child,owner,scope);});
    };
    const checkMap = (component: DashboardComponent, owner: string, scope: FieldScope): void => {
        if (component.type !== "map") return;
        const layers = (component as import("./hyperpbiSchema").MapComponent).layers ?? [];
        for (const layer of layers) {
            const source = layer.source;
            if (source.type === "powerbi") {
                const bindings = source.bindings;
                if (bindings) {
                    for (const [key, value] of Object.entries(bindings)) Array.isArray(value) ? value.forEach(field => check(field, `${owner} map ${key}`, scope)) : check(value, `${owner} map ${key}`, scope);
                }
            }
            if (layer.join?.powerBiField) check(layer.join.powerBiField, `${owner} map join`, scope);
        }
    };
    const visit = (component: DashboardComponent, inheritedScope: FieldScope = baseScope) => {
        const scope = scopeFor(component.dataset, inheritedScope);
        const owner = component.id ?? component.title ?? component.type;
        check(component.interaction?.field,owner,scope);
        if ("field" in component) check(component.field, owner,scope);
        if ("category" in component) check(component.category, owner,scope);
        if ("measure" in component) checkNumeric(component.measure, owner,scope);
        if ("x" in component) checkNumeric(component.x, owner,scope);
        if ("y" in component) checkNumeric(component.y, owner,scope);
        if (component.type === "scatterChart") { const chart=component as import("./hyperpbiSchema").ScatterChartComponent;checkNumeric(chart.pointSize, owner,scope); }
        if (component.type === "comboChart") { const chart=component as import("./hyperpbiSchema").ComboChartComponent;chart.series.forEach(series=>checkNumeric(series.field,owner,scope)); }
        if (component.type === "sankeyChart") { const chart=component as import("./hyperpbiSchema").SankeyChartComponent;check(chart.sourceField,owner,scope);check(chart.targetField,owner,scope);checkNumeric(chart.valueField,owner,scope); }
        if (component.type === "treemapChart") { const chart=component as import("./hyperpbiSchema").TreemapChartComponent;chart.pathFields.forEach(field=>check(field,owner,scope));checkNumeric(chart.valueField,owner,scope);check(chart.labelField,owner,scope); }
        if (component.type === "radarChart") { const chart=component as import("./hyperpbiSchema").RadarChartComponent;check(chart.groupField,owner,scope);chart.indicators.forEach(indicator=>checkNumeric(indicator.field,owner,scope)); }
        if(component.type==="timeline"){const timeline=component as import("./hyperpbiSchema").TimelineComponent;check(timeline.dateField,owner,scope);check(timeline.titleField,owner,scope);check(timeline.categoryField,owner,scope);check(timeline.statusField,owner,scope);check(timeline.descriptionField,owner,scope);}
        if(component.type==="smallMultiples"){const small=component as import("./hyperpbiSchema").SmallMultiplesComponent;check(small.splitField,owner,scope);visit(small.chart,scope);}
        if(component.type==="matrix"){const matrix=component as import("./hyperpbiSchema").MatrixComponent;matrix.rows.forEach(field=>check(field,owner,scope));matrix.columns?.forEach(field=>check(field,owner,scope));matrix.values.forEach(value=>["count","distinctCount"].includes(value.aggregation??"")?check(value.field,owner,scope):checkNumeric(value.field,owner,scope));}
        if(component.type==="detailPanel"&&"groups" in component)component.groups?.forEach(group=>group.fields.forEach(item=>check(typeof item==="string"?item:item.field,owner,scope)));
        if ("metrics" in component) component.metrics?.forEach(metric => { ["count","distinctCount","first"].includes(metric.aggregation??"")?check(metric.field,owner,scope):checkNumeric(metric.field, owner, scope); if (metric.where?.field) check(metric.where.field, owner, scope); });
        if ("items" in component) component.items?.forEach(item => { if ("field" in item) check(item.field, owner, scope); });
        if (component.type === "table") (component as TableComponent).columns?.forEach(column => check(typeof column === "string" ? column : column.field, owner,scope));
        if(component.type==="custom"&&"repeat" in component){check(component.repeat?.distinctBy,owner,scope);check(component.repeat?.sortBy,owner,scope);}
        if(component.type==="svg"){const svg=component as import("./hyperpbiSchema").SvgComponent;const scan=(value:unknown):void=>{if(!value||typeof value!=="object")return;if(Array.isArray(value)){value.forEach(scan);return;}const node=value as Record<string,unknown>;if(typeof node.bind==="string"&&!node.bind.startsWith("$"))check(node.bind,owner,scope);if(node.when&&typeof node.when==="object"&&typeof (node.when as Record<string,unknown>).field==="string")check(String((node.when as Record<string,unknown>).field),owner,scope);Object.values(node).forEach(scan);};scan(svg.elements);}
        checkMap(component, owner, scope);
        Object.values(component.interactions??{}).forEach(interaction=>{check(interaction.field,owner,scope);checkExpression(interaction.where,owner,scope);});
        const displayTypes=new Set(["kpi","metricGrid","infoCard","statusBadge","progressBar","alert","statList","detailPanel","gauge"]);const interaction=component.interaction;
        if(interaction?.enabled&&displayTypes.has(component.type)){const display=component as import("./hyperpbiSchema").DataDisplayComponent;const metricField=display.metrics?.[0]?.field;const itemField=display.items?.[0]?.field;const groupEntry=display.groups?.[0]?.fields?.[0];const groupField=typeof groupEntry==="string"?groupEntry:groupEntry?.field;const usable=interaction.field||interaction.value!==undefined||display.field||metricField||itemField||groupField||component.type==="gauge"&&"measure" in component&&component.measure;if(!usable)errors.push(`${owner} enables interaction but has no usable field, value, or row payload.`);}
        if(interaction?.enabled&&interaction.externalMode==="filter") {
            if(["table","matrix","map","scatterChart","advancedChart"].includes(component.type)&&!interaction.field)errors.push(`${owner} uses external filter mode and requires an explicit interaction.field.`);
            if (interaction.field && scope.fields[interaction.field] && !externalFilterTargetFor(scope.fields[interaction.field])) {
                const field = scope.fields[interaction.field]; const description = field.origin === "calculated-field" ? "root calculated field" : field.origin === "dataset-metric" ? "dataset metric" : field.origin === "dataset-derived" ? "derived dataset field" : field.kind === "measure" ? "Power BI measure" : "generated field";
                errors.push(`${owner} uses external filter mode with ${description} “${interaction.field}” in dataset “${scope.name}”, which has no Power BI model-column target. Use selection/highlight or filter through a group-by source field.`);
            }
        }
        if ("children" in component) component.children?.forEach(child=>visit(child,scope));
        if (component.type === "tabs") (component as TabsComponent).tabs.forEach(tab => (tab.children ?? tab.components ?? tab.content ?? []).forEach(child=>visit(child,scope)));
    };
    const scanIgnored=(value:unknown):void=>{if(!value||typeof value!=="object")return;if(Array.isArray(value)){value.forEach(scanIgnored);return;}for(const [key,child] of Object.entries(value as Record<string,unknown>)){if(ignored[key])errors.push(ignored[key]);scanIgnored(child);}};
    schema.leftPanel?.forEach(component=>visit(component)); schema.rightPanel?.forEach(component=>visit(component)); schema.toolbar?.forEach(component=>visit(component)); schema.components.forEach(component=>visit(component));
    scanIgnored(schema);
    return Array.from(new Set(errors));
}
