export type ExternalSelectionFailureReason =
    | "interactions disabled"
    | "host disallowed"
    | "no selection identities"
    | "no matching source rows"
    | "field has no Power BI filter target"
    | "unsupported external filter operator"
    | "host filter failed"
    | "unsupported interaction action"
    | "component did not call selectExternal";

export interface InteractionDetails {
    componentId?: string;
    componentType?: string;
    field?: string;
    value?: unknown;
    matchedRowCount?: number;
    filterOperator?: "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in" | "between";
}

export interface ExternalSelectionResult {
    sent: boolean;
    reason?: ExternalSelectionFailureReason;
}

export interface InteractionDiagnostics {
    externalInteractionEnabled: boolean;
    hostAllowsInteractions: boolean;
    selectionIdentityCount: number;
    lastClickedComponentId?: string;
    lastClickedComponentType?: string;
    lastClickedField?: string;
    lastClickedValue?: unknown;
    lastResolvedSourceRowCount: number;
    lastSelectedSourceRowIndices: number[];
    externalSelectionSent: boolean;
    externalMode?: "filter" | "selection";
    filterSent: boolean;
    selectionSent: boolean;
    filterTargetTable?: string;
    filterTargetColumn?: string;
    reasonExternalSelectionNotSent?: ExternalSelectionFailureReason;
}

export function createInteractionDiagnostics(enabled: boolean, hostAllowsInteractions: boolean, selectionIdentityCount: number): InteractionDiagnostics {
    return { externalInteractionEnabled: enabled, hostAllowsInteractions, selectionIdentityCount, lastResolvedSourceRowCount: 0, lastSelectedSourceRowIndices: [], externalSelectionSent: false, filterSent:false, selectionSent:false, reasonExternalSelectionNotSent: "component did not call selectExternal" };
}

