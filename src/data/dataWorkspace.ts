import type { NormalizedData } from "./normalizeData";

export type DataSourceKind = "powerbi" | "csv" | "xlsx-sheet";

export interface DataSource {
    id: string;
    name: string;
    kind: DataSourceKind;
    fileName?: string;
    sheetName?: string;
    data: NormalizedData;
}

export interface DataWorkspace {
    defaultSourceId: string;
    sources: Record<string, DataSource>;
}

export function createEmptyNormalizedData(): NormalizedData {
    return {
        fields: {},
        rows: [],
        rowKeys: [],
        aggregates: {
            count: 0,
            sum: {},
            avg: {},
            min: {},
            max: {},
            distinctCount: {},
            first: {}
        },
        map: {
            hasGeometry: false,
            hasLatLon: false,
            hasXY: false,
            hasAddress: false,
            mode: "none",
            bindings: { tooltip: [], details: [] },
            layers: [],
            warnings: [],
            invalidFeatureCount: 0
        }
    };
}

export function createEmptyDataWorkspace(): DataWorkspace {
    return { defaultSourceId: "", sources: {} };
}

export function createPowerBiDataWorkspace(data: NormalizedData): DataWorkspace {
    return {
        defaultSourceId: "powerbi",
        sources: {
            powerbi: { id: "powerbi", name: "Power BI", kind: "powerbi", data }
        }
    };
}

/** Resolves the stable browser source id or the portable `powerbi` alias. */
export function resolveDataSource(
    workspace: DataWorkspace,
    sourceId: string
): DataSource | undefined {
    if (sourceId === "powerbi") return workspace.sources[workspace.defaultSourceId];
    return workspace.sources[sourceId];
}

/** Source data supplied to the shared logical-dataset pipeline, excluding its alias. */
export function workspaceSourceData(
    workspace: DataWorkspace
): Record<string, NormalizedData> {
    return Object.fromEntries(
        Object.entries(workspace.sources).map(([id, source]) => [id, source.data])
    );
}

export function defaultWorkspaceData(workspace: DataWorkspace): NormalizedData {
    return resolveDataSource(workspace, "powerbi")?.data ?? createEmptyNormalizedData();
}

export function withDefaultSource(
    workspace: DataWorkspace,
    defaultSourceId: string
): DataWorkspace {
    if (!workspace.sources[defaultSourceId]) {
        throw new Error(`Data source “${defaultSourceId}” does not exist.`);
    }
    return { ...workspace, defaultSourceId };
}

export function validateDataWorkspace(workspace: DataWorkspace): string[] {
    const errors: string[] = [];
    const ids = Object.keys(workspace.sources);
    if (ids.length && !workspace.sources[workspace.defaultSourceId]) {
        errors.push("The default data source does not exist.");
    }
    for (const [id, source] of Object.entries(workspace.sources)) {
        if (id !== source.id) errors.push(`Data source key “${id}” does not match its id.`);
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) {
            errors.push(`Data source id “${id}” is invalid.`);
        }
        if (!source.name.trim()) errors.push(`Data source “${id}” has no name.`);
        if (source.data.rows.length !== source.data.rowKeys.length) {
            errors.push(`Data source “${id}” has mismatched rows and row keys.`);
        }
        if (new Set(source.data.rowKeys).size !== source.data.rowKeys.length) {
            errors.push(`Data source “${id}” has duplicate row keys.`);
        }
    }
    return errors;
}
