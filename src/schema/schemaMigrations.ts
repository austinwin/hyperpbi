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

            // ── New migrations ─────────────────────────────────────────

            // Legacy accordion with children but no items → wrap into one item
            if (component.type === "accordion" && Array.isArray(component.children) && !Array.isArray(component.items)) {
                const childArr = component.children as unknown[];
                if (childArr.length > 0) {
                    component.items = [{
                        id: `${component.id ?? "accordion"}_item`,
                        title: (component.title as string) ?? "Section",
                        children: migrateComponents(component.children),
                    }];
                }
                delete component.children;
            }

            // Legacy drawer → keep type but normalize for offcanvas compatibility
            if (component.type === "drawer" || component.type === "filterDrawer") {
                // Preserves original type; offcanvas behavior handled by renderer
                if (Array.isArray(component.children)) {
                    component.children = migrateComponents(component.children);
                }
            }

            // Legacy stepper with children → normalize to steps where possible
            if (component.type === "stepper") {
                if (Array.isArray(component.children) && component.children.length > 0) {
                    // Keep stepper as-is (rendered through Collapsible for backward compat)
                    component.children = migrateComponents(component.children);
                }
            }

            // Legacy button action → uiAction
            if ((component.type === "button" || component.type === "buttonGroup") && typeof component.action === "string" && !component.uiAction) {
                const action = component.action as string;
                const actionValue = component.actionValue as string | undefined;
                if (action === "clearFilters") {
                    component.uiAction = { type: "clearFilters" };
                } else if (action === "setTab") {
                    component.uiAction = { type: "setTab", target: "mainTabs", value: actionValue ?? "" };
                }
                // Keep legacy action/actionValue for backward compat
            }

            // Table engine: "tabulator" → normalize to native with warning
            if (component.type === "table" && component.engine === "tabulator") {
                component.engine = "native";
                // Warning emitted at render time
            }

            // Migrate card footer, modal children, offcanvas children recursively
            if (Array.isArray(component.footer)) {
                component.footer = migrateComponents(component.footer);
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

