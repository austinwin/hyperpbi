import { CalculationSpecification, ExpressionNode } from "../calculations/calculationTypes";
import type { EChartsInitOpts, SetOptionOpts } from "echarts/core";
import type { ComponentInteractionDefinition } from "../interactions/interactionTypes";
import type {
    AppShellConfig, UiVariant, UiSize, IconName, UiAction, UiIntent, TooltipDefinition,
    MenuItem, AppActionItem,
    ListGroupItem, DataGridItem, TrackingStage,
} from "./uiSchema";
import type {
    MapViewDefinition, MapBasemapDefinition, MapLayerDefinition, MapSearchDefinition, MapLegendDefinition,
} from "./mapSchema";

// Re-export map types
export type { MapViewDefinition, MapBasemapDefinition, MapLayerDefinition, MapSearchDefinition, MapLegendDefinition };

export type ThemeMode = "light" | "dark" | "auto";
export type Density = "compact" | "normal" | "spacious";
export type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in" | "between";
export type ChartType = "barChart" | "horizontalBarChart" | "lineChart" | "areaChart" | "pieChart" | "donutChart" | "scatterChart" | "gauge" | "heatmap" | "advancedChart";

// Re-export UI types for convenience
export type { AppShellConfig, UiVariant, UiSize, IconName, UiAction, UiIntent, TooltipDefinition,
    MenuItem, AppActionItem,
    ListGroupItem, DataGridItem, TrackingStage,
};

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
    subtitle?: string;
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
    interaction?: ComponentInteractionDefinition;
    /** @deprecated Use interaction.internalMode. */
    internal?: boolean;
    /** @deprecated Use interaction.externalMode. */
    external?: boolean;
    // ── New shared properties ──
    ariaLabel?: string;
    icon?: IconName;
    variant?: UiVariant;
    size?: UiSize;
    disabled?: boolean;
    tooltip?: TooltipDefinition;
    uiAction?: UiAction | UiAction[];
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

export type SelectionMode = "replace" | "toggle" | "add";
export interface SafeInteraction { action: "selectRow" | "selectWhere" | "clearSelection" | "setFilter" | "clearFilter" | "setState" | "toggleState" | "openTab" | "toggleCollapse" | "drillToDetail" | "highlight" | "clearHighlight"; where?: ExpressionNode; field?: string; value?: unknown; target?: string; selectionMode?: SelectionMode; internal?: boolean; external?: boolean; externalMode?: "filter" | "selection"; }

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
    // ── New form properties ──
    description?: string;
    helpText?: string;
    errorText?: string;
    required?: boolean;
    orientation?: "vertical" | "horizontal";
    rows?: number;
    maxLength?: number;
    prefixText?: string;
    prefixIcon?: IconName;
    suffixText?: string;
    suffixIcon?: IconName;
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
    selectedRow?: boolean;
    groups?: Array<{ title?: string; fields: Array<string | { field: string; label?: string; badge?: boolean; copyable?: boolean; format?: string }> }>;
    emptyText?: string;
}

export interface ChartComponent extends ComponentBase {
    type: ChartType;
    category?: string;
    measure?: string;
    aggregation?: MetricDefinition["aggregation"];
    x?: string;
    y?: string;
    /** Scatter chart point size field name */
    pointSize?: string;
    height?: number;
    maxDataRows?: number;
    initOptions?: EChartsInitOpts;
    setOption?: SetOptionOpts;
    options?: Record<string, unknown>;
}

export interface SmallMultiplesComponent extends ComponentBase {
    type: "smallMultiples";
    splitField: string;
    chart: ChartComponent;
    maxPanels?: number;
    sharedScale?: boolean;
    height?: number;
}

export interface TableColumn {
    field: string;
    title?: string;
    width?: number;
    format?: string;
    hozAlign?: "left" | "center" | "right";
    conditional?: Array<{ operator: FilterOperator; value: unknown; color?: string; background?: string }>;
    sortable?: boolean;
    resizable?: boolean;
    visible?: boolean;
    wrap?: boolean;
    frozen?: "left" | "right";
    cellType?: "text" | "badge" | "progress";
    intentMap?: Record<string, "neutral" | "primary" | "success" | "warning" | "danger">;
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
    /** @deprecated Use interaction.showSelector. */
    selectable?: boolean;
    /** @deprecated Use interaction.internalMode and interaction.internalScope. */
    selectionMode?: "highlight" | "filter";
    // ── New table properties ──
    density?: "compact" | "normal";
    striped?: boolean;
    hover?: boolean;
    showRowCount?: boolean;
    pageSizeOptions?: number[];
    rowActions?: MenuItem[];
    emptyState?: {
        icon?: IconName;
        title?: string;
        description?: string;
    };
    /** Tabulator is not bundled; this is normalized to native with a warning. */
}

export interface MatrixComponent extends ComponentBase {
    type: "matrix";
    rows: string[];
    columns?: string[];
    values: Array<{ field?: string; title?: string; aggregation?: MetricDefinition["aggregation"]; format?: string }>;
    showTotals?: boolean;
    heatmap?: boolean;
    maxRows?: number;
}

export interface MapComponent extends ComponentBase {
    type: "map";
    engine?: "leaflet";

    // ── New declarative map model ──
    view?: MapViewDefinition;
    basemap?: MapBasemapDefinition;
    layers?: MapLayerDefinition[];
    search?: MapSearchDefinition;
    legend?: MapLegendDefinition;

    layerPanel?: {
        visible?: boolean;
        position?: "left" | "right";
        defaultOpen?: boolean;
        allowViewerReorder?: boolean;
        allowViewerOpacity?: boolean;
        allowViewerLabels?: boolean;
    };

    toolbar?: {
        visible?: boolean;
        home?: boolean;
        layers?: boolean;
        legend?: boolean;
        search?: boolean;
        clearSelection?: boolean;
        zoomToSelection?: boolean;
    };

    // ── Legacy properties (still supported for backward compatibility) ──
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
    repeat?: { source: "rows"; as?: "row"; limit?: number; template: string; distinctBy?: string; sortBy?: string; sortDirection?: "asc" | "desc" };
}

export interface TabsComponent extends ComponentBase {
    type: "tabs";
    tabs: Array<{ id: string; title: string; children?: DashboardComponent[]; components?: DashboardComponent[]; content?: DashboardComponent[] }>;
}

export interface DrawerComponent extends ComponentBase {
    type: "drawer" | "filterDrawer";
    children?: DashboardComponent[];
    position?: "left" | "right";
    width?: number;
    openWhen?: "always" | "selectedRow" | "state";
    stateKey?: string;
    defaultOpen?: boolean;
    collapsible?: boolean;
}

export interface TimelineComponent extends ComponentBase {
    type: "timeline";
    dateField: string;
    titleField: string;
    categoryField?: string;
    statusField?: string;
    descriptionField?: string;
    sortDirection?: "asc" | "desc";
    limit?: number;
}

// ── New component types (defined here, not in uiSchema, to extend ComponentBase) ──

export interface CardComponent extends ComponentBase {
    type: "card";
    children?: DashboardComponent[];
    padding?: "none" | "compact" | "normal";
    header?: { title?: string; subtitle?: string; icon?: IconName; };
    actions?: AppActionItem[];
    footer?: DashboardComponent[];
    status?: { intent?: UiIntent; position?: "top" | "left"; };
    collapsible?: boolean;
    defaultCollapsed?: boolean;
}

export interface DropdownComponent extends ComponentBase {
    type: "dropdown";
    trigger?: { label?: string; icon?: IconName; variant?: UiVariant; };
    items: MenuItem[];
    placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
    closeOnSelect?: boolean;
}

export interface ModalComponent extends ComponentBase {
    type: "modal";
    children?: DashboardComponent[];
    size?: "sm" | "md" | "lg";
    backdropClose?: boolean;
    footer?: DashboardComponent[];
}

export interface OffcanvasComponent extends ComponentBase {
    type: "offcanvas";
    children?: DashboardComponent[];
    position?: "left" | "right";
    width?: number;
    openWhen?: "always" | "selectedRow" | "state";
    stateKey?: string;
    defaultOpen?: boolean;
}

export interface PopoverComponent extends ComponentBase {
    type: "popover";
    children?: DashboardComponent[];
    trigger?: { label?: string; icon?: IconName; };
    placement?: string;
}

export interface ListGroupComponent extends ComponentBase {
    type: "listGroup";
    items?: ListGroupItem[];
    source?: "rows";
    primaryField?: string;
    secondaryField?: string;
    badgeField?: string;
    valueField?: string;
    icon?: IconName;
    maxItems?: number;
    compact?: boolean;
}

export interface DataGridComponent extends ComponentBase {
    type: "dataGrid";
    items?: DataGridItem[];
    source?: "rows";
    columns?: 1 | 2 | 3 | 4;
    selectedRow?: boolean;
}

export interface EmptyStateComponent extends ComponentBase {
    type: "emptyState";
    icon?: IconName;
    title?: string;
    description?: string;
    primaryAction?: UiAction;
    secondaryAction?: UiAction;
    compact?: boolean;
}

export interface PlaceholderComponent extends ComponentBase {
    type: "placeholder";
    lines?: number;
    /** Skeleton variant: "text", "card", or "table". Use this instead of ComponentBase.variant which is for UI intent. */
    placeholderVariant?: "text" | "card" | "table";
}

export interface SpinnerComponent extends ComponentBase {
    type: "spinner";
    label?: string;
    inline?: boolean;
}

export interface CountUpComponent extends ComponentBase {
    type: "countUp";
    field?: string;
    aggregation?: "sum" | "avg" | "min" | "max" | "count" | "distinctCount";
    value?: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    format?: string;
}

export interface TrackingComponent extends ComponentBase {
    type: "tracking";
    stages: TrackingStage[];
    activeStage?: string;
    stageField?: string;
    orientation?: "horizontal" | "vertical";
    compact?: boolean;
}

export interface AccordionComponent extends ComponentBase {
    type: "accordion";
    multiple?: boolean;
    defaultOpenItems?: string[];
    children?: DashboardComponent[];
    items: Array<{
        id: string;
        title: string;
        subtitle?: string;
        icon?: IconName;
        disabled?: boolean;
        children: DashboardComponent[];
    }>;
}

export interface StepsComponent extends ComponentBase {
    type: "steps";
    orientation?: "horizontal" | "vertical";
    activeStep?: string;
    stateKey?: string;
    clickable?: boolean;
    items: Array<{
        id: string;
        label: string;
        description?: string;
        icon?: IconName;
        disabled?: boolean;
    }>;
}

export interface IconComponent extends ComponentBase {
    type: "icon";
    icon: IconName;
    size?: UiSize;
}

export interface IconButtonComponent extends ComponentBase {
    type: "iconButton";
    icon: IconName;
    ariaLabel: string;
    variant?: UiVariant;
    size?: UiSize;
    disabled?: boolean;
    tooltip?: TooltipDefinition;
    uiAction?: UiAction | UiAction[];
}

export interface AvatarComponent extends ComponentBase {
    type: "avatar";
    initials?: string;
    label?: string;
    subtitle?: string;
    size?: UiSize;
    shape?: "circle" | "rounded";
    status?: "online" | "away" | "busy" | "offline";
}

export interface AvatarGroupComponent extends ComponentBase {
    type: "avatarGroup";
    avatars: AvatarComponent[];
    max?: number;
}

export type DashboardComponent =
    | ContainerComponent
    | ControlComponent
    | DataDisplayComponent
    | ChartComponent
    | SmallMultiplesComponent
    | TableComponent
    | MatrixComponent
    | MapComponent
    | ContentComponent
    | TabsComponent
    | DrawerComponent
    | TimelineComponent
    // ── New primitives and overlays ──
    | CardComponent
    | DropdownComponent
    | ModalComponent
    | OffcanvasComponent
    | PopoverComponent
    | ListGroupComponent
    | DataGridComponent
    | EmptyStateComponent
    | PlaceholderComponent
    | SpinnerComponent
    | CountUpComponent
    | TrackingComponent
    | AccordionComponent
    | StepsComponent
    | IconComponent
    | IconButtonComponent
    | AvatarComponent
    | AvatarGroupComponent;

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
    /** Application shell config — rendered by HyperPbiRoot at the root level */
    app?: AppShellConfig;
    leftPanel?: DashboardComponent[];
    rightPanel?: DashboardComponent[];
    toolbar?: DashboardComponent[];
    components: DashboardComponent[];
    css?: string;
    styles?: HyperPbiStyleSystem;
    calculations?: CalculationSpecification;
}
