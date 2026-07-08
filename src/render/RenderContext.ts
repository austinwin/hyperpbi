import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { DataRow, NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { RuntimeSettings } from "../settings";
import { DashboardAction, DashboardState } from "./stateStore";
import { HyperPbiConfig } from "../config/hyperpbiConfig";
import { ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails } from "../powerbi/interactionDiagnostics";
import { ExternalFilterResult } from "../powerbi/externalFilters";
import { FilterOperator } from "../schema/hyperpbiSchema";

export interface RenderContextValue {
    data: NormalizedData;
    rows: DataRow[];
    sourceRows: DataRow[];
    getRowsForComponent: (componentId: string) => DataRow[];
    componentRows: (componentId: string) => number[];
    schema: HyperPbiSchema;
    settings: RuntimeSettings;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
    warnings: string[];
    selectExternal: (rowIndices: number[], multiSelect?: boolean, details?: InteractionDetails) => ExternalSelectionResult;
    clearExternal: (details?: InteractionDetails) => ExternalSelectionResult;
    applyExternalFilter: (field:string,operator:FilterOperator,value:unknown,details?:InteractionDetails) => ExternalFilterResult;
    clearExternalFilter: (details?:InteractionDetails) => ExternalFilterResult;
    reportInteraction: (details: InteractionDetails, reason?: ExternalSelectionFailureReason, rowIndices?: number[]) => void;
    config: HyperPbiConfig;
    webAccessAvailable: boolean;
}

export const RenderContext = createContext<RenderContextValue | undefined>(undefined);
export function useRenderContext(): RenderContextValue {
    const value = useContext(RenderContext);
    if (!value) throw new Error("HyperPBI render context is unavailable.");
    return value;
}
