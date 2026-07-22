import { CalculationSpecification, ExpressionNode } from "../calculations/calculationTypes";
import type { Primitive } from "../data/normalizeData";
import type { EChartsInitOpts, SetOptionOpts } from "echarts/core";
import type { ComponentInteractionDefinition } from "../interactions/interactionTypes";
import type {
    AppShellConfig, UiVariant, UiSize, IconName, UiAction, UiIntent, TooltipDefinition,
    MenuItem, AppActionItem,
    ListGroupItem, DataGridItem, TrackingStage,
} from "./uiSchema";
import type {
    MapViewDefinition, MapBasemapDefinition, MapLayerDefinition, MapSearchDefinition, MapLegendDefinition, MapLayerGroupDefinition, MapViewBookmarkDefinition,
} from "./mapSchema";
import type { SvgDataContextDefinition, SvgElementDefinition, SvgMotionOptions, SvgPerformanceOptions } from "../components/svg/svgTypes";

// Re-export map types
export type { MapViewDefinition, MapBasemapDefinition, MapLayerDefinition, MapSearchDefinition, MapLegendDefinition, MapLayerGroupDefinition, MapViewBookmarkDefinition };

export type ThemeMode = "light" | "dark" | "auto";
export type Density = "compact" | "normal" | "spacious";
export type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in" | "between";
export type ChartType = "barChart" | "horizontalBarChart" | "lineChart" | "areaChart" | "pieChart" | "donutChart" | "scatterChart" | "gauge" | "heatmap" | "comboChart" | "waterfallChart" | "sankeyChart" | "treemapChart" | "funnelChart" | "radarChart" | "advancedChart";
export type OverlayPlacement = "top-start" | "top" | "top-end" | "right-start" | "right" | "right-end" | "bottom-start" | "bottom" | "bottom-end" | "left-start" | "left" | "left-end";
export type ResponsiveBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";
export type ComponentHeightMode = "auto" | "fixed" | "fill" | "aspectRatio";

export interface ResponsiveComponentRule {
    /** Grid span at this breakpoint. */
    span?: number;
    /** Visual order at this breakpoint. Lower values render first. */
    order?: number;
    /** Prefer visible over hidden when authoring new specifications. */
    visible?: boolean;
    /** Explicit inverse visibility rule. */
    hidden?: boolean;
    /** Layout direction for flex and split containers. */
    direction?: "row" | "column";
    /** Stack layout children and suppress split handles at this breakpoint. */
    stack?: boolean;
    /** Grid column count for a layout container at this breakpoint. */
    columns?: number;
}

export type ResponsiveComponentDefinition = Partial<Record<ResponsiveBreakpoint, ResponsiveComponentRule>>;

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
    /** Logical dataset. Omitted components use the base Power BI data view. */
    dataset?: string;
    id?: string;
    title?: string;
    subtitle?: string;
    span?: number;
    order?: number;
    /** Mobile-first, container-relative layout overrides. */
    responsive?: ResponsiveComponentDefinition;
    /** Shared sizing contract. Component-specific fixed height properties remain supported. */
    heightMode?: ComponentHeightMode;
    minHeight?: number;
    aspectRatio?: number;
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
    /** Split-pane percentages. Values are normalized when they do not total 100. */
    sizes?: number[];
    /** Minimum pane percentages, aligned with children. */
    minSizes?: number[];
    /** Maximum pane percentages, aligned with children. */
    maxSizes?: number[];
    /** Opt in to pointer and keyboard split handles. */
    resizable?: boolean;
    /** Persist viewer-adjusted sizes. Defaults to local when resizable is enabled. */
    persist?: "none" | "session" | "local";
    /** Optional stable persistence namespace. The component ID is the fallback. */
    storageKey?: string;
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
    buttons?: Array<{ id: string; label: string; value?: unknown }>;
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

export interface BaseChartComponent extends ComponentBase {
    height?: number;
    maxDataRows?: number;
    initOptions?: EChartsInitOpts;
    setOption?: SetOptionOpts;
    options?: Record<string, unknown>;
    events?: ChartEventsDefinition;
    drill?: ChartDrillDefinition;
}

export interface ChartEventDefinition {
    enabled?: boolean;
    /** Optional event-specific interaction override. */
    interaction?: ComponentInteractionDefinition;
    /** Restrict linked internal highlighting/filtering to these component IDs. */
    targets?: string[];
    /** Event payload field. Falls back to the adapter binding field. */
    field?: string;
}

export interface ChartEventsDefinition {
    /** Persist the current ECharts data-zoom window and optionally link it. */
    zoom?: ChartEventDefinition;
    /** Convert the visible zoom window into a row range selection. */
    rangeSelect?: ChartEventDefinition;
    /** Convert ECharts rectangle/polygon brush selections into source rows. */
    brush?: ChartEventDefinition;
}

export interface ChartDrillLevelDefinition {
    id: string;
    label?: string;
    /** Preloaded logical dataset for this resolution. */
    dataset: string;
    category?: string;
    measure?: string;
    x?: string;
    y?: string;
    pointSize?: string;
    /** Field on this level's dataset that links it to the selected parent value. */
    parentField?: string;
}

export interface ChartDrillDefinition {
    levels: ChartDrillLevelDefinition[];
    initialLevel?: string;
    trigger?: "click" | "doubleClick";
    showBreadcrumbs?: boolean;
}

export interface CategoryChartComponent extends BaseChartComponent {
    type: "barChart" | "horizontalBarChart" | "lineChart" | "areaChart" | "pieChart" | "donutChart" | "heatmap";
    category?: string;
    measure?: string;
    aggregation?: MetricDefinition["aggregation"];
}

export interface ScatterChartComponent extends BaseChartComponent {
    type: "scatterChart";
    x?: string;
    y?: string;
    pointSize?: string;
}

export interface GaugeChartComponent extends BaseChartComponent {
    type: "gauge";
    measure?: string;
    aggregation?: MetricDefinition["aggregation"];
}

export interface AdvancedChartComponent extends BaseChartComponent {
    type: "advancedChart";
    category?: string;
    measure?: string;
    aggregation?: MetricDefinition["aggregation"];
    x?: string;
    y?: string;
    pointSize?: string;
}

export interface ComboChartSeries {
    field: string;
    label?: string;
    chartType: "bar" | "line";
    aggregation?: MetricDefinition["aggregation"];
    axis?: "left" | "right";
    format?: string;
}

export interface ComboChartComponent extends BaseChartComponent {
    type: "comboChart";
    category: string;
    series: ComboChartSeries[];
}

export interface WaterfallChartComponent extends BaseChartComponent {
    type: "waterfallChart";
    category: string;
    measure: string;
    aggregation?: MetricDefinition["aggregation"];
    showStart?: boolean;
    showEnd?: boolean;
    positiveIntent?: UiIntent;
    negativeIntent?: UiIntent;
    totalIntent?: UiIntent;
}

export interface SankeyChartComponent extends BaseChartComponent {
    type: "sankeyChart";
    sourceField: string;
    targetField: string;
    valueField?: string;
    aggregation?: MetricDefinition["aggregation"];
    orientation?: "horizontal" | "vertical";
    nodeAlign?: "left" | "right" | "justify";
}

export interface TreemapChartComponent extends BaseChartComponent {
    type: "treemapChart";
    pathFields: string[];
    valueField: string;
    aggregation?: MetricDefinition["aggregation"];
    labelField?: string;
    maxDepth?: number;
}

export interface FunnelChartComponent extends BaseChartComponent {
    type: "funnelChart";
    category: string;
    measure: string;
    aggregation?: MetricDefinition["aggregation"];
    sort?: "ascending" | "descending" | "none";
    gap?: number;
}

export interface RadarIndicatorDefinition {
    field: string;
    label?: string;
    min?: number;
    max: number;
    aggregation?: MetricDefinition["aggregation"];
}

export interface RadarChartComponent extends BaseChartComponent {
    type: "radarChart";
    groupField?: string;
    indicators: RadarIndicatorDefinition[];
}

export type ChartComponent = CategoryChartComponent | ScatterChartComponent | GaugeChartComponent | ComboChartComponent | WaterfallChartComponent | SankeyChartComponent | TreemapChartComponent | FunnelChartComponent | RadarChartComponent | AdvancedChartComponent;

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
    columns?: Array<string | TableColumn>;
    pagination?: boolean;
    pageSize?: number;
    search?: boolean;
    resizableColumns?: boolean;
    maxRows?: number;
    stickyHeader?: boolean;
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
    export?: {
        enabled?: boolean;
        formats?: Array<"csv" | "xlsx">;
        /** selectedOrFiltered exports highlighted/selected rows when present, otherwise filtered rows. */
        scope?: "filtered" | "selected" | "selectedOrFiltered";
        fileName?: string;
    };
    virtualization?: {
        enabled?: boolean;
        threshold?: number;
        rowHeight?: number;
        overscan?: number;
    };
}

export interface MatrixComponent extends ComponentBase {
    type: "matrix";
    rows: string[];
    columns?: string[];
    values: Array<{ field?: string; title?: string; aggregation?: MetricDefinition["aggregation"]; format?: string; where?: { field: string; equals: Primitive } }>;
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
    layerGroups?: MapLayerGroupDefinition[];
    bookmarks?: MapViewBookmarkDefinition[];
    search?: MapSearchDefinition;
    legend?: MapLegendDefinition;
    featureDetails?: import("./mapSchema").MapFeatureDetailsDefinition;

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
        bookmarks?: boolean;
        rectangleSelection?: boolean;
        lassoSelection?: boolean;
    };

    tools?: {
        rectangleSelection?: boolean | { enabled?: boolean; selectionMode?: SelectionMode };
        lassoSelection?: boolean | { enabled?: boolean; selectionMode?: SelectionMode; minimumPoints?: number };
    };

    /** Fixed height used when heightMode is omitted or fixed. */
    height?: number;
    heightMode?: ComponentHeightMode;
    minHeight?: number;
    aspectRatio?: number;
}

export interface ContentComponent extends ComponentBase {
    type: "html" | "text" | "markdown" | "custom";
    html?: string;
    text?: string;
    repeat?: { source: "rows"; as?: "row"; limit?: number; template: string; distinctBy?: string; sortBy?: string; sortDirection?: "asc" | "desc" };
}

export interface TabsComponent extends ComponentBase {
    type: "tabs";
    tabs: Array<{ id: string; title: string; children?: DashboardComponent[] }>;
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
    id: string;
    trigger?: { label?: string; icon?: IconName; ariaLabel?: string; variant?: UiVariant; };
    items: MenuItem[];
    placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
    closeOnSelect?: boolean;
}

export interface ModalComponent extends ComponentBase {
    type: "modal";
    id: string;
    children?: DashboardComponent[];
    size?: "sm" | "md" | "lg";
    backdropClose?: boolean;
    footer?: DashboardComponent[];
}

export interface OffcanvasComponent extends ComponentBase {
    type: "offcanvas";
    id: string;
    children?: DashboardComponent[];
    position?: "left" | "right";
    width?: number;
    openWhen?: "always" | "selectedRow" | "state";
    stateKey?: string;
    defaultOpen?: boolean;
    backdrop?: boolean;
    backdropClose?: boolean;
}

export interface PopoverComponent extends ComponentBase {
    type: "popover";
    id: string;
    children: DashboardComponent[];
    trigger: { label?: string; icon?: IconName; ariaLabel?: string; variant?: UiVariant; };
    placement?: OverlayPlacement;
    width?: number;
    closeOnOutsideClick?: boolean;
    closeOnEscape?: boolean;
    showArrow?: boolean;
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

export interface SvgComponent extends ComponentBase {
    type: "svg";
    viewBox: string;
    width?: number | string;
    height?: number | string;
    preserveAspectRatio?: string;
    role?: "img" | "group";
    description?: string;
    elements: SvgElementDefinition[];
    dataContext?: SvgDataContextDefinition;
    motion?: SvgMotionOptions;
    performance?: SvgPerformanceOptions;
}

export interface SvgMarkupComponent extends ComponentBase {
    type: "svgMarkup";
    viewBox?: string;
    width?: number | string;
    height?: number | string;
    preserveAspectRatio?: string;
    role?: "img" | "group";
    description?: string;
    svg: string;
    dataContext?: SvgDataContextDefinition;
    motion?: SvgMotionOptions;
    performance?: SvgPerformanceOptions;
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
    | AvatarGroupComponent
    | SvgComponent
    | SvgMarkupComponent;

export interface HyperPbiSchema {
    version: "2.0";
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
    /** Version 2 authoring structures are retained for round-tripping and compiled before rendering. */
    data?: { datasets?: Record<string, import("../data/datasets").DatasetDefinition> };
    definitions?: Record<string, Record<string, unknown>>;
}
