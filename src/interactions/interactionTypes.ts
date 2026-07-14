import type { FilterOperator } from "../schema/hyperpbiSchema";

export type InteractionTrigger = "auto" | "click" | "change";
export type ResolvedInteractionTrigger = Exclude<InteractionTrigger, "auto">;
export type InternalInteractionMode = "none" | "highlight" | "filter";
export type InternalInteractionScope = "self" | "others" | "all";
export type ExternalInteractionMode = "none" | "auto" | "selection" | "filter";
export type ResolvedExternalInteractionMode = Exclude<ExternalInteractionMode, "auto">;
export type InteractionSelectionMode = "replace" | "toggle" | "add";
export type ComponentKind = "control" | "dataPoint" | "display" | "navigation" | "layout" | "content" | "custom";

export interface ComponentInteractionDefinition {
    enabled?: boolean;
    trigger?: InteractionTrigger;
    internalMode?: InternalInteractionMode;
    internalScope?: InternalInteractionScope;
    externalMode?: ExternalInteractionMode;
    field?: string;
    fieldSource?: "powerbi" | "service" | "joined";
    operator?: FilterOperator;
    value?: unknown;
    selectionMode?: InteractionSelectionMode;
    multiSelect?: boolean;
    showSelector?: boolean;
    clearOnSecondClick?: boolean;
}

export interface ResolvedInteractionPolicy {
    enabled: boolean;
    trigger: ResolvedInteractionTrigger;
    internalMode: InternalInteractionMode;
    internalScope: InternalInteractionScope;
    externalMode: ResolvedExternalInteractionMode;
    field?: string;
    operator?: FilterOperator;
    value?: unknown;
    selectionMode: InteractionSelectionMode;
    multiSelect: boolean;
    showSelector: boolean;
    clearOnSecondClick: boolean;
    componentKind: ComponentKind;
    explicit: boolean;
}

export interface InteractionPayload {
    componentId: string;
    componentType: string;
    rowIndices: number[];
    rowKeys: string[];
    field?: string;
    value?: unknown;
    operator: FilterOperator;
}

export interface InteractionModifiers {
    trigger: ResolvedInteractionTrigger;
    multiSelect?: boolean;
    event?: Event;
}

export interface InternalInteractionFilter {
    originComponentId: string;
    field: string;
    operator: FilterOperator;
    value: unknown;
    scope: InternalInteractionScope;
}

export interface InteractionExecutionResult {
    executed: boolean;
    cleared: boolean;
    selectedRows: number[];
    internalApplied: boolean;
    externalSent: boolean;
    reason?: string;
}
