import { ActiveFilter } from "../data/filtering";
import type { InternalInteractionFilter } from "../interactions/interactionTypes";
import {
    activateMapFeature,
    emptyMapInteractionState,
    reconcileMapInteractionState,
    showMapIdentifiedFeature,
    type ActiveMapFeature,
    type MapInteractionState,
} from "../maps/interactions/mapInteractionState";
import type { MapFeatureKey } from "../maps/model/mapFeatureIdentity";
import { resolveMapFeatureSelection } from "../maps/interactions/mapSpatialSelection";

export interface ToastMessage {
    id: string;
    title?: string;
    message: string;
    intent: "neutral" | "primary" | "success" | "warning" | "danger";
    durationMs?: number;
}

export interface OverlayAnchor {
    top: number;
    left: number;
    width: number;
    height: number;
    triggerId?: string;
}

export type MapToolbarPopover = "layers" | "legend" | "search" | "bookmarks" | "selection" | "quickFilters" | null;

export interface ChartViewState {
    zoom?: { start?: number; end?: number; startValue?: unknown; endValue?: unknown };
    brushRowKeys?: string[];
}

export interface ChartDrillPathEntry {
    levelId: string;
    label: string;
    field?: string;
    value: unknown;
}

export interface ChartDrillState {
    levelId: string;
    path: ChartDrillPathEntry[];
}

export interface DashboardState {
    search: string;
    activeTabs: Record<string, string>;
    collapsed: Record<string, boolean>;
    filters: ActiveFilter[];
    values: Record<string, unknown>;
    selectedRows: number[];
    selectedRowKeys: string[];
    componentSelectedRows: Record<string, number[]>;
    componentSelectedRowKeys: Record<string, string[]>;
    componentSelectionScopes: Record<string, InternalInteractionFilter["scope"]>;
    componentSelectionModes: Record<string, "none"|"highlight"|"filter">;
    componentSelectionTargets: Record<string, string[]>;
    interactionFilters: InternalInteractionFilter[];
    interactionSignatures: Record<string, string>;
    selectedMapFeature?: number;
    /** Map-local feature selection (reference layers without Power BI rows) */
    mapSelectedFeatureIds: Record<string, string[]>;
    /** Authoritative map-local interaction state. mapSelectedFeatureIds is a compatibility mirror. */
    mapInteractionState: Record<string, MapInteractionState>;
    tableSearch: Record<string, string>;
    chartViewState: Record<string, ChartViewState>;
    chartDrillState: Record<string, ChartDrillState>;

    // Application shell
    sidebarCollapsed: boolean;
    mobileSidebarOpen: boolean;

    // Overlays
    openOverlays: string[];
    overlayAnchors: Record<string, OverlayAnchor>;

    // Accordion & steps
    accordionOpenItems: Record<string, string[]>;
    activeSteps: Record<string, string>;

    // Toasts
    toasts: ToastMessage[];

    // Map layer runtime state (viewer-controlled, not spec-level)
    mapLayerState: Record<string, {
        order?: string[];
        visibility?: Record<string, boolean>;
        opacity?: Record<string, number>;
        labels?: Record<string, boolean>;
    }>;

    // Map UI state. undefined means component defaults apply; null is explicitly closed.
    mapUiState: Record<string, {
        toolbarPopover?: MapToolbarPopover;
        legendSelections?: Record<string, string[]>;
        legendHoveredFeatureKeys?: string[];
        quickFilterValues?: Record<string, unknown>;
        filterToSelected?: boolean;
    }>;
}

export type DashboardAction =
    | { type: "search"; value: string }
    | { type: "tab"; id: string; value: string }
    | { type: "collapse"; id: string; value?: boolean }
    | { type: "filter"; filter: ActiveFilter }
    | { type: "removeFilter"; id: string }
    | { type: "value"; id: string; value: unknown }
    | { type: "selectRows"; rows: number[] }
    | { type: "selectRowKeys"; keys: string[] }
    | { type: "selectComponentRows"; id: string; rows: number[] }
    | { type: "selectComponentRowKeys"; id: string; keys: string[] }
    | { type: "componentSelectionScope"; id: string; scope?: InternalInteractionFilter["scope"] }
    | { type: "componentSelectionMode"; id: string; mode?: "none"|"highlight"|"filter" }
    | { type: "componentSelectionTargets"; id: string; targets?: string[] }
    | { type: "interactionFilter"; filter: InternalInteractionFilter }
    | { type: "clearInteractionFilter"; id: string }
    | { type: "interactionSignature"; id: string; value?: string }
    | { type: "resetInteractions" }
    | { type: "reconcileRowKeys"; rowKeys: string[] }
    | { type: "selectMap"; index?: number }
    | { type: "selectMapFeatures"; mapId: string; featureIds: string[]; selectionMode?: "replace" | "add" | "remove" | "toggle" | "clear" }
    | { type: "clearMapFeatures"; mapId: string }
    | { type: "activateMapFeature"; mapId: string; feature: ActiveMapFeature; multiSelect?: boolean; selectionMode?: "replace" | "add" | "remove" | "toggle" | "clear" }
    | { type: "showMapIdentifiedFeature"; mapId: string; feature: ActiveMapFeature }
    | { type: "setMapHoveredFeature"; mapId: string; featureKey?: MapFeatureKey }
    | { type: "closeMapFeatureDetails"; mapId: string; clearSelection?: boolean }
    | { type: "reconcileMapFeatures"; mapId: string; availableFeatureKeys: MapFeatureKey[] }
    | { type: "tableSearch"; id: string; value: string }
    | { type: "chartView"; id: string; value?: ChartViewState }
    | { type: "chartDrill"; id: string; value?: ChartDrillState }
    | { type: "clearFilters" }
    // Application shell
    | { type: "sidebarCollapsed"; value: boolean }
    | { type: "mobileSidebar"; value: boolean }
    // Overlays
    | { type: "openOverlay"; id: string; anchor?: OverlayAnchor }
    | { type: "closeOverlay"; id: string }
    | { type: "toggleOverlay"; id: string; anchor?: OverlayAnchor }
    | { type: "closeAllOverlays" }
    | { type: "setOpenOverlays"; ids: string[] }
    // Accordion & steps
    | { type: "accordion"; id: string; items: string[] }
    | { type: "step"; id: string; value: string }
    | { type: "stepNext"; id: string }
    | { type: "stepPrevious"; id: string }
    // Toasts
    | { type: "pushToast"; toast: ToastMessage }
    | { type: "dismissToast"; id: string }
    // Map layer actions
    | { type: "mapLayerOrder"; mapId: string; layerIds: string[] }
    | { type: "mapLayerVisibility"; mapId: string; layerId: string; visible: boolean }
    | { type: "mapLayerOpacity"; mapId: string; layerId: string; opacity: number }
    | { type: "mapLayerLabels"; mapId: string; layerId: string; visible: boolean }
    | { type: "resetMapLayers"; mapId: string }
    // Map toolbar popover state
    | { type: "setMapToolbarPopover"; mapId: string; popover: MapToolbarPopover }
    | { type: "setMapLegendSelection"; mapId: string; layerId: string; keys: string[] }
    | { type: "setMapLegendHover"; mapId: string; featureKeys: string[] }
    | { type: "setMapQuickFilter"; mapId: string; filterId: string; value?: unknown }
    | { type: "clearMapQuickFilters"; mapId: string }
    | { type: "setMapFilterToSelected"; mapId: string; value: boolean };

export function initialDashboardState(search = "", activeTab = ""): DashboardState {
    return {
        search,
        activeTabs: activeTab ? { mainTabs: activeTab } : {},
        collapsed: {},
        filters: [],
        values: {},
        selectedRows: [],
        selectedRowKeys: [],
        componentSelectedRows: {},
        componentSelectedRowKeys: {},
        componentSelectionScopes: {},
        componentSelectionModes: {},
        componentSelectionTargets: {},
        interactionFilters: [],
        interactionSignatures: {},
        tableSearch: {},
        chartViewState: {},
        chartDrillState: {},
        selectedMapFeature: undefined,
        mapSelectedFeatureIds: {},
        mapInteractionState: {},
        // App shell defaults
        sidebarCollapsed: false,
        mobileSidebarOpen: false,
        openOverlays: [],
        overlayAnchors: {},
        accordionOpenItems: {},
        activeSteps: {},
        toasts: [],
        mapLayerState: {},
        mapUiState: {},
    };
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    // ── Existing actions ──────────────────────────────────────────
    if (action.type === "search") return { ...state, search: action.value };
    if (action.type === "tab") return { ...state, activeTabs: { ...state.activeTabs, [action.id]: action.value } };
    if (action.type === "collapse") return { ...state, collapsed: { ...state.collapsed, [action.id]: action.value ?? !state.collapsed[action.id] } };
    if (action.type === "filter") return { ...state, filters: [...state.filters.filter(item => item.id !== action.filter.id), action.filter] };
    if (action.type === "removeFilter") return { ...state, filters: state.filters.filter(item => item.id !== action.id) };
    if (action.type === "value") return { ...state, values: { ...state.values, [action.id]: action.value } };
    if (action.type === "selectRows") return { ...state, selectedRows: action.rows };
    if (action.type === "selectRowKeys") return { ...state, selectedRowKeys: action.keys };
    if (action.type === "selectComponentRows") return { ...state, componentSelectedRows: { ...state.componentSelectedRows, [action.id]: action.rows } };
    if (action.type === "selectComponentRowKeys") return { ...state, componentSelectedRowKeys: { ...state.componentSelectedRowKeys, [action.id]: action.keys } };
    if (action.type === "componentSelectionScope") { const componentSelectionScopes={...state.componentSelectionScopes};if(action.scope)componentSelectionScopes[action.id]=action.scope;else delete componentSelectionScopes[action.id];return{...state,componentSelectionScopes}; }
    if (action.type === "componentSelectionMode") { const componentSelectionModes={...state.componentSelectionModes};if(action.mode)componentSelectionModes[action.id]=action.mode;else delete componentSelectionModes[action.id];return{...state,componentSelectionModes}; }
    if (action.type === "componentSelectionTargets") { const componentSelectionTargets={...state.componentSelectionTargets};if(action.targets?.length)componentSelectionTargets[action.id]=Array.from(new Set(action.targets));else delete componentSelectionTargets[action.id];return{...state,componentSelectionTargets}; }
    if (action.type === "interactionFilter") return { ...state, interactionFilters: [...state.interactionFilters.filter(filter => filter.originComponentId !== action.filter.originComponentId), action.filter] };
    if (action.type === "clearInteractionFilter") return { ...state, interactionFilters: state.interactionFilters.filter(filter => filter.originComponentId !== action.id) };
    if (action.type === "interactionSignature") { const interactionSignatures = { ...state.interactionSignatures }; if (action.value === undefined) delete interactionSignatures[action.id]; else interactionSignatures[action.id] = action.value; return { ...state, interactionSignatures }; }
    if (action.type === "resetInteractions") return { ...state, selectedRows: [], selectedRowKeys: [], componentSelectedRows: {}, componentSelectedRowKeys: {}, componentSelectionScopes: {}, componentSelectionModes: {}, componentSelectionTargets: {}, interactionFilters: [], interactionSignatures: {}, selectedMapFeature: undefined, mapSelectedFeatureIds: {}, mapInteractionState: {}, chartViewState: {}, chartDrillState: {} };
    if (action.type === "reconcileRowKeys") {
        const indexByKey = new Map(
            action.rowKeys.map((key, index) => [key, index] as const)
        );
        const selectedRowKeys = state.selectedRowKeys.filter(key => indexByKey.has(key));
        const selectedRows = selectedRowKeys.map(key => indexByKey.get(key)!).filter((index): index is number => index !== undefined);
        const componentSelectedRowKeys: Record<string, string[]> = {};
        const componentSelectedRows: Record<string, number[]> = {};
        for (const [id, keys] of Object.entries(state.componentSelectedRowKeys)) {
            const kept = keys.filter(key => indexByKey.has(key));
            componentSelectedRowKeys[id] = kept;
            componentSelectedRows[id] = kept.map(key => indexByKey.get(key)!).filter((index): index is number => index !== undefined);
        }
        return { ...state, selectedRowKeys, selectedRows, componentSelectedRowKeys, componentSelectedRows };
    }
    if (action.type === "selectMap") return { ...state, selectedMapFeature: action.index };
    if (action.type === "selectMapFeatures") {
        const current = state.mapSelectedFeatureIds[action.mapId] ?? [];
        const mode = action.selectionMode ?? "add";
        const newIds = resolveMapFeatureSelection(current, action.featureIds, mode);
        if (newIds.length === 0) {
            const { [action.mapId]: _, ...rest } = state.mapSelectedFeatureIds;
            const currentInteraction = state.mapInteractionState[action.mapId];
            const mapInteractionState = { ...state.mapInteractionState };
            if (currentInteraction)
                mapInteractionState[action.mapId] = { ...currentInteraction, selectedFeatureKeys: [], selectedFeaturesByKey: {} };
            return { ...state, mapSelectedFeatureIds: rest, mapInteractionState };
        }
        const currentInteraction = state.mapInteractionState[action.mapId] ?? emptyMapInteractionState();
        const selectedIdSet = new Set(newIds);
        const selectedFeaturesByKey = Object.fromEntries(
            Object.entries(currentInteraction.selectedFeaturesByKey ?? {}).filter(([key]) => selectedIdSet.has(key))
        );
        return {
            ...state,
            mapSelectedFeatureIds: { ...state.mapSelectedFeatureIds, [action.mapId]: newIds },
            mapInteractionState: {
                ...state.mapInteractionState,
                [action.mapId]: { ...currentInteraction, selectedFeatureKeys: newIds, selectedFeaturesByKey },
            },
        };
    }
    if (action.type === "clearMapFeatures") {
        const { [action.mapId]: _, ...rest } = state.mapSelectedFeatureIds;
        const currentInteraction = state.mapInteractionState[action.mapId];
        if (!currentInteraction) return { ...state, mapSelectedFeatureIds: rest };
        return {
            ...state,
            mapSelectedFeatureIds: rest,
            mapInteractionState: {
                ...state.mapInteractionState,
                [action.mapId]: { ...currentInteraction, selectedFeatureKeys: [], selectedFeaturesByKey: {} },
            },
        };
    }
    if (action.type === "activateMapFeature") {
        const interaction = activateMapFeature(
            state.mapInteractionState[action.mapId],
            action.feature,
            action.multiSelect === true,
            action.selectionMode,
        );
        return {
            ...state,
            mapSelectedFeatureIds: {
                ...state.mapSelectedFeatureIds,
                [action.mapId]: interaction.selectedFeatureKeys,
            },
            mapInteractionState: {
                ...state.mapInteractionState,
                [action.mapId]: interaction,
            },
        };
    }
    if (action.type === "showMapIdentifiedFeature") {
        const interaction = showMapIdentifiedFeature(
            state.mapInteractionState[action.mapId],
            action.feature,
        );
        return {
            ...state,
            mapInteractionState: {
                ...state.mapInteractionState,
                [action.mapId]: interaction,
            },
        };
    }
    if (action.type === "setMapHoveredFeature") {
        const current = state.mapInteractionState[action.mapId] ?? emptyMapInteractionState();
        if (current.hoveredFeatureKey === action.featureKey) return state;
        return {
            ...state,
            mapInteractionState: {
                ...state.mapInteractionState,
                [action.mapId]: { ...current, hoveredFeatureKey: action.featureKey },
            },
        };
    }
    if (action.type === "closeMapFeatureDetails") {
        const current = state.mapInteractionState[action.mapId];
        if (!current?.activeFeature && !(action.clearSelection && current?.selectedFeatureKeys.length)) return state;
        const selectedFeatureKeys = action.clearSelection ? [] : current.selectedFeatureKeys;
        const mapSelectedFeatureIds = { ...state.mapSelectedFeatureIds };
        if (action.clearSelection) delete mapSelectedFeatureIds[action.mapId];
        return {
            ...state,
            mapSelectedFeatureIds,
            mapInteractionState: {
                ...state.mapInteractionState,
                [action.mapId]: {
                    ...current,
                    activeFeature: undefined,
                    selectedFeatureKeys,
                    selectedFeaturesByKey: action.clearSelection ? {} : current.selectedFeaturesByKey,
                },
            },
        };
    }
    if (action.type === "reconcileMapFeatures") {
        const current = state.mapInteractionState[action.mapId];
        const reconciled = reconcileMapInteractionState(current, action.availableFeatureKeys);
        if (reconciled === current) return state;
        const mapInteractionState = { ...state.mapInteractionState };
        const mapSelectedFeatureIds = { ...state.mapSelectedFeatureIds };
        if (!reconciled) {
            delete mapInteractionState[action.mapId];
            delete mapSelectedFeatureIds[action.mapId];
        } else {
            mapInteractionState[action.mapId] = reconciled;
            if (reconciled.selectedFeatureKeys.length)
                mapSelectedFeatureIds[action.mapId] = reconciled.selectedFeatureKeys;
            else delete mapSelectedFeatureIds[action.mapId];
        }
        return { ...state, mapInteractionState, mapSelectedFeatureIds };
    }
    if (action.type === "tableSearch") return { ...state, tableSearch: { ...state.tableSearch, [action.id]: action.value } };
    if (action.type === "chartView") { const chartViewState={...state.chartViewState};if(action.value)chartViewState[action.id]=action.value;else delete chartViewState[action.id];return{...state,chartViewState}; }
    if (action.type === "chartDrill") { const chartDrillState={...state.chartDrillState};if(action.value)chartDrillState[action.id]=action.value;else delete chartDrillState[action.id];return{...state,chartDrillState}; }
    // clearFilters does NOT reset app shell state
    if (action.type === "clearFilters") return { ...state, filters: [], search: "", values: {}, tableSearch: {}, selectedRows: [], selectedRowKeys: [], componentSelectedRows: {}, componentSelectedRowKeys: {}, componentSelectionScopes: {}, componentSelectionModes: {}, componentSelectionTargets: {}, interactionFilters: [], interactionSignatures: {}, selectedMapFeature: undefined, mapSelectedFeatureIds: {}, mapInteractionState: {}, chartViewState: {}, chartDrillState: {} };

    // ── Application shell ─────────────────────────────────────────
    if (action.type === "sidebarCollapsed") return { ...state, sidebarCollapsed: action.value, mobileSidebarOpen: action.value ? false : state.mobileSidebarOpen };
    if (action.type === "mobileSidebar") return { ...state, mobileSidebarOpen: action.value };

    // ── Overlays ──────────────────────────────────────────────────
    if (action.type === "openOverlay") {
        const openOverlays = [...state.openOverlays.filter(id => id !== action.id), action.id];
        const overlayAnchors = action.anchor ? { ...state.overlayAnchors, [action.id]: action.anchor } : state.overlayAnchors;
        return { ...state, openOverlays, overlayAnchors };
    }
    if (action.type === "closeOverlay") {
        const overlayAnchors = { ...state.overlayAnchors };
        delete overlayAnchors[action.id];
        return { ...state, openOverlays: state.openOverlays.filter(id => id !== action.id), overlayAnchors };
    }
    if (action.type === "toggleOverlay") {
        if (state.openOverlays.includes(action.id)) {
            const overlayAnchors = { ...state.overlayAnchors };
            delete overlayAnchors[action.id];
            return { ...state, openOverlays: state.openOverlays.filter(id => id !== action.id), overlayAnchors };
        }
        const overlayAnchors = action.anchor ? { ...state.overlayAnchors, [action.id]: action.anchor } : state.overlayAnchors;
        return { ...state, openOverlays: [...state.openOverlays.filter(id => id !== action.id), action.id], overlayAnchors };
    }
    if (action.type === "closeAllOverlays") return { ...state, openOverlays: [], overlayAnchors: {} };
    if (action.type === "setOpenOverlays") {
        const ids = Array.from(new Set(action.ids));
        const overlayAnchors = Object.fromEntries(Object.entries(state.overlayAnchors).filter(([id]) => ids.includes(id)));
        return { ...state, openOverlays: ids, overlayAnchors };
    }

    // ── Accordion & steps ─────────────────────────────────────────
    if (action.type === "accordion") return { ...state, accordionOpenItems: { ...state.accordionOpenItems, [action.id]: action.items } };
    if (action.type === "step") return { ...state, activeSteps: { ...state.activeSteps, [action.id]: action.value } };
    if (action.type === "stepNext") {
        // stepNext/stepPrevious are placeholders — the Steps component reads state and computes progression
        return state;
    }
    if (action.type === "stepPrevious") return state;

    // ── Toasts ────────────────────────────────────────────────────
    if (action.type === "pushToast") {
        const toasts = [...state.toasts, action.toast];
        if (toasts.length > 5) toasts.shift(); // cap at 5
        return { ...state, toasts };
    }
    if (action.type === "dismissToast") return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };

    // ── Map layer runtime state ──────────────────────────────────
    if (action.type === "mapLayerOrder") {
        return {
            ...state,
            mapLayerState: {
                ...state.mapLayerState,
                [action.mapId]: {
                    ...(state.mapLayerState[action.mapId] ?? {}),
                    order: action.layerIds,
                },
            },
        };
    }
    if (action.type === "mapLayerVisibility") {
        const existing = state.mapLayerState[action.mapId] ?? {};
        return {
            ...state,
            mapLayerState: {
                ...state.mapLayerState,
                [action.mapId]: {
                    ...existing,
                    visibility: { ...(existing.visibility ?? {}), [action.layerId]: action.visible },
                },
            },
        };
    }
    if (action.type === "mapLayerOpacity") {
        const existing = state.mapLayerState[action.mapId] ?? {};
        return {
            ...state,
            mapLayerState: {
                ...state.mapLayerState,
                [action.mapId]: {
                    ...existing,
                    opacity: { ...(existing.opacity ?? {}), [action.layerId]: Math.max(0, Math.min(1, Number.isFinite(action.opacity) ? action.opacity : 1)) },
                },
            },
        };
    }
    if (action.type === "mapLayerLabels") {
        const existing = state.mapLayerState[action.mapId] ?? {};
        return {
            ...state,
            mapLayerState: {
                ...state.mapLayerState,
                [action.mapId]: {
                    ...existing,
                    labels: { ...(existing.labels ?? {}), [action.layerId]: action.visible },
                },
            },
        };
    }
    if (action.type === "resetMapLayers") {
        const { [action.mapId]: _removed, ...rest } = state.mapLayerState;
        return { ...state, mapLayerState: rest };
    }

    // ── Map toolbar popover state ─────────────────────────────────
    if (action.type === "setMapToolbarPopover") {
        const current = state.mapUiState[action.mapId] ?? {};
        return {
            ...state,
            mapUiState: {
                ...state.mapUiState,
                [action.mapId]: {
                    ...current,
                    toolbarPopover: action.popover,
                },
            },
        };
    }
    if (action.type === "setMapLegendSelection") {
        const current = state.mapUiState[action.mapId] ?? {};
        const legendSelections = { ...(current.legendSelections ?? {}) };
        if (action.keys.length) legendSelections[action.layerId] = Array.from(new Set(action.keys));
        else delete legendSelections[action.layerId];
        return {
            ...state,
            mapUiState: {
                ...state.mapUiState,
                [action.mapId]: { ...current, legendSelections },
            },
        };
    }
    if (action.type === "setMapLegendHover") {
        const current = state.mapUiState[action.mapId] ?? {};
        return {
            ...state,
            mapUiState: {
                ...state.mapUiState,
                [action.mapId]: {
                    ...current,
                    legendHoveredFeatureKeys: Array.from(new Set(action.featureKeys)),
                },
            },
        };
    }
    if (action.type === "setMapQuickFilter") {
        const current = state.mapUiState[action.mapId] ?? {};
        const quickFilterValues = { ...(current.quickFilterValues ?? {}) };
        if (action.value === undefined || action.value === "") delete quickFilterValues[action.filterId];
        else quickFilterValues[action.filterId] = action.value;
        return {
            ...state,
            mapUiState: {
                ...state.mapUiState,
                [action.mapId]: { ...current, quickFilterValues },
            },
        };
    }
    if (action.type === "clearMapQuickFilters") {
        const current = state.mapUiState[action.mapId] ?? {};
        return {
            ...state,
            mapUiState: {
                ...state.mapUiState,
                [action.mapId]: { ...current, quickFilterValues: {}, filterToSelected: false },
            },
        };
    }
    if (action.type === "setMapFilterToSelected") {
        const current = state.mapUiState[action.mapId] ?? {};
        return {
            ...state,
            mapUiState: {
                ...state.mapUiState,
                [action.mapId]: { ...current, filterToSelected: action.value },
            },
        };
    }

    // Default: clearFilters fallback (shouldn't normally reach here)
    return { ...state, filters: [], search: "", values: {}, tableSearch: {}, selectedRows: [], selectedRowKeys: [], componentSelectedRows: {}, componentSelectedRowKeys: {}, componentSelectionScopes: {}, componentSelectionModes: {}, componentSelectionTargets: {}, interactionFilters: [], interactionSignatures: {}, selectedMapFeature: undefined };
}
