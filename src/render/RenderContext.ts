import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { DataRow, NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { RuntimeSettings } from "../settings";
import { DashboardAction, DashboardState } from "./stateStore";
import { HyperPbiConfig } from "../config/hyperpbiConfig";
import { ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails } from "../powerbi/interactionDiagnostics";

export interface RenderContextValue {
    data: NormalizedData;
    rows: DataRow[];
    sourceRows: DataRow[];
    schema: HyperPbiSchema;
    settings: RuntimeSettings;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
    warnings: string[];
    selectExternal: (rowIndices: number[], multiSelect?: boolean, details?: InteractionDetails) => ExternalSelectionResult;
    clearExternal: (details?: InteractionDetails) => ExternalSelectionResult;
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
