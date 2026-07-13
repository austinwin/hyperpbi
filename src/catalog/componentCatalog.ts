import { componentDescriptors } from "./componentDescriptors";
import type { ComponentCapability, ComponentCategory, ComponentComplexity, ComponentMaturity } from "./componentTypes";
export type { ComponentCapability, ComponentCategory, ComponentComplexity, ComponentMaturity } from "./componentTypes";

export interface ComponentMetadata {
    type: string;
    label: string;
    category: ComponentCategory;
    useWhen: string;
    level: ComponentComplexity;
    complexity: ComponentComplexity;
    maturity: ComponentMaturity;
    capability: ComponentCapability;
    interaction: { defaultEnabled: boolean; naturalTrigger: "click" | "change"; autoExternalMode: "filter" | "selection" };
}

// Derive component metadata from the centralized definitions catalog
export const componentCatalog: ComponentMetadata[] = componentDescriptors.map(d => ({
    type: d.type,
    label: d.label,
    category: d.category as ComponentCategory,
    useWhen: d.useWhen,
    level: d.complexity,
    complexity: d.complexity,
    maturity: d.maturity,
    capability: d.capabilities,
    interaction: d.interaction,
}));

export const componentTypeNames = componentCatalog.map(component => component.type);
export const componentCategories: ComponentCategory[] = ["Layout", "Controls", "Navigation", "Display", "Charts", "Tables", "Maps", "Custom components", "Advanced components", "Primitives", "Forms", "Feedback"];
export const componentsByCategory = (category: ComponentCategory): ComponentMetadata[] => componentCatalog.filter(component => component.category === category);
export const componentPromptReference = (): string => componentCategories.map(category => `${category}: ${componentsByCategory(category).map(component => `${component.type} (${component.useWhen})`).join("; ")}`).join("\n");
