import { ActiveFilter } from "../data/filtering";

export interface DashboardState {
    search: string;
    activeTabs: Record<string, string>;
    collapsed: Record<string, boolean>;
    filters: ActiveFilter[];
    values: Record<string, unknown>;
    selectedRows: number[];
    componentSelectedRows: Record<string, number[]>;
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
    | { type: "selectComponentRows"; id: string; rows: number[] }
    | { type: "selectMap"; index?: number }
    | { type: "tableSearch"; id: string; value: string }
    | { type: "clearFilters" };

export function initialDashboardState(search = "", activeTab = ""): DashboardState {
    return { search, activeTabs: activeTab ? { mainTabs: activeTab } : {}, collapsed: {}, filters: [], values: {}, selectedRows: [], componentSelectedRows: {}, tableSearch: {} };
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    if (action.type === "search") return { ...state, search: action.value };
    if (action.type === "tab") return { ...state, activeTabs: { ...state.activeTabs, [action.id]: action.value } };
    if (action.type === "collapse") return { ...state, collapsed: { ...state.collapsed, [action.id]: action.value ?? !state.collapsed[action.id] } };
    if (action.type === "filter") return { ...state, filters: [...state.filters.filter(item => item.id !== action.filter.id), action.filter] };
    if (action.type === "removeFilter") return { ...state, filters: state.filters.filter(item => item.id !== action.id) };
    if (action.type === "value") return { ...state, values: { ...state.values, [action.id]: action.value } };
    if (action.type === "selectRows") return { ...state, selectedRows: action.rows };
    if (action.type === "selectComponentRows") return { ...state, componentSelectedRows: { ...state.componentSelectedRows, [action.id]: action.rows } };
    if (action.type === "selectMap") return { ...state, selectedMapFeature: action.index };
    if (action.type === "tableSearch") return { ...state, tableSearch: { ...state.tableSearch, [action.id]: action.value } };
    return { ...state, filters: [], search: "", values: {}, tableSearch: {} };
}
