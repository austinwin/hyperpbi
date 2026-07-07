type JsonObject = Record<string, unknown>;

const field = "__field_key__";
const categoryField = "__category_field_key__";
const measureField = "__measure_field_key__";
const dateField = "__date_field_key__";

function base(type: string, title: string, span = 12): JsonObject {
    const id = type.replace(/[^A-Za-z0-9_-]/g, "_");
    return {
        type,
        id,
        title,
        span,
        className: `hp-example-${id}`,
        hidden: false,
        style: { minWidth: 0 },
        css: `.hp-example-${id} { min-width: 0; }`
    };
}

const textChild = (id = "supporting_text"): JsonObject => ({ type: "text", id, span: 12, text: "Supporting content" });
const controlInteraction = { internal: true, external: true };
const chartInteraction = { internal: true, external: true };

function container(type: string, title: string, overrides: JsonObject = {}): JsonObject {
    return { ...base(type, title), direction: "column", columns: 12, gap: 8, children: [textChild()], ...overrides };
}

function fieldControl(type: string, title: string, overrides: JsonObject = {}): JsonObject {
    return {
        ...base(type, title, 4),
        field,
        label: title,
        placeholder: `Choose ${title.toLowerCase()}`,
        defaultValue: "",
        targets: ["detail_table"],
        ...controlInteraction,
        ...overrides
    };
}

function categoryChart(type: string, title: string, seriesOptions: JsonObject = {}): JsonObject {
    return {
        ...base(type, title, 6),
        category: categoryField,
        measure: measureField,
        aggregation: "sum",
        height: 320,
        maxDataRows: 30000,
        initOptions: { renderer: "canvas", useDirtyRect: true },
        setOption: { notMerge: false, lazyUpdate: true, silent: false },
        options: {
            animation: true,
            tooltip: { trigger: "axis", formatter: "{b}: {c}" },
            legend: { show: true, bottom: 0 },
            grid: { left: 48, right: 20, top: 32, bottom: 52, containLabel: true },
            ...seriesOptions
        },
        ...chartInteraction
    };
}

export const componentJsonExamples: Record<string, JsonObject> = {
    grid: container("grid", "Responsive grid", { columns: 12, gap: 12, children: [{ ...base("kpi", "Total records", 4), field, aggregation: "count", format: "integer", intent: "primary" }, textChild()] }),
    flex: container("flex", "Flexible content row", { direction: "row", gap: 10, children: [fieldControl("select", "Status"), fieldControl("searchBox", "Search")] }),
    split: container("split", "Split workspace", { direction: "row", gap: 12, children: [container("section", "Summary", { span: 5 }), container("section", "Details", { span: 7 })] }),
    section: container("section", "Operations section", { columns: 12, gap: 8, collapsible: true, defaultCollapsed: false, children: [textChild("section_content")] }),
    toolbar: container("toolbar", "Dashboard toolbar", { direction: "row", gap: 6, children: [fieldControl("select", "Status"), { ...base("button", "Reset", 2), label: "Reset filters", action: "clearFilters" }] }),
    leftPanel: container("leftPanel", "Filter panel", { width: 280, collapsible: true, defaultCollapsed: false, children: [fieldControl("select", "Category"), fieldControl("dateRange", "Date range")] }),
    rightPanel: container("rightPanel", "Detail panel", { width: 340, collapsible: true, defaultCollapsed: false, children: [{ ...base("detailPanel", "Selected record"), selectedRow: true, emptyText: "Select a record", groups: [{ title: "Details", fields: [field] }] }] }),
    spacer: { ...base("spacer", "Vertical spacing"), style: { height: 24, minHeight: 24 }, css: ".hp-example-spacer { display: block; }" },
    divider: { ...base("divider", "Section divider"), style: { marginTop: 8, marginBottom: 8 }, css: ".hp-example-divider { border-color: #d8dee8; }" },

    searchBox: fieldControl("searchBox", "Search records", { placeholder: "Search all records…", filter: { operator: "contains", value: "" } }),
    textInput: fieldControl("textInput", "Contains text", { placeholder: "Enter text…", filter: { operator: "contains", value: "" } }),
    numberInput: fieldControl("numberInput", "Minimum amount", { min: 0, max: 1000000, step: 100, defaultValue: 0, filter: { operator: ">=", value: 0 } }),
    slider: fieldControl("slider", "Minimum score", { min: 0, max: 100, step: 5, defaultValue: 50, filter: { operator: ">=", value: 50 } }),
    select: fieldControl("select", "Status", { options: [{ label: "Open", value: "Open" }, { label: "Closed", value: "Closed" }], filter: { operator: "=", value: "" } }),
    multiSelect: fieldControl("multiSelect", "Statuses", { multiple: true, defaultValue: [], options: [{ label: "Open", value: "Open" }, { label: "Closed", value: "Closed" }], filter: { operator: "in", value: [] } }),
    segmentedControl: fieldControl("segmentedControl", "Priority", { defaultValue: "", options: [{ label: "High", value: "High" }, { label: "Medium", value: "Medium" }, { label: "Low", value: "Low" }], filter: { operator: "=", value: "" } }),
    toggle: fieldControl("toggle", "Active records only", { defaultValue: false, filter: { operator: "=", value: true } }),
    button: { ...base("button", "Reset filters", 2), label: "Reset filters", action: "clearFilters", actionValue: "", internal: true, external: true },
    buttonGroup: { ...base("buttonGroup", "View options", 4), label: "View", defaultValue: "summary", buttons: [{ id: "summary", label: "Summary", value: "summary", action: "setTab" }, { id: "details", label: "Details", value: "details", action: "setTab" }], internal: true, external: false },
    filterChips: { ...base("filterChips", "Applied filters"), targets: ["detail_table"], internal: true, external: true, style: { display: "flex", gap: 6, minWidth: 0 }, css: ".hp-example-filterChips { flex-wrap: wrap; }" },
    dateRange: fieldControl("dateRange", "Reporting period", { defaultValue: ["2026-01-01", "2026-12-31"], filter: { operator: "between", value: ["2026-01-01", "2026-12-31"] } }),

    tabs: { ...base("tabs", "Dashboard views"), tabs: [{ id: "overview", title: "Overview", children: [textChild("overview_content")] }, { id: "details", title: "Details", children: [{ ...base("table", "Records"), columns: [field], pagination: true, pageSize: 25 }] }], internal: true, external: false },
    collapsible: container("collapsible", "Optional details", { collapsible: true, defaultOpen: true, children: [textChild("collapsible_content")] }),
    accordion: container("accordion", "Filter group", { collapsible: true, defaultOpen: false, children: [fieldControl("select", "Category"), fieldControl("slider", "Score")] }),
    drawer: { ...base("drawer", "Selected record"), position: "right", width: 360, openWhen: "selectedRow", stateKey: "detail_drawer_open", defaultOpen: true, collapsible: true, children: [{ ...base("detailPanel", "Record details"), selectedRow: true, emptyText: "Select a row", groups: [{ title: "Overview", fields: [{ field, label: "Record", badge: true, copyable: true, format: "" }] }] }] },
    filterDrawer: { ...base("filterDrawer", "Filters"), position: "left", width: 300, openWhen: "always", stateKey: "filter_drawer_open", defaultOpen: false, collapsible: true, children: [fieldControl("select", "Category"), fieldControl("dateRange", "Date range")] },
    stepper: container("stepper", "Workflow step", { defaultOpen: true, children: [{ ...base("infoCard", "Step instructions"), text: "Complete this step before continuing.", intent: "primary" }, textChild("step_content")] }),

    kpi: { ...base("kpi", "Total value", 3), field, aggregation: "sum", format: "currency", intent: "primary", internal: true, external: false },
    metricGrid: { ...base("metricGrid", "Executive metrics"), metrics: [{ title: "Records", aggregation: "count", format: "integer", intent: "primary", prefix: "", suffix: "" }, { title: "Total value", field: measureField, aggregation: "sum", format: "currency", intent: "success", prefix: "$", suffix: "" }, { title: "Open records", field, aggregation: "countWhere", where: { field: categoryField, equals: "Open" }, format: "integer", intent: "warning", metric: "open_records" }] },
    infoCard: { ...base("infoCard", "Record summary", 4), field, aggregation: "first", format: "", intent: "neutral", text: "Context and guidance for this dashboard.", value: "Optional static fallback" },
    statusBadge: { ...base("statusBadge", "Current status", 3), field, aggregation: "first", format: "", intent: "success", value: "Active" },
    progressBar: { ...base("progressBar", "Completion", 4), field: measureField, aggregation: "first", format: "percent", intent: "primary", value: 72, max: 100 },
    alert: { ...base("alert", "Attention required"), field, aggregation: "count", format: "integer", intent: "warning", text: "Some records require review.", value: "Review" },
    statList: { ...base("statList", "Record statistics", 4), items: [{ label: "Owner", field, format: "" }, { label: "Amount", field: measureField, format: "currency" }, { label: "Target", value: 100, format: "integer" }] },
    detailPanel: { ...base("detailPanel", "Selected record", 5), selectedRow: true, emptyText: "Select a table row, chart point, map feature, or timeline event.", groups: [{ title: "Overview", fields: [{ field, label: "Record", badge: true, copyable: true, format: "" }, { field: categoryField, label: "Category" }] }, { title: "Measures", fields: [{ field: measureField, label: "Amount", format: "currency", copyable: true }] }], items: [{ label: "Record", field }, { label: "Amount", field: measureField, format: "currency" }] },
    timeline: { ...base("timeline", "Activity timeline", 6), dateField, titleField: field, categoryField, statusField: "__status_field_key__", descriptionField: "__description_field_key__", sortDirection: "desc", limit: 50, internal: true, external: true },

    barChart: categoryChart("barChart", "Value by category", { xAxis: { axisLabel: { rotate: 0, hideOverlap: true } }, series: [{ type: "bar", barMaxWidth: 42, label: { show: false } }] }),
    horizontalBarChart: categoryChart("horizontalBarChart", "Ranked categories", { yAxis: { axisLabel: { width: 120, overflow: "truncate" } }, series: [{ type: "bar", barMaxWidth: 32, label: { show: true, position: "right" } }] }),
    lineChart: categoryChart("lineChart", "Trend over time", { tooltip: { trigger: "axis" }, series: [{ type: "line", smooth: true, showSymbol: false, connectNulls: true }] }),
    areaChart: categoryChart("areaChart", "Volume trend", { series: [{ type: "line", smooth: true, areaStyle: { opacity: 0.24 }, showSymbol: false }] }),
    pieChart: categoryChart("pieChart", "Category share", { tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" }, series: [{ type: "pie", radius: "72%", label: { show: true, formatter: "{b}: {d}%" } }] }),
    donutChart: categoryChart("donutChart", "Category distribution", { tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" }, series: [{ type: "pie", radius: ["46%", "72%"], avoidLabelOverlap: true }] }),
    scatterChart: { ...base("scatterChart", "Measure relationship", 6), x: "__x_measure_field_key__", y: "__y_measure_field_key__", size: "__size_measure_field_key__", height: 340, maxDataRows: 30000, initOptions: { renderer: "canvas", useDirtyRect: true }, setOption: { notMerge: false, lazyUpdate: true }, options: { tooltip: { trigger: "item" }, xAxis: { name: "X measure", scale: true }, yAxis: { name: "Y measure", scale: true }, series: [{ type: "scatter", symbolSize: 10, emphasis: { focus: "series" } }] }, ...chartInteraction },
    gauge: { ...base("gauge", "Target attainment", 4), measure: measureField, aggregation: "avg", height: 300, maxDataRows: 30000, initOptions: { renderer: "canvas", useDirtyRect: true }, setOption: { notMerge: false, lazyUpdate: true }, options: { series: [{ type: "gauge", min: 0, max: 100, progress: { show: true, width: 14 }, axisLine: { lineStyle: { width: 14 } }, detail: { formatter: "{value}%" } }] }, internal: true, external: false },
    heatmap: categoryChart("heatmap", "Category intensity", { visualMap: { min: 0, max: 100, calculable: true, orient: "horizontal", bottom: 0 }, series: [{ type: "heatmap", label: { show: true }, emphasis: { itemStyle: { shadowBlur: 8 } } }] }),
    smallMultiples: { ...base("smallMultiples", "Regional comparisons"), splitField: "__split_field_key__", maxPanels: 6, sharedScale: true, height: 200, internal: true, external: true, chart: { ...categoryChart("barChart", "Value by category"), id: "small_multiple_chart", span: 12, height: 200 } },

    table: { ...base("table", "Record details"), engine: "native", columns: [{ field, title: "Record", width: 180, format: "", hozAlign: "left", conditional: [{ operator: "=", value: "Critical", color: "#991b1b", background: "#fee2e2" }] }, { field: measureField, title: "Amount", width: 120, format: "currency", hozAlign: "right", conditional: [{ operator: ">=", value: 1000, color: "#166534", background: "#dcfce7" }] }], pagination: true, pageSize: 25, search: true, resizableColumns: true, maxRows: 1000, stickyHeader: true, selectable: true, selectionMode: "highlight", internal: true, external: true },
    matrix: { ...base("matrix", "Category matrix"), rows: [categoryField, field], columns: ["__column_field_key__"], values: [{ field: measureField, title: "Total amount", aggregation: "sum", format: "currency" }, { title: "Records", aggregation: "count", format: "integer" }], showTotals: true, heatmap: true, maxRows: 200, internal: true, external: true },

    map: { ...base("map", "Locations", 12), height: 420, settings: { fitBounds: true, showLayerControl: true, showLegend: true, clusterPoints: true, basemap: "tiles", enableExternalTiles: true, tileUrl: "", coordinateSystem: "EPSG:4326", enableExternalGeocoder: false, geocoderProvider: "arcgis" }, style: { defaultPointColor: "#2563eb", colorMode: "categorical", gradientStart: "#dbeafe", gradientEnd: "#1d4ed8", radius: 7, minRadius: 4, maxRadius: 18, lineWeight: 2, minLineWeight: 1, maxLineWeight: 8, fillOpacity: 0.65, opacity: 0.9 }, popup: { html: `<strong>{{${field}}}</strong><br/>{{${categoryField}}}` }, internal: true, external: true },

    text: { ...base("text", "Text content"), text: "Plain text content for the dashboard.", internal: true, external: false },
    markdown: { ...base("markdown", "Markdown content"), text: "## Dashboard notes\n\n- Current period\n- Key operational context\n\n**Field:** {{__field_key__}}", internal: true, external: false },
    html: { ...base("html", "Formatted content"), html: `<section class="summary"><strong>Summary</strong><span>{{${field}}}</span></section>`, slots: { header: "<span>Header content</span>", footer: "<small>Updated from Power BI data</small>" }, internal: true, external: false },
    custom: { ...base("custom", "Interactive record list"), html: "<header><strong>Records</strong></header>", repeat: { source: "rows", as: "row", limit: 100, template: `<span>{{${field}}}</span><small>{{${categoryField}}}</small>`, distinctBy: field, sortBy: field, sortDirection: "asc" }, slots: { empty: "<p>No records available.</p>", footer: "<small>Select a record to filter the report.</small>" }, data: { variant: "compact-list" }, interactions: { onClick: { action: "selectWhere", where: { op: "=", left: { field }, right: { valueFromRow: field } }, selectionMode: "replace", internal: false, external: true, externalMode: "filter" } }, internal: false, external: true },

    advancedChart: { ...base("advancedChart", "Advanced ECharts dashboard", 12), category: categoryField, measure: measureField, x: "__x_measure_field_key__", y: "__y_measure_field_key__", size: "__size_measure_field_key__", height: 420, maxDataRows: 30000, initOptions: { renderer: "canvas", devicePixelRatio: 2, useDirtyRect: true, useCoarsePointer: true, pointerSize: 44, locale: "EN" }, setOption: { notMerge: false, lazyUpdate: true, silent: false, replaceMerge: ["series"] }, options: { aria: { enabled: true }, title: { text: "Advanced analysis", left: "center" }, tooltip: { trigger: "axis", formatter: "{b}: {c}" }, legend: { type: "scroll", bottom: 0 }, toolbox: { show: true, feature: { dataZoom: {}, restore: {}, saveAsImage: {} } }, dataZoom: [{ type: "inside", start: 0, end: 100 }, { type: "slider", bottom: 28 }], grid: { left: 52, right: 24, top: 56, bottom: 86, containLabel: true }, xAxis: { type: "category", axisLabel: { hideOverlap: true } }, yAxis: { type: "value", splitLine: { show: true } }, visualMap: { show: false, min: 0, max: 100 }, series: [{ type: "bar", encode: { x: categoryField, y: measureField }, emphasis: { focus: "series" }, markLine: { data: [{ type: "average", name: "Average" }] } }, { type: "line", encode: { x: categoryField, y: measureField }, smooth: true, showSymbol: false }] }, ...chartInteraction }
};

export function componentJsonExample(type: string): string {
    const example = componentJsonExamples[type];
    if (!example) throw new Error(`Missing component JSON example for ${type}.`);
    return JSON.stringify(example, null, 2);
}
