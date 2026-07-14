export type ComponentCategory = "Layout" | "Controls" | "Navigation" | "Display" | "Charts" | "Tables" | "Maps" | "Custom components" | "Advanced components" | "Primitives" | "Forms" | "Feedback";
export type ComponentMaturity = "stable" | "beta" | "experimental" | "legacy" | "deprecated";
export type ComponentComplexity = "recommended" | "standard" | "advanced";

export interface ComponentCapability {
    fields: boolean;
    calculations: boolean;
    css: boolean;
    slots: boolean;
    interactions: boolean;
    externalSelection: boolean;
    customHtml: boolean;
}

export type InspectorControlType = "text" | "number" | "checkbox" | "enum" | "field" | "dataset" | "component" | "color" | "multiline" | "json";
export type InspectorPropertyGroup = "Identity" | "Data" | "Layout" | "Appearance" | "Interaction" | "Content" | "Accessibility" | "Advanced";
export interface InspectorVisibleWhen {
    property: string;
    equals?: unknown;
    notEquals?: unknown;
    truthy?: boolean;
    oneOf?: unknown[];
}
export interface InspectorPropertyDescriptor {
    property: string;
    label: string;
    control: InspectorControlType;
    options?: string[];
    group?: InspectorPropertyGroup;
    order?: number;
    advanced?: boolean;
    help?: string;
    visibleWhen?: InspectorVisibleWhen;
    readOnly?: boolean;
}
