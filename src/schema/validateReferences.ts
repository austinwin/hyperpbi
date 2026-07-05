import { NormalizedData } from "../data/normalizeData";
import { DashboardComponent, HyperPbiSchema, TableComponent, TabsComponent } from "./hyperpbiSchema";

export function validateReferences(schema: HyperPbiSchema, data: NormalizedData): string[] {
    const errors: string[] = [];
    const check = (field: string | undefined, owner: string) => { if (field && !data.fields[field]) errors.push(`${owner} references missing field “${field}”.`); };
    const visit = (component: DashboardComponent) => {
        const owner = component.id ?? component.title ?? component.type;
        if ("field" in component) check(component.field, owner);
        if ("category" in component) { check(component.category, owner); check(component.measure, owner); check(component.x, owner); check(component.y, owner); }
        if (component.type === "table") (component as TableComponent).columns?.forEach(column => check(typeof column === "string" ? column : column.field, owner));
        if ("children" in component) component.children?.forEach(visit);
        if (component.type === "tabs") (component as TabsComponent).tabs.forEach(tab => (tab.children ?? tab.components ?? tab.content ?? []).forEach(visit));
    };
    schema.leftPanel?.forEach(visit); schema.rightPanel?.forEach(visit); schema.toolbar?.forEach(visit); schema.components.forEach(visit);
    return Array.from(new Set(errors));
}
