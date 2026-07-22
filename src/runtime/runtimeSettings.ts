export interface RuntimeSettings {
    schemaJson: string;
    useSchemaField: boolean;
    validationMode: string;
    showExample: boolean;
    enableHtml: boolean;
    customCss: string;
    showWarnings: boolean;
    allowInlineSvg: boolean;
    allowSafeImages: boolean;
    theme: {
        mode: string;
        primary: string;
        accent: string;
        surface: string;
        text: string;
        border: string;
        danger: string;
        warning: string;
        success: string;
        fontFamily: string;
        baseFontSize: number;
        radius: number;
        shadow: number;
    };
    layout: {
        density: string;
        gap: number;
        cardPadding: number;
        leftPanelWidth: number;
        headerHeight: number;
        internalScrolling: boolean;
        stickyToolbar: boolean;
    };
    table: {
        maxRows: number;
        rowHeight: number;
        stickyHeader: boolean;
        pagination: boolean;
        columnResize: boolean;
        search: boolean;
    };
    map: {
        enabled: boolean;
        center: [number, number];
        zoom: number;
        tileUrl: string;
        allowExternalTiles: boolean;
        clusterPoints: boolean;
    };
    debug: {
        showFieldDictionary: boolean;
        showSchemaErrors: boolean;
        showDataSample: boolean;
        showPerformance: boolean;
    };
    editor: {
        previewPosition: string;
        fontSize: number;
        wordWrap: boolean;
        showDataPane: boolean;
        showLogPane: boolean;
    };
    enableInteractions: boolean;
}

/** Host-neutral defaults used by the browser runtime and as the Power BI adapter baseline. */
export type RuntimeSettingsOverrides = Partial<Omit<RuntimeSettings, "theme" | "layout" | "table" | "map" | "debug" | "editor">> & {
    theme?: Partial<RuntimeSettings["theme"]>;
    layout?: Partial<RuntimeSettings["layout"]>;
    table?: Partial<RuntimeSettings["table"]>;
    map?: Partial<RuntimeSettings["map"]>;
    debug?: Partial<RuntimeSettings["debug"]>;
    editor?: Partial<RuntimeSettings["editor"]>;
};

export function createRuntimeSettings(
    overrides: RuntimeSettingsOverrides = {}
): RuntimeSettings {
    const base: RuntimeSettings = {
        schemaJson: "",
        useSchemaField: false,
        validationMode: "strict",
        showExample: true,
        enableHtml: true,
        customCss: "",
        showWarnings: true,
        allowInlineSvg: false,
        allowSafeImages: false,
        theme: {
            mode: "light",
            primary: "#206bc4",
            accent: "#4299e1",
            surface: "#ffffff",
            text: "#182433",
            border: "#dce1e7",
            danger: "#d63939",
            warning: "#f59f00",
            success: "#2fb344",
            fontFamily: "Inter, Segoe UI, sans-serif",
            baseFontSize: 12,
            radius: 8,
            shadow: 1
        },
        layout: {
            density: "compact",
            gap: 8,
            cardPadding: 12,
            leftPanelWidth: 280,
            headerHeight: 44,
            internalScrolling: true,
            stickyToolbar: true
        },
        table: {
            maxRows: 5000,
            rowHeight: 32,
            stickyHeader: true,
            pagination: true,
            columnResize: true,
            search: true
        },
        map: {
            enabled: true,
            center: [0, 0],
            zoom: 2,
            tileUrl: "",
            allowExternalTiles: false,
            clusterPoints: false
        },
        debug: {
            showFieldDictionary: false,
            showSchemaErrors: true,
            showDataSample: false,
            showPerformance: false
        },
        editor: {
            previewPosition: "right",
            fontSize: 13,
            wordWrap: false,
            showDataPane: true,
            showLogPane: true
        },
        enableInteractions: true
    };

    return {
        ...base,
        ...overrides,
        theme: { ...base.theme, ...overrides.theme },
        layout: { ...base.layout, ...overrides.layout },
        table: { ...base.table, ...overrides.table },
        map: { ...base.map, ...overrides.map },
        debug: { ...base.debug, ...overrides.debug },
        editor: { ...base.editor, ...overrides.editor }
    };
}

export const defaultRuntimeSettings = createRuntimeSettings();
