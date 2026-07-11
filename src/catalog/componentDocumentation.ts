// ── Component Documentation ──────────────────────────────────────────
// Documentation-only metadata for each component.
// Used by the documentation generator to produce Markdown and HTML catalogs.

export interface ComponentDocMeta {
    /** Classification of the current implementation */
    status: "stable" | "compatibility" | "experimental" | "foundation" | "deprecated";
    /** Human-readable status explanation */
    statusNote?: string;
    /** Key properties beyond shared ones */
    keyProperties: string[];
    /** When NOT to use this component */
    doNotUseWhen?: string;
    /** Accessibility notes */
    accessibility?: string;
    /** Compatibility/migration notes */
    compatibility?: string;
    /** Related component types */
    related?: string[];
    /** Whether this component supports uiAction */
    supportsUiAction: boolean;
    /** Whether this component supports data interaction */
    supportsDataInteraction: boolean;
}

export const componentDocs: Record<string, ComponentDocMeta> = {
    // ── Layout ────────────────────────────────────────────────────────
    grid: { status: "stable", keyProperties: ["columns", "gap", "children"], supportsUiAction: false, supportsDataInteraction: false, related: ["flex", "section"] },
    flex: { status: "stable", keyProperties: ["direction", "gap", "children"], supportsUiAction: false, supportsDataInteraction: false, related: ["grid", "toolbar"] },
    split: { status: "stable", keyProperties: ["direction", "gap", "children"], supportsUiAction: false, supportsDataInteraction: false, related: ["leftPanel", "rightPanel"] },
    section: { status: "stable", keyProperties: ["title", "children", "collapsible"], supportsUiAction: false, supportsDataInteraction: false, related: ["card", "collapsible"] },
    toolbar: { status: "stable", keyProperties: ["direction", "gap", "children"], supportsUiAction: false, supportsDataInteraction: false, related: ["flex"] },
    leftPanel: { status: "compatibility", statusNote: "Supported for legacy dashboards. Prefer offcanvas or the root app sidebar for new layouts.", keyProperties: ["width", "collapsible", "children"], supportsUiAction: false, supportsDataInteraction: false, compatibility: "Legacy left-panel rail. Use app.sidebar or an offcanvas component for new dashboards.", related: ["rightPanel", "offcanvas"] },
    rightPanel: { status: "compatibility", statusNote: "Supported for legacy dashboards.", keyProperties: ["width", "collapsible", "children"], supportsUiAction: false, supportsDataInteraction: false, compatibility: "Legacy right-panel rail.", related: ["leftPanel", "offcanvas"] },
    spacer: { status: "stable", keyProperties: [], supportsUiAction: false, supportsDataInteraction: false, doNotUseWhen: "When a gap property on a parent container is sufficient." },
    divider: { status: "stable", keyProperties: [], supportsUiAction: false, supportsDataInteraction: false },

    // ── Controls ──────────────────────────────────────────────────────
    searchBox: { status: "stable", keyProperties: ["field", "placeholder", "filter"], supportsUiAction: false, supportsDataInteraction: true },
    textInput: { status: "stable", keyProperties: ["field", "placeholder", "filter"], supportsUiAction: false, supportsDataInteraction: true },
    numberInput: { status: "stable", keyProperties: ["field", "min", "max", "step", "filter"], supportsUiAction: false, supportsDataInteraction: true },
    slider: { status: "stable", keyProperties: ["field", "min", "max", "step", "filter"], supportsUiAction: false, supportsDataInteraction: true },
    select: { status: "stable", keyProperties: ["field", "options", "filter"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Uses native <select> element." },
    multiSelect: { status: "stable", keyProperties: ["field", "options", "multiple", "filter"], supportsUiAction: false, supportsDataInteraction: true },
    segmentedControl: { status: "stable", keyProperties: ["field", "options"], supportsUiAction: false, supportsDataInteraction: true, related: ["buttonGroup"] },
    toggle: { status: "stable", keyProperties: ["field", "defaultValue"], supportsUiAction: false, supportsDataInteraction: true },
    button: { status: "stable", keyProperties: ["label", "action", "actionValue", "uiAction"], supportsUiAction: true, supportsDataInteraction: true, compatibility: "Legacy action/actionValue normalized to uiAction internally. Prefer uiAction for new specs." },
    buttonGroup: { status: "stable", keyProperties: ["buttons", "defaultValue"], supportsUiAction: true, supportsDataInteraction: true },
    filterChips: { status: "stable", keyProperties: ["targets"], supportsUiAction: false, supportsDataInteraction: true },
    dateRange: { status: "stable", keyProperties: ["field", "defaultValue", "filter"], supportsUiAction: false, supportsDataInteraction: true },

    // ── Navigation ────────────────────────────────────────────────────
    tabs: { status: "stable", keyProperties: ["tabs[].id", "tabs[].title", "tabs[].children"], supportsUiAction: true, supportsDataInteraction: true },
    collapsible: { status: "stable", keyProperties: ["children", "defaultOpen"], supportsUiAction: false, supportsDataInteraction: false, related: ["accordion"] },
    accordion: { status: "stable", keyProperties: ["items[].id", "items[].title", "items[].children", "multiple", "defaultOpenItems"], supportsUiAction: false, supportsDataInteraction: false, accessibility: "Supports arrow-key navigation between headers. Enter/Space toggles. Proper aria-expanded.", compatibility: "Legacy accordion with only children wraps into one item automatically.", related: ["collapsible"] },
    drawer: { status: "compatibility", statusNote: "Supported for legacy dashboards. Prefer offcanvas for new components.", keyProperties: ["children", "position", "width", "openWhen"], supportsUiAction: false, supportsDataInteraction: true, compatibility: "Legacy drawer. Normalized to offcanvas internally. Use offcanvas for new specs.", related: ["offcanvas", "filterDrawer"] },
    filterDrawer: { status: "compatibility", statusNote: "Supported for legacy dashboards. Prefer offcanvas for new components.", keyProperties: ["children", "position", "width", "openWhen"], supportsUiAction: false, supportsDataInteraction: true, compatibility: "Legacy filter drawer. Use offcanvas for new specs.", related: ["drawer", "offcanvas"] },
    steps: { status: "stable", keyProperties: ["items[].id", "items[].label", "orientation", "activeStep", "stateKey", "clickable"], supportsUiAction: true, supportsDataInteraction: false, related: ["tracking"] },
    stepper: { status: "compatibility", statusNote: "Legacy stepper. Prefer steps for new workflows.", keyProperties: ["children", "defaultOpen"], supportsUiAction: false, supportsDataInteraction: false, compatibility: "Legacy stepper rendered as collapsible section. Use steps for real workflow progression.", related: ["steps"] },

    // ── Display ───────────────────────────────────────────────────────
    kpi: { status: "stable", keyProperties: ["field", "aggregation", "format", "intent", "prefix", "suffix"], supportsUiAction: false, supportsDataInteraction: false },
    metricGrid: { status: "stable", keyProperties: ["metrics[].title", "metrics[].field", "metrics[].aggregation", "metrics[].format", "metrics[].intent"], supportsUiAction: false, supportsDataInteraction: false },
    infoCard: { status: "stable", keyProperties: ["field", "text", "intent"], supportsUiAction: false, supportsDataInteraction: false },
    statusBadge: { status: "stable", keyProperties: ["field", "intent", "value"], supportsUiAction: false, supportsDataInteraction: false },
    progressBar: { status: "stable", keyProperties: ["field", "max", "intent"], supportsUiAction: false, supportsDataInteraction: false },
    alert: { status: "stable", keyProperties: ["text", "intent", "field"], supportsUiAction: false, supportsDataInteraction: false },
    statList: { status: "stable", keyProperties: ["items[].label", "items[].field", "items[].format"], supportsUiAction: false, supportsDataInteraction: false },
    detailPanel: { status: "stable", keyProperties: ["selectedRow", "groups", "items"], supportsUiAction: false, supportsDataInteraction: false },
    timeline: { status: "stable", keyProperties: ["dateField", "titleField", "categoryField", "limit"], supportsUiAction: false, supportsDataInteraction: true },

    // ── Primitives ────────────────────────────────────────────────────
    card: { status: "stable", keyProperties: ["header", "children", "footer", "padding", "status", "collapsible", "actions"], supportsUiAction: false, supportsDataInteraction: false, doNotUseWhen: "When a simple section is sufficient.", related: ["section", "collapsible"] },
    icon: { status: "stable", keyProperties: ["icon", "size", "ariaLabel"], supportsUiAction: false, supportsDataInteraction: false, accessibility: "Use ariaLabel when the icon is the only visible content.", doNotUseWhen: "When you need a clickable action — use iconButton instead." },
    iconButton: { status: "stable", keyProperties: ["icon", "ariaLabel", "variant", "size", "disabled", "tooltip", "uiAction"], supportsUiAction: true, supportsDataInteraction: false, accessibility: "ariaLabel is required. Tooltips provide additional context." },
    avatar: { status: "stable", keyProperties: ["initials", "label", "size", "shape", "status"], supportsUiAction: false, supportsDataInteraction: false, doNotUseWhen: "Remote avatar URLs are not supported. Use initials only." },
    avatarGroup: { status: "stable", keyProperties: ["avatars", "max"], supportsUiAction: false, supportsDataInteraction: false },
    listGroup: { status: "stable", keyProperties: ["source", "primaryField", "secondaryField", "badgeField", "items", "maxItems", "compact"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "For a simple plain list without data binding.", related: ["dataGrid"] },
    dataGrid: { status: "stable", keyProperties: ["items", "selectedRow", "columns", "source"], supportsUiAction: false, supportsDataInteraction: false, doNotUseWhen: "For analytical pivot-style comparison — use matrix instead.", related: ["listGroup", "detailPanel"] },
    countUp: { status: "stable", keyProperties: ["field", "aggregation", "value", "prefix", "suffix", "duration", "format"], supportsUiAction: false, supportsDataInteraction: false, accessibility: "Respects prefers-reduced-motion. Animation disabled under reduced motion.", doNotUseWhen: "For static display without animation — use kpi instead." },
    tracking: { status: "stable", keyProperties: ["stages", "activeStage", "stageField", "orientation", "compact"], supportsUiAction: false, supportsDataInteraction: false, related: ["steps"] },
    dropdown: { status: "stable", statusNote: "Root-hosted menu with collision-aware positioning and shared navbar integration.", keyProperties: ["id", "trigger", "items", "placement", "closeOnSelect"], supportsUiAction: true, supportsDataInteraction: true, accessibility: "Menu roles, roving arrow-key focus, Home/End, nested-menu keys, Escape/Tab dismissal, and trigger focus restoration are supported.", doNotUseWhen: "The content is informational or contains form controls; use popover instead." },
    modal: { status: "stable", statusNote: "Root-hosted blocking dialog with stacking, document-level dismissal, and focus containment.", keyProperties: ["id", "title", "children", "footer", "size", "backdropClose", "ariaLabel"], supportsUiAction: true, supportsDataInteraction: false, accessibility: "Initial focus, focus trap, Escape close, labelled dialog semantics, and trigger focus restoration are supported.", doNotUseWhen: "The task does not need to block the dashboard; prefer popover or offcanvas." },
    offcanvas: { status: "stable", statusNote: "Root-hosted responsive side panel shared by legacy drawer components.", keyProperties: ["id", "title", "children", "position", "width", "openWhen", "stateKey", "backdrop"], supportsUiAction: true, supportsDataInteraction: true, accessibility: "Uses dialog semantics, managed focus, Escape/backdrop close, an accessible close button, and internal scrolling.", related: ["drawer", "filterDrawer", "modal"] },
    popover: { status: "stable", statusNote: "Root-hosted rich contextual dialog with nested HyperPBI components.", keyProperties: ["id", "trigger", "children", "placement", "width", "showArrow"], supportsUiAction: true, supportsDataInteraction: true, accessibility: "Uses role=dialog, managed focus, Escape/outside dismissal, ARIA trigger relationships, and focus restoration.", doNotUseWhen: "A simple command list is sufficient; use dropdown instead." },

    // ── Feedback ──────────────────────────────────────────────────────
    emptyState: { status: "stable", keyProperties: ["icon", "title", "description", "primaryAction", "secondaryAction", "compact"], supportsUiAction: true, supportsDataInteraction: false },
    placeholder: { status: "stable", keyProperties: ["lines", "placeholderVariant"], supportsUiAction: false, supportsDataInteraction: false, accessibility: "Uses aria-hidden. Respects prefers-reduced-motion." },
    spinner: { status: "stable", keyProperties: ["label", "inline"], supportsUiAction: false, supportsDataInteraction: false, accessibility: "Uses role=status with accessible label.", doNotUseWhen: "When you need a skeleton layout — use placeholder instead." },

    // ── Forms ─────────────────────────────────────────────────────────
    textarea: { status: "stable", keyProperties: ["field", "rows", "maxLength", "placeholder", "label"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Associated label via generated ID." },
    checkbox: { status: "stable", keyProperties: ["field", "label", "defaultValue"], supportsUiAction: false, supportsDataInteraction: true },
    checkboxGroup: { status: "stable", keyProperties: ["field", "label", "options", "multiple", "defaultValue"], supportsUiAction: false, supportsDataInteraction: true },
    radioGroup: { status: "stable", keyProperties: ["field", "label", "options", "defaultValue"], supportsUiAction: false, supportsDataInteraction: true },
    inputGroup: { status: "stable", keyProperties: ["field", "prefixIcon", "prefixText", "suffixIcon", "suffixText"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "Arbitrary HTML prefix/suffix content — only icon and safe text are supported." },

    // ── Charts ────────────────────────────────────────────────────────
    barChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "height", "options"], supportsUiAction: false, supportsDataInteraction: true },
    horizontalBarChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "height", "options"], supportsUiAction: false, supportsDataInteraction: true },
    lineChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "height", "options"], supportsUiAction: false, supportsDataInteraction: true },
    areaChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "height", "options"], supportsUiAction: false, supportsDataInteraction: true },
    pieChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "height", "options"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "With more than 8-10 categories." },
    donutChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "height", "options"], supportsUiAction: false, supportsDataInteraction: true },
    scatterChart: { status: "stable", keyProperties: ["x", "y", "pointSize", "height", "options"], supportsUiAction: false, supportsDataInteraction: true },
    gauge: { status: "stable", keyProperties: ["measure", "aggregation", "height", "options"], supportsUiAction: false, supportsDataInteraction: false },
    heatmap: { status: "stable", keyProperties: ["category", "measure", "height", "options"], supportsUiAction: false, supportsDataInteraction: true },
    smallMultiples: { status: "stable", keyProperties: ["splitField", "chart", "maxPanels", "sharedScale"], supportsUiAction: false, supportsDataInteraction: true },
    comboChart: { status: "stable", keyProperties: ["category", "series", "height", "options"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Each series/category point maps back to its source rows.", related: ["barChart", "lineChart"] },
    waterfallChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "showStart", "showEnd", "options"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "A simple category comparison is sufficient; use barChart." },
    sankeyChart: { status: "stable", keyProperties: ["sourceField", "targetField", "valueField", "aggregation", "orientation", "selectionTarget"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Node and edge clicks retain distinct row bindings; accompany dense flows with a table when exact values matter." },
    treemapChart: { status: "stable", keyProperties: ["pathFields", "valueField", "aggregation", "maxDepth", "options"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Every hierarchy node maps to the contributing source rows." },
    funnelChart: { status: "stable", keyProperties: ["category", "measure", "aggregation", "sort", "gap", "options"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Labels include stage values and percentages." },
    radarChart: { status: "stable", keyProperties: ["groupField", "indicators", "height", "options"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "Exact cross-group comparisons are more important than profile shape; use comboChart or a table." },

    // ── Tables ────────────────────────────────────────────────────────
    table: { status: "stable", keyProperties: ["columns", "pagination", "pageSize", "search", "density", "striped", "hover", "showRowCount", "pageSizeOptions", "rowActions", "emptyState", "stickyHeader"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Row actions use safe UiAction. Column resizing prevents row selection while active.", compatibility: "Tabulator engine is not bundled. engine:'tabulator' is normalized to native.", related: ["matrix"] },
    matrix: { status: "stable", keyProperties: ["rows", "columns", "values", "showTotals", "heatmap"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "For row-level detail — use table instead.", related: ["table"] },

    // ── Maps ──────────────────────────────────────────────────────────
    map: {
        status: "stable",
        statusNote: "Power BI spatial maps and the practical public ArcGIS REST runtime are connected. Supported ArcGIS sources are feature layers, tile overlays, and basic dynamic MapServer images; secured services, editing, 3D, non-4326 output, advanced label collision, and density grids are outside scope.",
        keyProperties: ["view", "basemap", "layers", "layerPanel", "toolbar", "settings", "style", "popup", "height"],
        supportsUiAction: false,
        supportsDataInteraction: true,
        compatibility: "Legacy settings/style/popup fully supported. Normalized to layers[] internally.",
        doNotUseWhen: "When spatial location data is not available in the semantic model.",
        related: ["offcanvas", "dataGrid"],
    },

    // ── Content ───────────────────────────────────────────────────────
    text: { status: "stable", keyProperties: ["text"], supportsUiAction: false, supportsDataInteraction: false, doNotUseWhen: "For structured content — use markdown or first-class components instead." },
    markdown: { status: "stable", keyProperties: ["text"], supportsUiAction: false, supportsDataInteraction: false },
    html: { status: "stable", keyProperties: ["html", "slots"], supportsUiAction: false, supportsDataInteraction: false, accessibility: "HTML is sanitized with DOMPurify. No scripts, iframes, or event handlers allowed.", doNotUseWhen: "When a first-class component (card, listGroup, dataGrid) can achieve the same result." },
    custom: { status: "stable", keyProperties: ["html", "repeat", "slots", "interactions"], supportsUiAction: false, supportsDataInteraction: true, accessibility: "Custom HTML is sanitized. Repeat rows support keyboard interaction.", doNotUseWhen: "When a first-class component can achieve the same result with less custom code.", related: ["html", "listGroup", "card"] },

    // ── Advanced ──────────────────────────────────────────────────────
    advancedChart: { status: "stable", keyProperties: ["options", "category", "measure", "height"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "A first-class semantic chart supports the request. Use advancedChart only for configurations the semantic schema cannot express.", accessibility: "ECharts options are recursively sanitized. JavaScript functions, event handlers, executable markup, and external URLs are blocked." },
};
