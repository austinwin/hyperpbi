import powerbi from "powerbi-visuals-api";

export interface PersistedVisualState { specification: string; configuration: string; studioLayout?: string; }

export function readVisualState(dataView?: powerbi.DataView): Partial<PersistedVisualState> {
    const state = dataView?.metadata?.objects?.hyperpbiState;
    return {
        specification: typeof state?.specification === "string" ? state.specification : undefined,
        configuration: typeof state?.configuration === "string" ? state.configuration : undefined,
        studioLayout: typeof state?.studioLayout === "string" ? state.studioLayout : undefined
    };
}

export function persistVisualState(host: powerbi.extensibility.visual.IVisualHost, state: PersistedVisualState): void {
    host.persistProperties({ merge: [{ objectName: "hyperpbiState", selector: null as unknown as powerbi.data.Selector, properties: { specification: state.specification, configuration: state.configuration, studioLayout: state.studioLayout ?? "" } }] });
}

export function buildTableSelectionIds(host: powerbi.extensibility.visual.IVisualHost, dataView?: powerbi.DataView): powerbi.visuals.ISelectionId[] {
    const table = dataView?.table; if (!table) return [];
    return (table.rows ?? []).map((_row, index) => host.createSelectionIdBuilder().withTable(table, index).createSelectionId());
}
