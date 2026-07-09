import { componentDefinitions, getComponentDefinition } from "./componentDefinitions";

export type ComponentCategory = "Layout" | "Controls" | "Navigation" | "Display" | "Charts" | "Tables" | "Maps" | "Custom components" | "Advanced components" | "Primitives" | "Forms" | "Feedback";

export interface ComponentCapability {
    fields: boolean;
    calculations: boolean;
    css: boolean;
    slots: boolean;
    interactions: boolean;
    externalSelection: boolean;
    customHtml: boolean;
}

export interface ComponentMetadata {
    type: string;
    label: string;
    category: ComponentCategory;
    useWhen: string;
    level: "recommended" | "standard" | "advanced";
    capability: ComponentCapability;
    interaction: { defaultEnabled: boolean; naturalTrigger: "click" | "change"; autoExternalMode: "filter" | "selection" };
}

// Derive component metadata from the centralized definitions catalog
export const componentCatalog: ComponentMetadata[] = componentDefinitions.map(d => ({
    type: d.type,
    label: d.label,
    category: d.category as ComponentCategory,
    useWhen: d.useWhen,
    level: d.level,
    capability: d.capabilities,
    interaction: d.interaction,
}));

export const componentTypeNames = componentCatalog.map(component => component.type);
export const componentCategories: ComponentCategory[] = ["Layout", "Controls", "Navigation", "Display", "Charts", "Tables", "Maps", "Custom components", "Advanced components", "Primitives", "Forms", "Feedback"];
export const componentsByCategory = (category: ComponentCategory): ComponentMetadata[] => componentCatalog.filter(component => component.category === category);
export const componentPromptReference = (): string => componentCategories.map(category => `${category}: ${componentsByCategory(category).map(component => `${component.type} (${component.useWhen})`).join("; ")}`).join("\n");
