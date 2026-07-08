import { NormalizedData } from "../data/normalizeData";
import { DashboardComponent, HyperPbiSchema, TableComponent, TabsComponent } from "./hyperpbiSchema";

export function validateReferences(schema: HyperPbiSchema, data: NormalizedData): string[] {
    const errors: string[] = [];
    const ignored: Record<string,string> = {
        externalSelection: "Property externalSelection is not used. Use component.interaction.externalMode instead.",
        selectionTarget: "Property selectionTarget is not used. Use component.interaction.field instead.",
        crossFilter: "Property crossFilter is not used in dashboard JSON. Use component.interaction and the Runtime Config global gate.",
        powerBISelection: "Property powerBISelection is not used. Use component.interaction.externalMode instead."
    };
    const check = (field: string | undefined, owner: string) => { if (field && !data.fields[field]) errors.push(`${owner} references missing field “${field}”.`); };
    const checkExpression = (value: unknown, owner: string): void => {
        if (!value || typeof value !== "object") return; const node=value as Record<string,unknown>;
        if(typeof node.field==="string")check(node.field,owner);if(typeof node.valueFromRow==="string")check(node.valueFromRow,owner);
        Object.values(node).forEach(child=>{if(child&&typeof child==="object")Array.isArray(child)?child.forEach(item=>checkExpression(item,owner)):checkExpression(child,owner);});
    };
    const visit = (component: DashboardComponent) => {
        const owner = component.id ?? component.title ?? component.type;
        check(component.interaction?.field,owner);
        if ("field" in component) check(component.field, owner);
        if ("category" in component) { check(component.category, owner); check(component.measure, owner); check(component.x, owner); check(component.y, owner); }
        if(component.type==="timeline"){const timeline=component as import("./hyperpbiSchema").TimelineComponent;check(timeline.dateField,owner);check(timeline.titleField,owner);check(timeline.categoryField,owner);check(timeline.statusField,owner);check(timeline.descriptionField,owner);}
        if(component.type==="smallMultiples"){const small=component as import("./hyperpbiSchema").SmallMultiplesComponent;check(small.splitField,owner);visit(small.chart);}
        if(component.type==="matrix"){const matrix=component as import("./hyperpbiSchema").MatrixComponent;matrix.rows.forEach(field=>check(field,owner));matrix.columns?.forEach(field=>check(field,owner));matrix.values.forEach(value=>check(value.field,owner));}
        if(component.type==="detailPanel"&&"groups" in component)component.groups?.forEach(group=>group.fields.forEach(item=>check(typeof item==="string"?item:item.field,owner)));
        if (component.type === "table") (component as TableComponent).columns?.forEach(column => check(typeof column === "string" ? column : column.field, owner));
        if(component.type==="custom"&&"repeat" in component){check(component.repeat?.distinctBy,owner);check(component.repeat?.sortBy,owner);}
        Object.values(component.interactions??{}).forEach(interaction=>checkExpression(interaction.where,owner));
        const displayTypes=new Set(["kpi","metricGrid","infoCard","statusBadge","progressBar","alert","statList","detailPanel","gauge"]);const interaction=component.interaction;
        if(interaction?.enabled&&displayTypes.has(component.type)){const display=component as import("./hyperpbiSchema").DataDisplayComponent;const metricField=display.metrics?.[0]?.field;const itemField=display.items?.[0]?.field;const groupEntry=display.groups?.[0]?.fields?.[0];const groupField=typeof groupEntry==="string"?groupEntry:groupEntry?.field;const usable=interaction.field||interaction.value!==undefined||display.field||metricField||itemField||groupField||component.type==="gauge"&&"measure" in component&&component.measure;if(!usable)errors.push(`${owner} enables interaction but has no usable field, value, or row payload.`);}
        if(interaction?.enabled&&interaction.externalMode==="filter"&&["table","matrix","map","scatterChart","advancedChart"].includes(component.type)&&!interaction.field)errors.push(`${owner} uses external filter mode and requires an explicit interaction.field.`);
        if ("children" in component) component.children?.forEach(visit);
        if (component.type === "tabs") (component as TabsComponent).tabs.forEach(tab => (tab.children ?? tab.components ?? tab.content ?? []).forEach(visit));
    };
    const scanIgnored=(value:unknown):void=>{if(!value||typeof value!=="object")return;if(Array.isArray(value)){value.forEach(scanIgnored);return;}for(const [key,child] of Object.entries(value as Record<string,unknown>)){if(ignored[key])errors.push(ignored[key]);scanIgnored(child);}};
    schema.leftPanel?.forEach(visit); schema.rightPanel?.forEach(visit); schema.toolbar?.forEach(visit); schema.components.forEach(visit);
    scanIgnored(schema);
    return Array.from(new Set(errors));
}
