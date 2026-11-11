import type { FilterOperator } from "../schema/hyperpbiSchema";
import type { DataRow } from "../data/normalizeData";

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
    /** Write a single interaction value to shared dashboard state. */
    stateKey?: string;
    operator?: FilterOperator;
    value?: unknown;
    selectionMode?: InteractionSelectionMode;
    multiSelect?: boolean;
    showSelector?: boolean;
    clearOnSecondClick?: boolean;
    /** Compatibility shorthand for one linked target. */
    target?: string;
    /** Restrict internal linked behavior to these component IDs. */
    targets?: string[];
}

export interface ResolvedInteractionPolicy {
    enabled: boolean;
    trigger: ResolvedInteractionTrigger;
    internalMode: InternalInteractionMode;
    internalScope: InternalInteractionScope;
    externalMode: ResolvedExternalInteractionMode;
    field?: string;
    stateKey?: string;
    operator?: FilterOperator;
    value?: unknown;
    selectionMode: InteractionSelectionMode;
    multiSelect: boolean;
    showSelector: boolean;
    clearOnSecondClick: boolean;
    targets?: string[];
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
    mapFeatureKey?: string;
    mapLayerId?: string;
    mapFeatureId?: string;
    contextRows?: DataRow[];
}

export interface InteractionModifiers {
    trigger: ResolvedInteractionTrigger;
    multiSelect?: boolean;
    event?: Event;
    dynamicEvent?: import("../fragments/fragmentTypes").DynamicTrigger["event"] | false;
    contextValue?: unknown;
}

export interface InternalInteractionFilter {
    originComponentId: string;
    sourceComponentId?: string;
    field: string;
    operator: FilterOperator;
    value: unknown;
    scope: InternalInteractionScope;
    targets?: string[];
}

export interface InteractionExecutionResult {
    executed: boolean;
    cleared: boolean;
    selectedRows: number[];
    internalApplied: boolean;
    externalSent: boolean;
    reason?: string;
}
