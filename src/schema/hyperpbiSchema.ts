import { CalculationSpecification, ExpressionNode } from "../calculations/calculationTypes";

export type ThemeMode = "light" | "dark" | "auto";
export type Density = "compact" | "normal" | "spacious";
export type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in" | "between";
export type ChartType = "barChart" | "horizontalBarChart" | "lineChart" | "areaChart" | "pieChart" | "donutChart" | "scatterChart" | "gauge" | "heatmap";

export interface HyperPbiTheme {
    mode?: ThemeMode;
    density?: Density;
    fontFamily?: string;
    primaryColor?: string;
    accentColor?: string;
    surfaceColor?: string;
    textColor?: string;
    borderColor?: string;
    dangerColor?: string;
    warningColor?: string;
    successColor?: string;
    radius?: number;
    cardPadding?: number;
    gap?: number;
}

export interface ComponentBase {
    type: string;
    id?: string;
    title?: string;
    span?: number;
    className?: string;
    hidden?: boolean;
    props?: Record<string, unknown>;
    style?: Record<string, string | number>;
    css?: string;
    slots?: Partial<Record<"header" | "subheader" | "body" | "footer" | "actions" | "empty" | "item" | "row" | "cell" | "popup" | "tooltip" | "legend" | "badge", string>>;
    data?: Record<string, unknown>;
    visibility?: Record<string, unknown>;
    interactions?: Record<string, SafeInteraction>;
}

export interface GlobalComponentStyle {
    className?: string;
    style?: Record<string, string | number>;
    css?: string;
}

export interface HyperPbiStyleSystem {
    globalCss?: string;
    components?: Record<string, GlobalComponentStyle>;
}

export interface SafeInteraction { action: "selectRow" | "selectWhere" | "clearSelection" | "setFilter" | "clearFilter" | "setState" | "toggleState" | "openTab" | "toggleCollapse" | "drillToDetail" | "highlight" | "clearHighlight"; where?: ExpressionNode; field?: string; value?: unknown; target?: string; }

export interface ContainerComponent extends ComponentBase {
    children?: DashboardComponent[];
    direction?: "row" | "column";
    columns?: number;
    gap?: number;
    width?: number;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    defaultOpen?: boolean;
}

export interface FilterDefinition { operator: FilterOperator; value?: unknown; }

export interface ControlComponent extends ComponentBase {
    field?: string;
    label?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    multiple?: boolean;
    defaultValue?: unknown;
    options?: Array<string | { label: string; value: unknown }>;
    targets?: string[];
    filter?: FilterDefinition;
    action?: "clearFilters" | "setTab";
    actionValue?: string;
    buttons?: Array<{ id: string; label: string; value?: unknown; action?: string }>;
}

export interface MetricDefinition {
    title: string;
    field?: string;
    aggregation?: "sum" | "avg" | "min" | "max" | "count" | "distinctCount" | "countWhere" | "first";
    where?: { field: string; equals: unknown };
    format?: "currency" | "integer" | "number" | "percent" | string;
    intent?: "neutral" | "primary" | "success" | "warning" | "danger";
    prefix?: string;
    suffix?: string;
    metric?: string;
}

export interface DataDisplayComponent extends ComponentBase {
    field?: string;
    aggregation?: MetricDefinition["aggregation"];
    format?: string;
    intent?: MetricDefinition["intent"];
    metrics?: MetricDefinition[];
    value?: unknown;
    text?: string;
    items?: Array<{ label: string; field?: string; value?: unknown; format?: string }>;
    max?: number;
}

export interface ChartComponent extends ComponentBase {
    type: ChartType;
    category?: string;
    measure?: string;
    aggregation?: MetricDefinition["aggregation"];
    x?: string;
    y?: string;
    size?: string;
    height?: number;
    options?: Record<string, unknown>;
}

export interface TableColumn {
    field: string;
    title?: string;
    width?: number;
    format?: string;
    hozAlign?: "left" | "center" | "right";
    conditional?: Array<{ operator: FilterOperator; value: unknown; color?: string; background?: string }>;
}

export interface TableComponent extends ComponentBase {
    type: "table";
    engine?: "tabulator" | "native";
    columns?: Array<string | TableColumn>;
    pagination?: boolean;
    pageSize?: number;
    search?: boolean;
    resizableColumns?: boolean;
    maxRows?: number;
    stickyHeader?: boolean;
    selectable?: boolean;
    selectionMode?: "highlight" | "filter";
}

export interface MapComponent extends ComponentBase {
    type: "map";
    settings?: {
        fitBounds?: boolean;
        showLayerControl?: boolean;
        showLegend?: boolean;
        clusterPoints?: boolean;
        basemap?: "none" | "tiles";
        enableExternalTiles?: boolean;
        tileUrl?: string;
        coordinateSystem?: "EPSG:4326" | string;
        enableExternalGeocoder?: boolean;
        geocoderProvider?: string;
    };
    style?: {
        defaultPointColor?: string;
        colorMode?: "categorical" | "gradient";
        gradientStart?: string;
        gradientEnd?: string;
        radius?: number;
        minRadius?: number;
        maxRadius?: number;
        lineWeight?: number;
        minLineWeight?: number;
        maxLineWeight?: number;
        fillOpacity?: number;
        opacity?: number;
    };
    popup?: { html?: string };
    height?: number;
}

export interface ContentComponent extends ComponentBase {
    type: "html" | "text" | "markdown" | "custom";
    html?: string;
    text?: string;
    repeat?: { source: "rows"; as?: "row"; limit?: number; template: string };
}

export interface TabsComponent extends ComponentBase {
    type: "tabs";
    tabs: Array<{ id: string; title: string; children?: DashboardComponent[]; components?: DashboardComponent[]; content?: DashboardComponent[] }>;
}

export type DashboardComponent = ContainerComponent | ControlComponent | DataDisplayComponent | ChartComponent | TableComponent | MapComponent | ContentComponent | TabsComponent;

export interface HyperPbiSchema {
    version: "1.0";
    title?: string;
    theme?: HyperPbiTheme;
    layout?: {
        type?: "grid" | "flex" | "split";
        columns?: number;
        gap?: number;
        leftPanel?: { width?: number; collapsible?: boolean; defaultCollapsed?: boolean };
        main?: { type?: "grid" | "flex"; columns?: number; gap?: number };
    };
    state?: { search?: string; activeTab?: string; filters?: Record<string, unknown> };
    leftPanel?: DashboardComponent[];
    rightPanel?: DashboardComponent[];
    toolbar?: DashboardComponent[];
    components: DashboardComponent[];
    css?: string;
    styles?: HyperPbiStyleSystem;
    calculations?: CalculationSpecification;
}
