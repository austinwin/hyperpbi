import { HyperPbiSchema } from "./hyperpbiSchema";

export function migrateSchema(value: unknown): unknown {
    if (!value || typeof value !== "object") return value;
    const candidate = { ...(value as Record<string, unknown>) };
    if (!candidate.version) candidate.version = "1.0";
    const migrateComponents = (input: unknown): unknown => {
        if (!Array.isArray(input)) return input;
        return input.map(item => {
            if (!item || typeof item !== "object") return item;
            const component = { ...(item as Record<string, unknown>) };
            if (Array.isArray(component.children)) component.children = migrateComponents(component.children);
            if (component.type === "tabs" && Array.isArray(component.tabs)) {
                component.tabs = component.tabs.map(tabValue => {
                    if (!tabValue || typeof tabValue !== "object") return tabValue;
                    const tab = { ...(tabValue as Record<string, unknown>) };
                    const children = tab.children ?? tab.components ?? tab.content ?? [];
                    tab.children = migrateComponents(children);
                    delete tab.components; delete tab.content;
                    return tab;
                });
            }
            return component;
        });
    };
    candidate.components = migrateComponents(candidate.components);
    candidate.toolbar = migrateComponents(candidate.toolbar);
    candidate.leftPanel = migrateComponents(candidate.leftPanel);
    candidate.rightPanel = migrateComponents(candidate.rightPanel);
    return candidate as unknown as HyperPbiSchema;
}
