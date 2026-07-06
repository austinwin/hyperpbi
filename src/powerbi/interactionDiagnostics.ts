import { Primitive } from "../data/normalizeData";

export type ExternalSelectionFailureReason =
    | "interactions disabled"
    | "host disallowed"
    | "no selection identities"
    | "no matching source rows"
    | "unsupported interaction action"
    | "component did not call selectExternal";

export interface InteractionDetails {
    componentId?: string;
    componentType?: string;
    field?: string;
    value?: Primitive;
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
    lastClickedValue?: Primitive;
    lastResolvedSourceRowCount: number;
    lastSelectedSourceRowIndices: number[];
    externalSelectionSent: boolean;
    reasonExternalSelectionNotSent?: ExternalSelectionFailureReason;
}

export function createInteractionDiagnostics(enabled: boolean, hostAllowsInteractions: boolean, selectionIdentityCount: number): InteractionDiagnostics {
    return { externalInteractionEnabled: enabled, hostAllowsInteractions, selectionIdentityCount, lastResolvedSourceRowCount: 0, lastSelectedSourceRowIndices: [], externalSelectionSent: false, reasonExternalSelectionNotSent: "component did not call selectExternal" };
}

