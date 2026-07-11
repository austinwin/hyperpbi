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
import type { UiAction, UiActionResult } from "../actions/uiActionTypes";
import type { DatasetResult } from "../data/datasets";

export interface RenderContextValue {
    instanceId?: string;
    data: NormalizedData;
    rows: DataRow[];
    sourceRows: DataRow[];
    sourceRowKeys: string[];
    getRowsForComponent: (componentId: string) => DataRow[];
    componentRows: (componentId: string) => number[];
    schema: HyperPbiSchema;
    settings: RuntimeSettings;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
    warnings: string[];
    selectExternal: (rowIndices: number[], multiSelect?: boolean, details?: InteractionDetails) => ExternalSelectionResult;
    /** Select indices in the original Power BI source, bypassing component-dataset lineage adapters. */
    selectSourceRows?: (rowIndices: number[], multiSelect?: boolean, details?: InteractionDetails) => ExternalSelectionResult;
    clearExternal: (details?: InteractionDetails) => ExternalSelectionResult;
    applyExternalFilter: (field:string,operator:FilterOperator,value:unknown,details?:InteractionDetails) => ExternalFilterResult;
    clearExternalFilter: (details?:InteractionDetails) => ExternalFilterResult;
    reportInteraction: (details: InteractionDetails, reason?: ExternalSelectionFailureReason, rowIndices?: number[]) => void;
    config: HyperPbiConfig;
    webAccessAvailable: boolean;
    // ── UI Actions ──
    executeUiAction: (action: UiAction | UiAction[], event?: Event) => UiActionResult;
    isOverlayOpen: (id: string) => boolean;
    datasets?: Map<string,DatasetResult>;
    datasetLineage?: number[][];
}

export const RenderContext = createContext<RenderContextValue | undefined>(undefined);
export function useRenderContext(): RenderContextValue {
    const value = useContext(RenderContext);
    if (!value) throw new Error("HyperPBI render context is unavailable.");
    return value;
}
