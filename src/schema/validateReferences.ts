import { NormalizedData } from "../data/normalizeData";
import { DashboardComponent, HyperPbiSchema, TableComponent, TabsComponent } from "./hyperpbiSchema";

export function validateReferences(schema: HyperPbiSchema, data: NormalizedData): string[] {
    const errors: string[] = [];
    const ignored: Record<string,string> = {
        externalSelection: "Property externalSelection is not used. Use interactions.onClick.external or Runtime Config interactions instead.",
        selectionTarget: "Property selectionTarget is not used. Use interactions.onClick with a supported safe action instead.",
        crossFilter: "Property crossFilter is not used in dashboard JSON. Use interactions.onClick.external or Runtime Config interactions instead.",
        powerBISelection: "Property powerBISelection is not used. Use interactions.onClick.external or Runtime Config interactions instead."
    };
    const check = (field: string | undefined, owner: string) => { if (field && !data.fields[field]) errors.push(`${owner} references missing field “${field}”.`); };
    const checkExpression = (value: unknown, owner: string): void => {
        if (!value || typeof value !== "object") return; const node=value as Record<string,unknown>;
        if(typeof node.field==="string")check(node.field,owner);if(typeof node.valueFromRow==="string")check(node.valueFromRow,owner);
        Object.values(node).forEach(child=>{if(child&&typeof child==="object")Array.isArray(child)?child.forEach(item=>checkExpression(item,owner)):checkExpression(child,owner);});
    };
    const visit = (component: DashboardComponent) => {
        const owner = component.id ?? component.title ?? component.type;
        if ("field" in component) check(component.field, owner);
        if ("category" in component) { check(component.category, owner); check(component.measure, owner); check(component.x, owner); check(component.y, owner); }
        if (component.type === "table") (component as TableComponent).columns?.forEach(column => check(typeof column === "string" ? column : column.field, owner));
        if(component.type==="custom"&&"repeat" in component){check(component.repeat?.distinctBy,owner);check(component.repeat?.sortBy,owner);}
        Object.values(component.interactions??{}).forEach(interaction=>checkExpression(interaction.where,owner));
        if ("children" in component) component.children?.forEach(visit);
        if (component.type === "tabs") (component as TabsComponent).tabs.forEach(tab => (tab.children ?? tab.components ?? tab.content ?? []).forEach(visit));
    };
    const scanIgnored=(value:unknown):void=>{if(!value||typeof value!=="object")return;if(Array.isArray(value)){value.forEach(scanIgnored);return;}for(const [key,child] of Object.entries(value as Record<string,unknown>)){if(ignored[key])errors.push(ignored[key]);scanIgnored(child);}};
    schema.leftPanel?.forEach(visit); schema.rightPanel?.forEach(visit); schema.toolbar?.forEach(visit); schema.components.forEach(visit);
    scanIgnored(schema);
    return Array.from(new Set(errors));
}
