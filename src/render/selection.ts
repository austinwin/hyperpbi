import { DashboardState } from "./stateStore";

export function selectedSourceRowIndex(state: DashboardState): number | undefined {
    if (state.selectedRows.length) return state.selectedRows[0];
    for (const rows of Object.values(state.componentSelectedRows)) if (rows.length) return rows[0];
    return state.selectedMapFeature;
}

