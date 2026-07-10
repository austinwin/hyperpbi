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
    dropdown: { status: "experimental", statusNote: "Schema and trigger rendering exist. Full dropdown panel with keyboard navigation and positioning is not yet implemented.", keyProperties: ["trigger", "items", "placement", "closeOnSelect"], supportsUiAction: true, supportsDataInteraction: true, accessibility: "Keyboard support (Enter, Space, arrows, Escape) not yet implemented." },
    modal: { status: "experimental", statusNote: "Rendered by OverlayHost with backdrop and Escape close. Focus trap not yet implemented. Content renders correctly.", keyProperties: ["title", "children", "footer", "size", "backdropClose", "ariaLabel"], supportsUiAction: true, supportsDataInteraction: false, accessibility: "Backdrop click and Escape close work. Focus trap is not yet in place.", doNotUseWhen: "A modal without an accessible title or ariaLabel." },
    offcanvas: { status: "experimental", statusNote: "Schema exists. Renderer delegates to legacy Drawer component. Dedicated offcanvas renderer not yet implemented.", keyProperties: ["title", "children", "position", "width", "openWhen", "stateKey"], supportsUiAction: true, supportsDataInteraction: true, compatibility: "Currently renders through the legacy Drawer component.", related: ["drawer", "filterDrawer"] },
    popover: { status: "experimental", statusNote: "Schema exists. Renderer not yet implemented.", keyProperties: ["trigger", "children", "placement"], supportsUiAction: true, supportsDataInteraction: false, accessibility: "Not yet implemented." },

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
    advancedChart: { status: "stable", keyProperties: ["options", "category", "measure", "height"], supportsUiAction: false, supportsDataInteraction: true, doNotUseWhen: "When a simple chart type would suffice. Use advancedChart only for radar, treemap, sankey, funnel, etc.", accessibility: "ECharts options are recursively sanitized. JavaScript functions and event handlers are blocked." },
};
