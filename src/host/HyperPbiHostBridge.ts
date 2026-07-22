import type { FilterOperator } from "../schema/hyperpbiSchema";
import type { InteractionDetails } from "../powerbi/interactionDiagnostics";

export interface SelectionRequest {
    rowIndices: number[];
    multiSelect?: boolean;
    clear?: boolean;
    details?: InteractionDetails;
}

export interface FilterRequest {
    field?: string;
    operator?: FilterOperator;
    value?: unknown;
    clear?: boolean;
    details?: InteractionDetails;
}

export interface InteractionResult {
    supported: boolean;
    success: boolean;
    code?: string;
    message?: string;
}

export interface RuntimeDiagnostic {
    code: string;
    severity: "info" | "warning" | "error";
    message: string;
    componentId?: string;
    details?: Record<string, unknown>;
}

/** The only host-specific surface exposed to the shared HyperPBI runtime. */
export interface HyperPbiHostBridge {
    readonly hostType: "powerbi" | "web";
    requestSelection?(request: SelectionRequest): Promise<InteractionResult>;
    requestExternalFilter?(request: FilterRequest): Promise<InteractionResult>;
    openUrl?(url: string): void;
    reportDiagnostic?(diagnostic: RuntimeDiagnostic): void;
}
