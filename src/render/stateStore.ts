import { ActiveFilter } from "../data/filtering";
import type { InternalInteractionFilter } from "../interactions/interactionTypes";

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
    interactionFilters: InternalInteractionFilter[];
    interactionSignatures: Record<string, string>;
    selectedMapFeature?: number;
    tableSearch: Record<string, string>;
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
    | { type: "interactionFilter"; filter: InternalInteractionFilter }
    | { type: "clearInteractionFilter"; id: string }
    | { type: "interactionSignature"; id: string; value?: string }
    | { type: "resetInteractions" }
    | { type: "reconcileRowKeys"; rowKeys: string[] }
    | { type: "selectMap"; index?: number }
    | { type: "tableSearch"; id: string; value: string }
    | { type: "clearFilters" };

export function initialDashboardState(search = "", activeTab = ""): DashboardState {
    return { search, activeTabs: activeTab ? { mainTabs: activeTab } : {}, collapsed: {}, filters: [], values: {}, selectedRows: [], selectedRowKeys: [], componentSelectedRows: {}, componentSelectedRowKeys: {}, componentSelectionScopes: {}, componentSelectionModes: {}, interactionFilters: [], interactionSignatures: {}, tableSearch: {} };
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
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
    if (action.type === "interactionFilter") return { ...state, interactionFilters: [...state.interactionFilters.filter(filter => filter.originComponentId !== action.filter.originComponentId), action.filter] };
    if (action.type === "clearInteractionFilter") return { ...state, interactionFilters: state.interactionFilters.filter(filter => filter.originComponentId !== action.id) };
    if (action.type === "interactionSignature") { const interactionSignatures = { ...state.interactionSignatures }; if (action.value === undefined) delete interactionSignatures[action.id]; else interactionSignatures[action.id] = action.value; return { ...state, interactionSignatures }; }
    if (action.type === "resetInteractions") return { ...state, selectedRows: [], selectedRowKeys: [], componentSelectedRows: {}, componentSelectedRowKeys: {}, componentSelectionScopes: {}, componentSelectionModes: {}, interactionFilters: [], interactionSignatures: {}, selectedMapFeature: undefined };
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
    if (action.type === "tableSearch") return { ...state, tableSearch: { ...state.tableSearch, [action.id]: action.value } };
    return { ...state, filters: [], search: "", values: {}, tableSearch: {}, selectedRows: [], selectedRowKeys: [], componentSelectedRows: {}, componentSelectedRowKeys: {}, componentSelectionScopes: {}, componentSelectionModes: {}, interactionFilters: [], interactionSignatures: {}, selectedMapFeature: undefined };
}
