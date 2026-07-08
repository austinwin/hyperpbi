import { DashboardState } from "./stateStore";

export function selectedSourceRowIndex(
    state: DashboardState,
    sourceRowKeys: string[] = []
): number | undefined {
    const indexByKey = new Map(
        sourceRowKeys.map(
            (key, index) => [key, index] as const
        )
    );

    const selectedKey =
        state.selectedRowKeys[0] ??
        Object.values(
            state.componentSelectedRowKeys
        ).find(keys => keys.length)?.[0];

    if (selectedKey) {
        return indexByKey.get(selectedKey);
    }

    return state.selectedMapFeature;
}

