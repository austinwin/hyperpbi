import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { DataRow, NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { RuntimeSettings } from "../settings";
import { DashboardAction, DashboardState } from "./stateStore";
import { HyperPbiConfig } from "../config/hyperpbiConfig";

export interface RenderContextValue {
    data: NormalizedData;
    rows: DataRow[];
    sourceRows: DataRow[];
    schema: HyperPbiSchema;
    settings: RuntimeSettings;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
    warnings: string[];
    selectExternal: (rowIndices: number[], multiSelect?: boolean) => void;
    clearExternal: () => void;
    config: HyperPbiConfig;
    webAccessAvailable: boolean;
}

export const RenderContext = createContext<RenderContextValue | undefined>(undefined);
export function useRenderContext(): RenderContextValue {
    const value = useContext(RenderContext);
    if (!value) throw new Error("HyperPBI render context is unavailable.");
    return value;
}
