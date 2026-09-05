import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { DataRow, NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { RuntimeSettings } from "../runtime/runtimeSettings";
import { DashboardAction, DashboardState } from "./stateStore";
import { HyperPbiConfig } from "../config/hyperpbiConfig";
import { ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails } from "../powerbi/interactionDiagnostics";
import { ExternalFilterResult } from "../powerbi/externalFilters";
import { FilterOperator } from "../schema/hyperpbiSchema";
import type { UiAction, UiActionResult } from "../actions/uiActionTypes";
import type { DatasetResult } from "../data/datasets";
import type { ProviderAccessState } from "../providers/providerTypes";
import type { MapViewportState } from "../components/maps/MapBlock";
import type { PersistedGeoLibreProject } from "../components/geolibre/types";
import type { RemoteDataSourceStatus } from "../data/remoteDataSources";

export interface ResolvedDatasetView {
    name: string;
    /** Root workspace source. Only "powerbi" carries report-model identity. Older test/adapter views may omit it and are treated as Power BI-rooted for compatibility. */
    sourceId?: string;
    rows: DataRow[];
    fields: NormalizedData["fields"];
    /** Row positions in the evaluated logical dataset before component interaction filtering. */
    rowIndices: number[];
    rowKeys: string[];
    /** Contributing original Power BI data-view row positions for each logical row. */
    sourceRowIndices: number[][];
    /** Contributing original Power BI row keys/identities for each logical row. */
    sourceRowKeys: string[][];
    totalRows: number;
}

export interface RenderContextValue {
    instanceId?: string;
    data: NormalizedData;
    rows: DataRow[];
    sourceRows: DataRow[];
    sourceRowKeys: string[];
    /** Unadapted rows and identities from the single Power BI data view. */
    powerBiSourceRows?: DataRow[];
    powerBiSourceRowKeys?: string[];
    getRowsForComponent: (componentId: string) => DataRow[];
    getDatasetView?: (name?: string, componentId?: string) => ResolvedDatasetView | undefined;
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
    providerAccess?:ProviderAccessState;
    ownerByRuntimeId?: Readonly<Record<string, string>>;
    componentPathById?: Readonly<Record<string, string>>;
    // ── UI Actions ──
    executeUiAction: (action: UiAction | UiAction[], event?: Event) => UiActionResult;
    isOverlayOpen: (id: string) => boolean;
    datasets?: Map<string,DatasetResult>;
    remoteSources?: Readonly<Record<string, RemoteDataSourceStatus>>;
    datasetLineage?: number[][];
    /** Internal interaction payload row indices are local to this dataset unless marked as Power BI source indices. */
    interactionIndexSpace?: "component" | "powerbi";
    /** Use original row keys for linked internal filtering while retaining semantic external-filter fields. */
    interactionUsesSourceIdentity?: boolean;
    onMapViewportChange?: (mapId: string, viewport: MapViewportState) => void;
    /** Authoring-only persistence boundary for native GeoLibre project state. */
    onGeoLibreProjectChange?: (componentId: string, project: PersistedGeoLibreProject) => void;
}

export const RenderContext = createContext<RenderContextValue | undefined>(undefined);
export function useRenderContext(): RenderContextValue {
    const value = useContext(RenderContext);
    if (!value) throw new Error("HyperPBI render context is unavailable.");
    return value;
}
