import type { ComponentCapability, ComponentCategory, ComponentMetadata } from "./componentCatalog";

// ── Component Definition (single source of truth) ─────────────────────

export interface ComponentDefinition {
    type: string;
    label: string;
    category: ComponentCategory;
    useWhen: string;
    level: "recommended" | "standard" | "advanced";
    capabilities: ComponentCapability;
    interaction: {
        defaultEnabled: boolean;
        naturalTrigger: "click" | "change";
        autoExternalMode: "filter" | "selection";
    };
    validate?: (
        component: Record<string, unknown>,
        path: string
    ) => string[];
}

// ── Capability helper ─────────────────────────────────────────────────

const cap = (overrides: Partial<ComponentCapability> = {}): ComponentCapability => ({
    fields: false,
    calculations: false,
    css: true,
    slots: true,
    interactions: false,
    externalSelection: false,
    customHtml: false,
    ...overrides,
});

// ── Definition factory ────────────────────────────────────────────────

const def = (
    type: string,
    label: string,
    category: ComponentCategory,
    useWhen: string,
    level: ComponentMetadata["level"] = "standard",
    override: Partial<ComponentCapability> = {},
    validate?: ComponentDefinition["validate"]
): ComponentDefinition => {
    const control = category === "Controls";
    const dataPoint =
        category === "Charts" ||
        category === "Tables" ||
        category === "Maps" ||
        type === "timeline" ||
        type === "custom";
    return {
        type,
        label,
        category,
        useWhen,
        level,
        capabilities: cap(override),
        interaction: {
            defaultEnabled: control || dataPoint,
            naturalTrigger: control ? "change" : "click",
            autoExternalMode: control ? "filter" : "selection",
        },
        validate,
    };
};

// ── Master component definitions ──────────────────────────────────────

export const componentDefinitions: ComponentDefinition[] = [
    // Layout
    def("grid", "Grid", "Layout", "Responsive 12-column dashboard sections", "recommended"),
    def("flex", "Flex row/column", "Layout", "Compact toolbars and flowing groups"),
    def("split", "Split layout", "Layout", "Two coordinated content regions"),
    def("section", "Section", "Layout", "Named content grouping", "recommended"),
    def("toolbar", "Toolbar", "Layout", "Compact controls above content"),
    def("leftPanel", "Left panel", "Layout", "Persistent filter rail"),
    def("rightPanel", "Right panel", "Layout", "Persistent details rail"),
    def("spacer", "Spacer", "Layout", "Small intentional separation", "advanced"),
    def("divider", "Divider", "Layout", "Subtle visual separation"),

    // Controls
    def("searchBox", "Search box", "Controls", "Search all visible row values", "recommended", { fields: true, interactions: true }),
    def("textInput", "Text input", "Controls", "Text field filtering", "standard", { fields: true, interactions: true }),
    def("numberInput", "Number input", "Controls", "Numeric thresholds", "standard", { fields: true, interactions: true }),
    def("slider", "Slider", "Controls", "Bounded numeric filtering", "standard", { fields: true, interactions: true }),
    def("select", "Select", "Controls", "Compact categorical filtering", "recommended", { fields: true, interactions: true }),
    def("multiSelect", "Multi-select", "Controls", "Filtering by several categories", "standard", { fields: true, interactions: true }),
    def("segmentedControl", "Segmented control", "Controls", "Two to seven high-frequency choices", "recommended", { fields: true, interactions: true, externalSelection: true }),
    def("toggle", "Toggle", "Controls", "Boolean state or view switch", "standard", { interactions: true }),
    def("button", "Button", "Controls", "Clear filters or open a view", "standard", { interactions: true }),
    def("buttonGroup", "Button group", "Controls", "Small action groups", "standard", { interactions: true }),
    def("filterChips", "Filter chips", "Controls", "Visible applied-filter summary", "recommended", { fields: true, interactions: true }),
    def("dateRange", "Date range", "Controls", "Start/end date filtering", "standard", { fields: true, interactions: true }),

    // Navigation
    def("tabs", "Tabs", "Navigation", "Separate overview, map, and details", "recommended", { interactions: true }),
    def("collapsible", "Collapsible section", "Navigation", "Hide secondary content", "standard", { interactions: true }),
    def("accordion", "Accordion", "Navigation", "Compact grouped filters", "standard", { interactions: true }),
    def("drawer", "Drawer / slide-over", "Navigation", "Selected-record details without leaving context", "recommended", { fields: true, interactions: true }),
    def("filterDrawer", "Filter drawer", "Navigation", "On-demand compact filter controls", "recommended", { fields: true, interactions: true }),
    def("steps", "Steps", "Navigation", "Sequential workflow progression", "standard", { interactions: true }),
    def("stepper", "Stepper", "Navigation", "Sequential app-style flows (legacy)", "advanced", { interactions: true }),

    // Display
    def("kpi", "KPI card", "Display", "One decision-critical number", "recommended", { fields: true, calculations: true }),
    def("metricGrid", "Metric grid", "Display", "Three to six summary metrics", "recommended", { fields: true, calculations: true }),
    def("infoCard", "Info card", "Display", "Short explanatory or record content", "standard", { fields: true }),
    def("statusBadge", "Status badge", "Display", "Compact status labeling", "standard", { fields: true }),
    def("progressBar", "Progress bar", "Display", "Progress toward a target", "standard", { fields: true, calculations: true }),
    def("alert", "Alert", "Display", "Actionable exception banner", "standard", { fields: true, calculations: true }),
    def("statList", "Stat list", "Display", "Compact label/value summary", "standard", { fields: true, calculations: true }),
    def("detailPanel", "Detail panel", "Display", "Selected-row fields, groups, badges, and copyable values", "recommended", { fields: true, interactions: true }),
    def("timeline", "Timeline / activity feed", "Display", "Operational history and status events", "recommended", { fields: true, interactions: true }),

    // Primitives
    def("card", "Card", "Primitives", "Professional content container with header", "recommended", { interactions: true }),
    def("icon", "Icon", "Primitives", "Safe SVG icon from bundled registry"),
    def("iconButton", "Icon button", "Primitives", "Compact accessible icon action", "standard", { interactions: true }),
    def("avatar", "Avatar", "Primitives", "Identity indicator with initials", "standard"),
    def("avatarGroup", "Avatar group", "Primitives", "Stacked identity indicators", "standard"),
    def("listGroup", "List group", "Primitives", "Compact row list with badges and actions", "recommended", { fields: true, interactions: true }),
    def("dataGrid", "Data grid", "Primitives", "Record detail label/value layout", "recommended", { fields: true, interactions: true }),
    def("countUp", "Count-up", "Primitives", "Animated number with prefix/suffix", "standard", { fields: true, calculations: true }),
    def("tracking", "Tracking", "Primitives", "Compact stage progress display", "standard", { fields: true }),
    def("dropdown", "Dropdown", "Primitives", "Compact action menu", "recommended", { interactions: true }),
    def("modal", "Modal", "Primitives", "Focused overlay with children", "recommended", { interactions: true }),
    def("offcanvas", "Offcanvas", "Primitives", "Slide-over panel for details/filters", "recommended", { fields: true, interactions: true }),
    def("popover", "Popover", "Primitives", "Rich tooltip with actions", "standard", { interactions: true }),

    // Feedback
    def("emptyState", "Empty state", "Feedback", "Placeholder when no data is available", "recommended"),
    def("placeholder", "Placeholder", "Feedback", "Skeleton loading indicator", "standard"),
    def("spinner", "Spinner", "Feedback", "Inline or centered loading indicator", "standard"),

    // Forms
    def("textarea", "Text area", "Forms", "Multi-line text input", "standard", { fields: true, interactions: true }),
    def("checkbox", "Checkbox", "Forms", "Single boolean toggle", "standard", { interactions: true }),
    def("checkboxGroup", "Checkbox group", "Forms", "Multiple choice selection", "standard", { fields: true, interactions: true }),
    def("radioGroup", "Radio group", "Forms", "Single choice from options", "standard", { fields: true, interactions: true }),
    def("inputGroup", "Input group", "Forms", "Input with safe prefix/suffix", "standard", { interactions: true }),

    // Charts
    def("barChart", "Bar chart", "Charts", "Ranked category comparison", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("horizontalBarChart", "Horizontal bar", "Charts", "Long category labels", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("lineChart", "Line chart", "Charts", "Time or ordered trends", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("areaChart", "Area chart", "Charts", "Trend plus magnitude", "standard", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("pieChart", "Pie chart", "Charts", "Few-part composition only", "standard", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("donutChart", "Donut chart", "Charts", "Few-part composition with central space", "standard", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("scatterChart", "Scatter chart", "Charts", "Relationship between two measures", "standard", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("gauge", "Gauge", "Charts", "Single target attainment", "standard", { fields: true, calculations: true }),
    def("heatmap", "Heatmap", "Charts", "Dense intensity comparison", "standard", { fields: true, calculations: true, interactions: true }),
    def("comboChart", "Combo chart", "Charts", "Compare bar and line measures on shared categories", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("waterfallChart", "Waterfall chart", "Charts", "Explain positive and negative contributions to a total", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("sankeyChart", "Sankey chart", "Charts", "Show weighted flow between stages", "standard", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("treemapChart", "Treemap chart", "Charts", "Explore hierarchical contribution", "standard", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("funnelChart", "Funnel chart", "Charts", "Compare ordered process stages", "standard", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("radarChart", "Radar chart", "Charts", "Compare multivariate profiles", "advanced", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("smallMultiples", "Small multiples", "Charts", "Repeat one comparison across a split field", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),

    // Tables
    def("table", "Detail table", "Tables", "Row-level investigation and export-ready detail", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("matrix", "Matrix / pivot", "Tables", "Summarized row-by-column comparison", "recommended", { fields: true, calculations: true, interactions: true }),

    // Maps
    def("map", "Map", "Maps", "Power BI geometry plus practical public ArcGIS REST feature, tile, and dynamic layers", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),

    // Content
    def("text", "Text", "Custom components", "Safe plain text"),
    def("markdown", "Markdown", "Custom components", "Structured explanatory content"),
    def("html", "Sanitized HTML", "Custom components", "Branded static content", "advanced", { customHtml: true }),
    def("custom", "Custom HTML/CSS", "Custom components", "Safe app-like cards, lists, and slicers", "advanced", { fields: true, calculations: true, interactions: true, externalSelection: true, customHtml: true }),
    def("svg", "Declarative SVG", "Custom components", "Animated KPI cards, diagrams, gauges, pictorial marks, and schematics", "recommended", { fields: true, calculations: true, interactions: true, externalSelection: true }),
    def("svgMarkup", "Sanitized SVG markup", "Advanced components", "Strictly sanitized raw SVG when declarative SVG cannot express the design", "advanced", { fields: true, interactions: true }),
    def("advancedChart", "Advanced ECharts", "Advanced components", "JSON-only ECharts escape hatch for uncommon configurations not represented by a first-class HyperPBI chart", "advanced", { fields: true, calculations: true, interactions: true, externalSelection: true }),
];

// ── Derived collections ───────────────────────────────────────────────

export const componentDefinitionsByType = new Map(
    componentDefinitions.map(d => [d.type, d] as const)
);

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
    return componentDefinitionsByType.get(type);
}
