import powerbi from "powerbi-visuals-api";

export interface PersistedVisualState { specification: string; configuration: string; studioLayout?: string; }

export interface RowSelectionData {
    selectionIds: Array<powerbi.visuals.ISelectionId | undefined>;
    rowKeys: string[];
}

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

export function buildRowSelectionData(
    host: powerbi.extensibility.visual.IVisualHost,
    dataView?: powerbi.DataView
): RowSelectionData {
    const table = dataView?.table;
    if (table?.rows?.length) {
        const selectionIds = (table.rows ?? []).map((_row, index) => {
            try {
                return host.createSelectionIdBuilder().withTable(table, index).createSelectionId();
            } catch {
                return undefined;
            }
        });
        const rowKeys = selectionIds.map((id, index) =>
            id ? id.getKey() ?? `table-row:${index}` : `table-row:${index}`
        );
        return { selectionIds, rowKeys };
    }

    const categorical = dataView?.categorical;
    if (categorical) {
        const categories = categorical.categories ?? [];
        const categoryCount = categories.length;
        const rowCount = Math.max(
            0,
            ...categories.map(cat => cat.values.length),
            ...(categorical.values ? Array.from(categorical.values).map(v => v.values.length) : [])
        );

        const selectionIds: Array<powerbi.visuals.ISelectionId | undefined> = [];
        const rowKeys: string[] = [];

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            try {
                let builder = host.createSelectionIdBuilder();
                let hasIdentity = false;

                for (let catIndex = 0; catIndex < categoryCount; catIndex++) {
                    const category = categories[catIndex];
                    if (category && rowIndex < category.values.length) {
                        const identity = category.identity?.[rowIndex];
                        if (identity) {
                            builder = builder.withCategory(category, rowIndex);
                            hasIdentity = true;
                        }
                    }
                }

                if (hasIdentity) {
                    const id = builder.createSelectionId();
                    selectionIds.push(id);
                    rowKeys.push(id.getKey() ?? `cat-row:${rowIndex}`);
                } else {
                    selectionIds.push(undefined);
                    rowKeys.push(`cat-row:${rowIndex}`);
                }
            } catch {
                selectionIds.push(undefined);
                rowKeys.push(`cat-row:${rowIndex}`);
            }
        }

        return { selectionIds, rowKeys };
    }

    return { selectionIds: [], rowKeys: [] };
}

/** @deprecated Use buildRowSelectionData instead. */
export function buildTableSelectionIds(host: powerbi.extensibility.visual.IVisualHost, dataView?: powerbi.DataView): powerbi.visuals.ISelectionId[] {
    const result = buildRowSelectionData(host, dataView);
    return result.selectionIds.filter((id): id is powerbi.visuals.ISelectionId => id !== undefined);
}
