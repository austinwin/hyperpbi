import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defaultConfig, type HyperPbiConfig } from "../src/config/hyperpbiConfig";
import { instantiateDashboardExample } from "../src/playground/dashboardExample";
import { canonicalJson } from "../src/playground/canonicalJson";
import { exportProjectBundle } from "../src/playground/projectBundle";

type Row = Record<string, string | number | boolean | null>;
type Specification = Record<string, unknown>;
type Theme = "light" | "dark";

interface ExampleDefinition {
    id: string;
    title: string;
    useCase: string;
    summary: string;
    description: string;
    theme: Theme;
    accent: string;
    tags: string[];
    referenceImages: number[];
    powerBiPackage: "core" | "maps";
    expected: string;
    limitations: string;
    headers: string[];
    rows: Row[];
    specification: Specification;
    runtime: HyperPbiConfig;
}

const outputRoot = resolve(process.cwd(), "examples", "dashboards");
const fixedTimestamp = "2026-07-25T00:00:00.000Z";

const disabledInteraction = {
    enabled: false,
    internalMode: "none",
    externalMode: "none",
};

const selectionInteraction = (field: string) => ({
    enabled: true,
    trigger: "click",
    internalMode: "highlight",
    internalScope: "others",
    externalMode: "selection",
    field,
    selectionMode: "replace",
    multiSelect: true,
    showSelector: false,
    clearOnSecondClick: true,
});

const lightRuntime: HyperPbiConfig = {
    ...defaultConfig,
    renderer: { showHeader: false, showRowCount: false, showStudioButton: true },
    security: { cssMode: "scoped", htmlMode: "sanitized", showSanitizerWarnings: false },
    providers: {
        mode: "core",
        privacyAcknowledged: false,
        basemap: { provider: "none", enabled: false },
        geocoder: { provider: "none", enabled: false },
    },
};

const darkRuntime: HyperPbiConfig = {
    ...lightRuntime,
    motion: { enabled: true, reducedMotion: "respect-system", maxConcurrentAnimations: 8 },
};

const mapsRuntime: HyperPbiConfig = {
    ...lightRuntime,
    providers: {
        mode: "maps",
        privacyAcknowledged: true,
        basemap: {
            provider: "osm",
            enabled: true,
            tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
        },
        geocoder: { provider: "none", enabled: false },
    },
};

function seededRandom(seed: number): () => number {
    let value = seed >>> 0;
    return () => {
        value = Math.imul(1664525, value) + 1013904223 >>> 0;
        return value / 0x100000000;
    };
}

function isoDate(dayOffset: number, base = Date.UTC(2026, 6, 1)): string {
    return new Date(base + dayOffset * 86_400_000).toISOString().slice(0, 10);
}

function number(value: number, digits = 0): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function csvValue(value: Row[string]): string {
    if (value === null || value === undefined) return "";
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: Row[]): string {
    return [
        headers.join(","),
        ...rows.map(row => headers.map(header => csvValue(row[header] ?? null)).join(",")),
    ].join("\r\n") + "\r\n";
}

function applicationShell(
    brand: string,
    subtitle: string,
    pageTitle: string,
    pageSubtitle: string,
    navigation: Array<{ id: string; label: string; icon: string }>,
): Record<string, unknown> {
    return {
        enabled: true,
        layout: "vertical",
        container: "fluid",
        density: "compact",
        stickyHeader: true,
        contentPadding: "compact",
        brand: { title: brand, shortTitle: brand.slice(0, 2).toUpperCase(), subtitle, icon: "dashboard" },
        navbar: {
            visible: true,
            showSidebarToggle: true,
            showSearch: true,
            searchPlaceholder: "Search this dashboard",
            actions: [
                {
                    id: "refresh",
                    ariaLabel: "Refresh dashboard",
                    icon: "refresh",
                    action: { type: "showToast", title: brand, message: "The current dataset is displayed.", intent: "primary", durationMs: 2200 },
                },
                {
                    id: "notifications",
                    ariaLabel: "Notifications",
                    icon: "bell",
                    badge: 3,
                    action: { type: "showToast", title: "Notifications", message: "Three items need attention.", intent: "warning", durationMs: 2200 },
                },
            ],
            user: { name: "Dashboard Owner", subtitle: "Workspace admin", initials: "DO", status: "online" },
        },
        sidebar: {
            visible: true,
            width: 216,
            collapsedWidth: 62,
            collapsible: true,
            defaultCollapsed: false,
            mobileBreakpoint: 760,
            navigation: navigation.map((item, index) => ({
                ...item,
                action: { type: "showToast", title: item.label, message: index ? "This example focuses on the overview." : "Overview is already open.", intent: "primary", durationMs: 1600 },
            })),
            footer: { title: brand, subtitle: "Portable HyperPBI example" },
        },
        pageHeader: {
            visible: true,
            title: pageTitle,
            subtitle: pageSubtitle,
            meta: [{ label: "Data", value: "Current", icon: "check", intent: "success" }],
        },
        footer: { visible: true, text: `${brand} · HyperPBI`, secondaryText: "One portable dataset · Web and Power BI" },
    };
}

const baseLightCss = `
.hp-app-main { background:#f4f6fb; }
.hp-page-header { border-bottom:0; background:#f4f6fb; }
.hp-page-header-title { font-size:20px; letter-spacing:-.03em; }
.hp-card { border:0; box-shadow:0 8px 24px rgb(29 42 68 / 7%); }
.hp-metric { border:0; border-left:0; box-shadow:0 8px 24px rgb(29 42 68 / 7%); }
.hp-metric-label { text-transform:none; letter-spacing:0; font-size:11px; }
.hp-metric-value { font-size:23px; }
.hp-card-header { border-bottom:1px solid color-mix(in srgb,var(--hp-border) 55%,transparent); }
.hp-table-wrap { border-radius:var(--hp-radius); }
.hp-app-footer { background:#f4f6fb; border-top:0; }
`;

const baseDarkCss = `
.hp-app-main,.hp-grid { background:#08111f; }
.hp-navbar,.hp-sidebar-app,.hp-page-header,.hp-app-footer { background:#0b1525; border-color:#1c2a3d; }
.hp-card,.hp-metric,.hp-custom-body,.hp-table-wrap { background:#0e1929; border-color:#203047; box-shadow:0 12px 30px rgb(0 0 0 / 22%); }
.hp-card-header { border-color:#203047; }
.hp-metric { border:1px solid #203047; border-left:0; }
.hp-metric-label { color:#8596ad; text-transform:none; letter-spacing:0; }
.hp-metric-value { color:#f5f8ff; font-size:23px; }
.hp-table th { background:#111e30; color:#9fb0c7; }
.hp-table td { border-color:#1b2a3d; }
.hp-app-footer { border-top:1px solid #1c2a3d; }
`;

const darkChartOptions = (colors = ["#29d3ff", "#8b5cf6", "#f953a6"]) => ({
    color: colors,
    textStyle: { color: "#dce8f8" },
    legend: { textStyle: { color: "#8fa3bc" } },
    xAxis: { axisLabel: { color: "#758aa5" }, axisLine: { lineStyle: { color: "#263852" } } },
    yAxis: { axisLabel: { color: "#758aa5" }, splitLine: { lineStyle: { color: "#1c2b40" } }, axisLine: { lineStyle: { color: "#263852" } } },
});

function talentAcquisition(): ExampleDefinition {
    const random = seededRandom(101);
    const roles = [
        ["ENG-201", "Senior Android Developer", "Engineering"],
        ["DSN-104", "UX/UI Designer", "Design"],
        ["OPS-310", "Recruiting Operations Lead", "People"],
        ["DAT-412", "Analytics Engineer", "Data"],
        ["PM-225", "Product Manager", "Product"],
    ] as const;
    const stages = ["Applied", "Shortlisted", "Rejected", "On Hold", "Finalised"];
    const sources = ["LinkedIn", "Referral", "Careers site", "Agency"];
    const genders = ["Female", "Male", "Non-binary"];
    const cities = ["New York", "Chicago", "Austin", "Seattle", "Denver"];
    const rows: Row[] = Array.from({ length: 96 }, (_, index) => {
        const role = roles[index % roles.length];
        const day = index % 7;
        const stageRoll = random();
        const stage = stageRoll < .44 ? "Applied" : stageRoll < .67 ? "Shortlisted" : stageRoll < .84 ? "Rejected" : stageRoll < .94 ? "On Hold" : "Finalised";
        return {
            applicationid: `APP-${String(index + 1).padStart(4, "0")}`,
            applicationdate: isoDate(day),
            weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day],
            weekdayorder: day + 1,
            hourbucket: `${8 + index % 7}:00`,
            hourorder: 8 + index % 7,
            candidate: `Candidate ${String(index + 1).padStart(3, "0")}`,
            gender: genders[index % genders.length],
            city: cities[index % cities.length],
            roleid: role[0],
            roletitle: role[1],
            department: role[2],
            stage,
            source: sources[index % sources.length],
            score: 55 + Math.floor(random() * 45),
            period: index < 80 ? "Current" : "Previous",
            applicationcount: 1,
        };
    });
    const conditional = (stage: string) => ({ op: "if", condition: { op: "=", left: { field: "stage" }, right: { value: stage } }, then: { value: 1 }, else: { value: 0 } });
    const currentStageCondition = (stage: string) => ({
        op: "and",
        args: [
            { op: "=", left: { field: "period" }, right: { value: "Current" } },
            { op: "=", left: { field: "stage" }, right: { value: stage } },
        ],
    });
    const specification: Specification = {
        version: "2.0",
        title: "Talent Acquisition Command Center",
        theme: { mode: "light", density: "compact", primaryColor: "#6d20ff", accentColor: "#ffb703", surfaceColor: "#ffffff", textColor: "#252336", borderColor: "#e4e5f0", successColor: "#2ec99d", warningColor: "#ffb703", dangerColor: "#ff7048", radius: 12, cardPadding: 14, gap: 12 },
        app: applicationShell("Applify", "Talent intelligence", "Recruiting Dashboard", "Application flow, candidate mix, and open-role demand", [
            { id: "dashboard", label: "Dashboard", icon: "dashboard" },
            { id: "jobs", label: "Jobs", icon: "briefcase" },
            { id: "schedule", label: "Schedule", icon: "calendar" },
            { id: "candidates", label: "Candidates", icon: "users" },
            { id: "messages", label: "Messages", icon: "message" },
        ]),
        calculations: {
            metrics: [
                { key: "totalapplications", aggregation: "countWhere", where: { op: "=", left: { field: "period" }, right: { value: "Current" } } },
                { key: "shortlisted", aggregation: "countWhere", where: currentStageCondition("Shortlisted") },
                { key: "rejected", aggregation: "countWhere", where: currentStageCondition("Rejected") },
                { key: "finalised", aggregation: "countWhere", where: currentStageCondition("Finalised") },
            ],
        },
        data: {
            datasets: {
                currentapplications: { source: "powerbi", filter: { field: "period", operator: "=", value: "Current" } },
                stagebyday: {
                    source: "currentapplications",
                    derive: { shortlistedflag: conditional("Shortlisted"), rejectedflag: conditional("Rejected"), holdflag: conditional("On Hold") },
                    groupBy: ["weekday", "weekdayorder"],
                    metrics: {
                        applications: { op: "count", field: "applicationid" },
                        shortlistedtotal: { op: "sum", field: "shortlistedflag" },
                        rejectedtotal: { op: "sum", field: "rejectedflag" },
                        holdtotal: { op: "sum", field: "holdflag" },
                    },
                    sort: [{ field: "weekdayorder", direction: "ascending" }],
                },
                hourly: { source: "currentapplications", groupBy: ["hourbucket", "hourorder"], metrics: { applications: { op: "count", field: "applicationid" } }, sort: [{ field: "hourorder", direction: "ascending" }] },
                genderbreakdown: { source: "currentapplications", groupBy: ["gender"], metrics: { applications: { op: "count", field: "applicationid" } } },
                rolesummary: { source: "currentapplications", groupBy: ["roleid", "roletitle"], metrics: { applications: { op: "count", field: "applicationid" } }, sort: [{ field: "applications", direction: "descending" }], limit: 5 },
                recent: { source: "currentapplications", sort: [{ field: "applicationdate", direction: "descending" }], limit: 12 },
            },
        },
        components: [
            {
                type: "metricGrid", id: "talentmetrics", span: 12,
                metrics: [
                    { title: "Total Applications", metric: "totalapplications", format: "integer", intent: "primary" },
                    { title: "Shortlisted Candidates", metric: "shortlisted", format: "integer", intent: "warning" },
                    { title: "Rejected Candidates", metric: "rejected", format: "integer", intent: "danger" },
                    { title: "Finalised", metric: "finalised", format: "integer", intent: "success" },
                ],
                interaction: disabledInteraction,
            },
            {
                type: "comboChart", id: "stageflow", dataset: "stagebyday", title: "Statistics of Active Applications", span: 8, height: 286, category: "weekday",
                series: [
                    { field: "applications", label: "Applications", chartType: "bar", aggregation: "first" },
                    { field: "shortlistedtotal", label: "Shortlisted", chartType: "bar", aggregation: "first" },
                    { field: "rejectedtotal", label: "Rejected", chartType: "bar", aggregation: "first" },
                    { field: "holdtotal", label: "On Hold", chartType: "bar", aggregation: "first" },
                ],
                options: { color: ["#6d20ff", "#ffb703", "#ff7048", "#9b8cf5"], series: [{ stack: "stages", barWidth: 10, itemStyle: { borderRadius: [6, 6, 0, 0] } }, { stack: "stages", barWidth: 10 }, { stack: "stages", barWidth: 10 }, { stack: "stages", barWidth: 10 }] },
                interaction: selectionInteraction("weekday"),
            },
            { type: "donutChart", id: "genderdonut", dataset: "genderbreakdown", title: "Candidates by Gender", span: 4, height: 286, category: "gender", measure: "applications", aggregation: "first", options: { color: ["#6d20ff", "#ff7048", "#ffb703"], series: [{ radius: ["56%", "78%"], label: { show: true, formatter: "{b}" } }] }, interaction: selectionInteraction("gender") },
            { type: "areaChart", id: "hourlytrend", dataset: "hourly", title: "Applications Received Time", span: 8, height: 260, category: "hourbucket", measure: "applications", aggregation: "first", options: { color: ["#ff7048"], series: [{ lineStyle: { width: 3 }, areaStyle: { opacity: .18 }, symbolSize: 7 }] }, interaction: selectionInteraction("hourbucket") },
            { type: "listGroup", id: "openroles", dataset: "rolesummary", title: "Jobs Posted", span: 4, source: "rows", primaryField: "roletitle", secondaryField: "roleid", valueField: "applications", maxItems: 5, compact: false, interaction: selectionInteraction("roleid") },
            { type: "table", id: "recentapplications", dataset: "recent", title: "Recent Candidates", span: 12, columns: [{ field: "candidate", title: "Candidate" }, { field: "roletitle", title: "Role" }, { field: "stage", title: "Stage", cellType: "badge", intentMap: { Shortlisted: "warning", Rejected: "danger", Finalised: "success", Applied: "primary" } }, { field: "score", title: "Score", hozAlign: "right" }, { field: "city", title: "Location" }], pagination: false, maxRows: 12, hover: true, striped: false, interaction: selectionInteraction("applicationid") },
        ],
        css: `${baseLightCss}
.hp-component-metricGrid .hp-metric:nth-child(1){--hp-primary:#6d20ff}.hp-component-metricGrid .hp-metric:nth-child(2){--hp-primary:#ffb703}.hp-component-metricGrid .hp-metric:nth-child(3){--hp-primary:#ff7048}.hp-component-metricGrid .hp-metric:nth-child(4){--hp-primary:#2ec99d}
.hp-component-metricGrid .hp-metric{position:relative;overflow:hidden;padding:16px 18px}.hp-component-metricGrid .hp-metric::after{content:"";position:absolute;right:-12px;top:-18px;width:64px;height:64px;border:10px solid color-mix(in srgb,var(--hp-primary) 18%,transparent);border-radius:50%}
.hp-list-item{border-radius:9px;margin-bottom:7px;background:#f8f7ff}.hp-list-item-value{padding:4px 9px;border-radius:8px;background:#6d20ff;color:#fff}
`,
    };
    return {
        id: "talent-acquisition",
        title: "Talent Acquisition Command Center",
        useCase: "Recruiting and workforce analytics",
        summary: "A polished recruiting workspace with application flow, candidate mix, open roles, and recent applicants.",
        description: "Inspired by the bright violet recruiting reference with a full application shell, compact KPI cards, stage-flow analysis, and a candidate work queue.",
        theme: "light", accent: "#6d20ff", tags: ["recruiting", "workforce", "app-shell"], referenceImages: [1, 3], powerBiPackage: "core",
        expected: "KPI totals, stage charts, gender mix, role demand, and candidate records render from one application-level dataset and cross-highlight by source row lineage.",
        limitations: "Profile photography is replaced by safe initials and bundled icons so the example remains offline and Power BI portable.",
        headers: ["applicationid", "applicationdate", "weekday", "weekdayorder", "hourbucket", "hourorder", "candidate", "gender", "city", "roleid", "roletitle", "department", "stage", "source", "score", "period", "applicationcount"],
        rows, specification, runtime: lightRuntime,
    };
}

function capitalProjectControls(): ExampleDefinition {
    const headers = ["recordtype", "projectid", "projectname", "client", "projecttype", "projectstatus", "manager", "startdate", "enddate", "month", "monthorder", "budget", "contractvalue", "scheduledcost", "performedcost", "actualcost", "margin", "completionpct", "spi", "cpi", "costcategory", "costvalue"];
    const summary: Row = { recordtype: "Summary", projectid: "PRJ-2048", projectname: "Munich Innovation Campus", client: "Partner LLC", projecttype: "Design & Build", projectstatus: "In Execution", manager: "Robert Sattler", startdate: "2025-06-01", enddate: "2027-12-31", budget: 4895600, contractvalue: 4956477, scheduledcost: 4890933, performedcost: 2730551, actualcost: 2345865, margin: 65544, completionpct: 56, spi: 1.1, cpi: 1.2 };
    const scheduled = [120000, 370000, 510000, 820000, 1400000, 2550000, 4200000, 4280000, 4320000, 4700000, 4800000, 4890933];
    const performed = [90000, 330000, 410000, 680000, 1300000, 2750000, 2760000, 2765000, 2770000, 2770000, 2770000, 2770000];
    const actual = [70000, 210000, 290000, 560000, 1320000, 2300000, 2320000, 2330000, 2340000, 2343000, 2345000, 2345865];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthly = months.map((month, index): Row => ({ recordtype: "Month", projectid: "PRJ-2048", month, monthorder: index + 1, scheduledcost: scheduled[index], performedcost: performed[index], actualcost: actual[index] }));
    const costs = [["Material", 985263], ["Labour", 821053], ["Equipment", 328421], ["Subcontractors", 164211], ["Foreign Labour", 46917]].map(([costcategory, costvalue]): Row => ({ recordtype: "Cost", projectid: "PRJ-2048", costcategory: String(costcategory), costvalue: Number(costvalue) }));
    const rows = [summary, ...monthly, ...costs];
    const specification: Specification = {
        version: "2.0",
        title: "Capital Project Controls",
        theme: { mode: "light", density: "compact", primaryColor: "#1769aa", accentColor: "#58d542", surfaceColor: "#ffffff", textColor: "#20252b", borderColor: "#e5e7eb", successColor: "#58d542", warningColor: "#ffcc27", dangerColor: "#df4b4b", radius: 8, cardPadding: 14, gap: 12 },
        data: { datasets: {
            summary: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Summary" } },
            monthly: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Month" }, sort: [{ field: "monthorder", direction: "ascending" }] },
            costs: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Cost" }, sort: [{ field: "costvalue", direction: "descending" }] },
        } },
        components: [
            { type: "custom", id: "projectidentity", dataset: "summary", span: 4, repeat: { source: "rows", limit: 1, template: "<section class='project-identity'><span>PROJECT DETAILS</span><h2>{{row.projectname}}</h2><dl><div><dt>Client</dt><dd>{{row.client}}</dd></div><div><dt>Contract value</dt><dd>€4,956,477</dd></div><div><dt>Type</dt><dd>{{row.projecttype}}</dd></div><div><dt>Status</dt><dd>{{row.projectstatus}}</dd></div><div><dt>Manager</dt><dd>{{row.manager}}</dd></div><div><dt>Delivery</dt><dd>{{row.enddate}}</dd></div></dl></section>" }, interaction: disabledInteraction },
            { type: "metricGrid", id: "projectmetrics", dataset: "summary", span: 5, metrics: [{ title: "Budget", field: "budget", aggregation: "first", format: "currency" }, { title: "Actual Costs", field: "actualcost", aggregation: "first", format: "currency" }, { title: "Work Performed", field: "performedcost", aggregation: "first", format: "currency" }, { title: "Margin", field: "margin", aggregation: "first", format: "currency", intent: "success" }], interaction: disabledInteraction },
            { type: "grid", id: "progressgauges", span: 3, columns: 3, gap: 8, children: [
                { type: "gauge", id: "completiongauge", dataset: "summary", title: "Completion", span: 1, height: 150, measure: "completionpct", aggregation: "first", options: { series: [{ min: 0, max: 100, startAngle: 90, endAngle: -270, axisLine: { lineStyle: { width: 10, color: [[1, "#edf0f2"]] } }, progress: { width: 10, itemStyle: { color: "#1769aa" } }, pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { formatter: "{value}%" }, title: { show: false } }] }, interaction: disabledInteraction },
                { type: "gauge", id: "spigauge", dataset: "summary", title: "SPI", span: 1, height: 150, measure: "spi", aggregation: "first", options: { series: [{ min: 0, max: 1.5, startAngle: 90, endAngle: -270, axisLine: { lineStyle: { width: 10, color: [[1, "#edf0f2"]] } }, progress: { width: 10, itemStyle: { color: "#58d542" } }, pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, title: { show: false } }] }, interaction: disabledInteraction },
                { type: "gauge", id: "cpigauge", dataset: "summary", title: "CPI", span: 1, height: 150, measure: "cpi", aggregation: "first", options: { series: [{ min: 0, max: 1.5, startAngle: 90, endAngle: -270, axisLine: { lineStyle: { width: 10, color: [[1, "#edf0f2"]] } }, progress: { width: 10, itemStyle: { color: "#58d542" } }, pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, title: { show: false } }] }, interaction: disabledInteraction },
            ] },
            { type: "comboChart", id: "projectdevelopment", dataset: "monthly", title: "Project Work & Budget Development", span: 7, height: 330, category: "month", series: [{ field: "scheduledcost", label: "Work scheduled", chartType: "line", aggregation: "first" }, { field: "performedcost", label: "Work performed", chartType: "line", aggregation: "first" }, { field: "actualcost", label: "Actual costs", chartType: "line", aggregation: "first" }], options: { color: ["#df4b4b", "#ffcc27", "#9da3a8"], series: [{ smooth: true, symbol: "none", lineStyle: { width: 2 } }, { smooth: true, symbol: "none", lineStyle: { width: 2 } }, { smooth: true, symbol: "none", lineStyle: { width: 2 } }] }, interaction: selectionInteraction("month") },
            { type: "donutChart", id: "costbreakdown", dataset: "costs", title: "Cost Breakdown", span: 5, height: 330, category: "costcategory", measure: "costvalue", aggregation: "first", options: { color: ["#58d542", "#10a7e5", "#df4b4b", "#a9adaf", "#ffcc27"], legend: { orient: "vertical", right: 8, top: "center" }, series: [{ center: ["36%", "50%"], radius: ["46%", "72%"], label: { show: true, formatter: "{d}%" } }] }, interaction: selectionInteraction("costcategory") },
        ],
        css: `${baseLightCss}
.hp-grid{background:#fafafa}.project-identity{height:100%;padding:16px;border-radius:8px;background:#fff;box-shadow:0 8px 24px rgb(30 45 62 / 6%)}.project-identity>span{font-size:10px;font-weight:800;color:#1769aa;letter-spacing:.08em}.project-identity h2{margin:8px 0 14px;font-size:18px}.project-identity dl{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0}.project-identity dl div:first-child{grid-column:1/-1}.project-identity dt{font-size:9px;color:#747b83}.project-identity dd{margin:2px 0 0;font-size:11px;font-weight:700}
.hp-component-metricGrid .hp-metric{padding:13px}.hp-component-metricGrid .hp-metric-value{font-size:19px}.hp-component-grid .hp-card-body{padding:7px}
`,
    };
    return {
        id: "capital-project-controls", title: "Capital Project Controls", useCase: "Construction and capital-program control",
        summary: "Project identity, commercial KPIs, earned-value gauges, development curves, and cost composition.",
        description: "A clean project-controlling canvas modeled after the white-and-blue reference, with precise status cards and earned-value visuals.",
        theme: "light", accent: "#1769aa", tags: ["projects", "construction", "finance"], referenceImages: [2], powerBiPackage: "core",
        expected: "Summary values use first-row semantics, monthly curves remain ordered, and cost composition traces back to cost-category rows.",
        limitations: "The example represents one selected project; use a report slicer or external filter to select other projects in Power BI.",
        headers, rows, specification, runtime: lightRuntime,
    };
}

function retailSalesOperations(): ExampleDefinition {
    const random = seededRandom(303);
    const headers = ["recordtype", "recordid", "date", "month", "monthorder", "customer", "product", "category", "channel", "revenue", "expense", "tax", "orderstatus", "provider", "dueamount", "duedate", "balance", "dailyusers", "newproducts"];
    const rows: Row[] = [{ recordtype: "Summary", recordid: "SUMMARY", balance: 9470000, revenue: 278000000, expense: 219000, dailyusers: 4215, newproducts: 548 }];
    const products = ["Surface Studio", "Travel Pack", "Smart Display", "Wireless Hub", "Design Suite"];
    const categories = ["Hardware", "Software", "Services", "Accessories"];
    const channels = ["Online", "Retail", "Partner"];
    for (let index = 0; index < 84; index += 1) {
        const monthOrder = index % 12 + 1;
        rows.push({
            recordtype: "Order", recordid: `ORD-${1000 + index}`, date: isoDate(index % 28), month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthOrder - 1], monthorder: monthOrder,
            customer: `Customer ${index + 1}`, product: products[index % products.length], category: categories[index % categories.length], channel: channels[index % channels.length],
            revenue: 18000 + Math.floor(random() * 52000), expense: 6000 + Math.floor(random() * 18000), tax: 1200 + Math.floor(random() * 4500),
            orderstatus: ["Complete", "Processing", "Pending"][index % 3],
        });
    }
    [["Easy Pay Way", 82258.23, "2026-07-28"], ["Payonner", 61486.69, "2026-07-30"], ["FastSpring", 4210.38, "2026-08-02"], ["Cloud Works", 9630.15, "2026-08-04"]].forEach(([provider, dueamount, duedate], index) => rows.push({ recordtype: "Payment", recordid: `PAY-${index + 1}`, provider: String(provider), dueamount: Number(dueamount), duedate: String(duedate) }));
    const specification: Specification = {
        version: "2.0", title: "Retail Sales Operations",
        theme: { mode: "light", density: "compact", primaryColor: "#ff704f", accentColor: "#23b39a", surfaceColor: "#ffffff", textColor: "#252944", borderColor: "#dfe5f2", successColor: "#23b39a", warningColor: "#ffb84d", dangerColor: "#ff704f", radius: 12, cardPadding: 14, gap: 12 },
        app: applicationShell("Productly", "Retail intelligence", "Sales Dashboard", "Revenue, customer demand, and upcoming settlement activity", [
            { id: "dashboard", label: "Dashboard", icon: "dashboard" }, { id: "analytics", label: "Analytics", icon: "chart" }, { id: "products", label: "Products", icon: "package" }, { id: "customers", label: "Customers", icon: "users" }, { id: "reports", label: "Reports", icon: "file" },
        ]),
        data: { datasets: {
            summary: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Summary" } },
            orders: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Order" } },
            monthly: { source: "orders", groupBy: ["month", "monthorder"], metrics: { sales: { op: "sum", field: "revenue" }, costs: { op: "sum", field: "expense" } }, sort: [{ field: "monthorder", direction: "ascending" }] },
            categories: { source: "orders", groupBy: ["category"], metrics: { sales: { op: "sum", field: "revenue" } }, sort: [{ field: "sales", direction: "descending" }] },
            payments: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Payment" }, sort: [{ field: "duedate", direction: "ascending" }] },
            recentorders: { source: "orders", sort: [{ field: "date", direction: "descending" }], limit: 10 },
        } },
        components: [
            { type: "metricGrid", id: "retailmetrics", dataset: "summary", span: 12, metrics: [{ title: "Total Sales", field: "revenue", aggregation: "first", format: "currency", intent: "danger" }, { title: "Daily User", field: "dailyusers", aggregation: "first", format: "integer", intent: "success" }, { title: "New Products", field: "newproducts", aggregation: "first", format: "integer", intent: "primary" }, { title: "Expenses", field: "expense", aggregation: "first", format: "currency", intent: "warning" }, { title: "Active Balance", field: "balance", aggregation: "first", format: "currency", intent: "danger" }], interaction: disabledInteraction },
            { type: "areaChart", id: "summarysales", dataset: "monthly", title: "Summary Sales", span: 8, height: 285, category: "month", measure: "sales", aggregation: "first", options: { color: ["#ff704f"], series: [{ smooth: true, symbolSize: 7, lineStyle: { width: 3 }, areaStyle: { opacity: .16 } }] }, interaction: selectionInteraction("month") },
            { type: "donutChart", id: "salesmix", dataset: "categories", title: "Sales Mix", span: 4, height: 285, category: "category", measure: "sales", aggregation: "first", options: { color: ["#ff704f", "#23b39a", "#3ca6e8", "#ffb84d"], series: [{ radius: ["52%", "76%"] }] }, interaction: selectionInteraction("category") },
            { type: "table", id: "lastorders", dataset: "recentorders", title: "Last Orders", span: 8, columns: [{ field: "customer", title: "Customer" }, { field: "product", title: "Product" }, { field: "date", title: "Date" }, { field: "revenue", title: "Price", format: "currency", hozAlign: "right" }, { field: "orderstatus", title: "Status", cellType: "badge", intentMap: { Complete: "success", Processing: "primary", Pending: "warning" } }], pagination: false, maxRows: 10, hover: true, interaction: selectionInteraction("recordid") },
            { type: "listGroup", id: "upcomingpayments", dataset: "payments", title: "Upcoming Payments", span: 4, source: "rows", primaryField: "provider", secondaryField: "duedate", valueField: "dueamount", maxItems: 6, compact: false, interaction: selectionInteraction("provider") },
        ],
        css: `${baseLightCss}
.hp-sidebar-app{background:#354b87;color:#f4f7ff;border:0}.hp-sidebar-app .hp-nav-item,.hp-sidebar-footer-title{color:#f4f7ff}.hp-sidebar-app .hp-sidebar-footer-subtitle{color:#b9c5e5}.hp-sidebar-app .hp-nav-item:hover{background:rgb(255 255 255 / 10%)}.hp-sidebar-app .hp-nav-active{background:rgb(255 255 255 / 14%);color:#fff}
.hp-component-metricGrid .hp-metric{position:relative;padding-top:42px}.hp-component-metricGrid .hp-metric::before{content:"";position:absolute;left:16px;top:13px;width:24px;height:24px;border-radius:50%;background:color-mix(in srgb,var(--hp-intent,var(--hp-primary)) 18%,transparent);box-shadow:inset 0 0 0 6px color-mix(in srgb,var(--hp-intent,var(--hp-primary)) 8%,transparent)}
.hp-list-item{margin-bottom:7px;border:0;border-radius:8px;background:#f7f8fc}.hp-list-item-value{color:#ff704f}
`,
    };
    return {
        id: "retail-sales-operations", title: "Retail Sales Operations", useCase: "Retail, ecommerce, and cash-flow monitoring",
        summary: "A coral-and-navy retail dashboard with revenue trends, category mix, order detail, and settlement reminders.",
        description: "Combines the warm Productly visual language with portable semantic charts and a practical order work queue.",
        theme: "light", accent: "#ff704f", tags: ["retail", "sales", "ecommerce"], referenceImages: [4, 12], powerBiPackage: "core",
        expected: "Monthly revenue, category share, recent orders, and upcoming payments all resolve from logical views over one sparse retail dataset.",
        limitations: "The balance card is illustrative and does not initiate payments or connect to a financial institution.",
        headers, rows, specification, runtime: lightRuntime,
    };
}

function urbanMobility(): ExampleDefinition {
    const random = seededRandom(404);
    const headers = ["assetid", "assettype", "status", "latitude", "longitude", "zone", "route", "tripdate", "hour", "distancekm", "durationminutes", "batterypct", "demandindex", "ridership"];
    const statuses = ["Active", "Charging", "Maintenance"];
    const zones = ["Centro", "San Miguel", "La Esperanza", "Universidad", "Mercado"];
    const rows: Row[] = Array.from({ length: 56 }, (_, index) => ({
        assetid: `MOB-${String(index + 1).padStart(3, "0")}`,
        assettype: ["Scooter", "Bike", "Shuttle"][index % 3],
        status: statuses[index % statuses.length],
        latitude: number(4.637 + (random() - .5) * .095, 6),
        longitude: number(-74.083 + (random() - .5) * .12, 6),
        zone: zones[index % zones.length],
        route: `R-${1 + index % 7}`,
        tripdate: isoDate(index % 14),
        hour: 6 + index % 16,
        distancekm: number(1.5 + random() * 14, 1),
        durationminutes: 8 + Math.floor(random() * 52),
        batterypct: 20 + Math.floor(random() * 80),
        demandindex: 45 + Math.floor(random() * 55),
        ridership: 4 + Math.floor(random() * 75),
    }));
    const specification: Specification = {
        version: "2.0", title: "Urban Mobility Command Center",
        theme: { mode: "light", density: "compact", primaryColor: "#6857e5", accentColor: "#16c79a", surfaceColor: "#ffffff", textColor: "#25283d", borderColor: "#e1e5ee", successColor: "#16c79a", warningColor: "#ffb703", dangerColor: "#fa5c73", radius: 12, cardPadding: 12, gap: 10 },
        app: applicationShell("Move", "Mobility operations", "Urban Mobility Command Center", "Live fleet distribution, demand pressure, and route performance", [
            { id: "dashboard", label: "Dashboard", icon: "dashboard" }, { id: "vehicles", label: "Vehicles", icon: "truck" }, { id: "routes", label: "Routes", icon: "map" }, { id: "promotions", label: "Promotions", icon: "tag" }, { id: "settings", label: "Settings", icon: "settings" },
        ]),
        calculations: { metrics: [
            { key: "fleetcount", aggregation: "count" },
            { key: "activerides", aggregation: "countWhere", where: { op: "=", left: { field: "status" }, right: { value: "Active" } } },
            { key: "averagebattery", aggregation: "avg", field: "batterypct" },
            { key: "totalridership", aggregation: "sum", field: "ridership" },
        ] },
        data: { datasets: {
            statusmix: { source: "powerbi", groupBy: ["status"], metrics: { assets: { op: "count", field: "assetid" } } },
            dailyusage: { source: "powerbi", groupBy: ["tripdate"], metrics: { rides: { op: "sum", field: "ridership" } }, sort: [{ field: "tripdate", direction: "ascending" }] },
            routesummary: { source: "powerbi", groupBy: ["route", "zone"], metrics: { rides: { op: "sum", field: "ridership" }, averagedemand: { op: "avg", field: "demandindex" }, averagebattery: { op: "avg", field: "batterypct" } }, sort: [{ field: "rides", direction: "descending" }] },
        } },
        components: [
            { type: "metricGrid", id: "mobilitymetrics", span: 12, metrics: [{ title: "Fleet Assets", metric: "fleetcount", format: "integer", intent: "primary" }, { title: "Active Rides", metric: "activerides", format: "integer", intent: "success" }, { title: "Average Battery", metric: "averagebattery", format: "integer", suffix: "%", intent: "warning" }, { title: "Total Ridership", metric: "totalridership", format: "integer", intent: "primary" }], interaction: disabledInteraction },
            {
                type: "map", id: "fleetmap", title: "Live Fleet Distribution", span: 8, height: 440, view: { fitMode: "data", fitPadding: .08 }, basemap: { type: "osm" },
                layers: [{
                    id: "assets", name: "Fleet status", source: { type: "powerbi", bindings: { latitude: "latitude", longitude: "longitude", color: "status", size: "demandindex", tooltip: ["assetid", "assettype", "status", "zone", "batterypct"] } },
                    renderer: { type: "uniqueValue", field: "status", fieldSource: "powerbi", values: [
                        { value: "Active", label: "Active", symbol: { shape: "circle", fillColor: "#16c79a", outlineColor: "#ffffff", size: 10 } },
                        { value: "Charging", label: "Charging", symbol: { shape: "diamond", fillColor: "#ffb703", outlineColor: "#ffffff", size: 11 } },
                        { value: "Maintenance", label: "Maintenance", symbol: { shape: "square", fillColor: "#fa5c73", outlineColor: "#ffffff", size: 10 } },
                    ], defaultSymbol: { shape: "circle", fillColor: "#6857e5", size: 8 } },
                    legend: { interactive: true, selectionMode: "multiple", clickAction: "filterLayer", showCounts: true, showPercentages: true },
                    interaction: { enabled: true, trigger: "click", internalMode: "highlight", internalScope: "others", externalMode: "selection", selectionMode: "replace", multiSelect: true, clearOnSecondClick: true },
                }],
                toolbar: { visible: true, home: true, layers: true, legend: true, clearSelection: true, zoomToSelection: true, selectedCount: true },
                interaction: selectionInteraction("assetid"),
            },
            { type: "donutChart", id: "fleetstatus", dataset: "statusmix", title: "Fleet Status", span: 4, height: 210, category: "status", measure: "assets", aggregation: "first", options: { color: ["#16c79a", "#ffb703", "#fa5c73"], series: [{ radius: ["50%", "75%"] }] }, interaction: selectionInteraction("status") },
            { type: "areaChart", id: "usagewave", dataset: "dailyusage", title: "Use of the Fleet", span: 4, height: 210, category: "tripdate", measure: "rides", aggregation: "first", options: { color: ["#6857e5"], series: [{ smooth: true, symbol: "none", areaStyle: { opacity: .22 }, lineStyle: { width: 3 } }] }, interaction: selectionInteraction("tripdate") },
            { type: "table", id: "routeperformance", dataset: "routesummary", title: "Busy Routes", span: 12, columns: [{ field: "route", title: "Route" }, { field: "zone", title: "Zone" }, { field: "rides", title: "Ridership", format: "integer", hozAlign: "right" }, { field: "averagedemand", title: "Demand", format: "integer", cellType: "progress" }, { field: "averagebattery", title: "Battery", format: "integer", hozAlign: "right" }], pagination: false, maxRows: 10, striped: false, hover: true, interaction: selectionInteraction("route") },
        ],
        css: `${baseLightCss}
.hp-app-main{background:#f2f3f8}.hp-sidebar-app{width:72px!important}.hp-sidebar-app .hp-nav-label,.hp-sidebar-footer{display:none}.hp-sidebar-app .hp-nav-item{justify-content:center;padding:11px}.hp-navbar-brand-subtitle{display:none}
.hp-component-metricGrid .hp-metric{background:linear-gradient(135deg,#fff,#f7f5ff)}.hp-map-container{border-radius:12px;overflow:hidden}.hp-component-table .hp-card{box-shadow:none;border:1px solid #e4e6ef}
`,
    };
    return {
        id: "urban-mobility-command-center", title: "Urban Mobility Command Center", useCase: "Fleet, micromobility, and route operations",
        summary: "A map-first fleet workspace with live status, demand, battery health, usage trend, and busy-route detail.",
        description: "Adapts the compact violet mobility reference into a responsive Power BI map dashboard with analytical selection.",
        theme: "light", accent: "#6857e5", tags: ["mobility", "map", "fleet"], referenceImages: [5], powerBiPackage: "maps",
        expected: "Map points fit the dataset, status legend selection links to other components, and route summaries retain contributing Power BI row identities.",
        limitations: "Street tiles require the Maps PBIVIZ profile, declared OpenStreetMap WebAccess, and network access in the host.",
        headers, rows, specification, runtime: mapsRuntime,
    };
}

function patientCareOperations(): ExampleDefinition {
    const random = seededRandom(505);
    const headers = ["encounterid", "patientid", "patientname", "gender", "age", "encounterdate", "weekday", "department", "alerttype", "severity", "status", "reviewtype", "satisfactionscore", "responseminutes", "resolved", "visits"];
    const departments = ["Emergency", "Cardiology", "Primary Care", "Pediatrics"];
    const rows: Row[] = Array.from({ length: 72 }, (_, index) => ({
        encounterid: `ENC-${String(index + 1).padStart(4, "0")}`,
        patientid: `PAT-${String(1000 + index % 34)}`,
        patientname: ["John Adams", "Mary Adams", "Rhonda Rousey", "Alex Morgan", "Taylor Reed", "Jamie Chen"][index % 6],
        gender: ["Male", "Female", "Female", "Non-binary"][index % 4],
        age: 8 + Math.floor(random() * 76),
        encounterdate: isoDate(index % 14),
        weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index % 7],
        department: departments[index % departments.length],
        alerttype: ["Clinical review", "Follow-up", "Medication", "Emergency"][index % 4],
        severity: ["Low", "Moderate", "High"][index % 3],
        status: ["Open", "In Review", "Resolved"][index % 3],
        reviewtype: ["Positive", "Negative", "Pending"][index % 3],
        satisfactionscore: number(3.2 + random() * 1.8, 1),
        responseminutes: 8 + Math.floor(random() * 82),
        resolved: index % 3 === 2,
        visits: 1 + Math.floor(random() * 4),
    }));
    const specification: Specification = {
        version: "2.0", title: "Patient Care Operations",
        theme: { mode: "light", density: "compact", primaryColor: "#2eb7ee", accentColor: "#48d9b0", surfaceColor: "#ffffff", textColor: "#253040", borderColor: "#e0e8ef", successColor: "#48d9b0", warningColor: "#ffb84d", dangerColor: "#7b57ef", radius: 14, cardPadding: 14, gap: 12 },
        app: applicationShell("CareFlow", "Patient operations", "Patient Activity", "Alerts, patient flow, and service response across the care network", [
            { id: "activity", label: "Activity", icon: "activity" }, { id: "patients", label: "Patients", icon: "users" }, { id: "reviews", label: "Reviews", icon: "message" }, { id: "calendar", label: "Calendar", icon: "calendar" },
        ]),
        calculations: { metrics: [
            { key: "encounters", aggregation: "count" },
            { key: "patients", aggregation: "distinctCount", field: "patientid" },
            { key: "openalerts", aggregation: "countWhere", where: { op: "!=", left: { field: "status" }, right: { value: "Resolved" } } },
            { key: "averageresponse", aggregation: "avg", field: "responseminutes" },
        ] },
        data: { datasets: {
            daily: { source: "powerbi", groupBy: ["encounterdate"], metrics: { encounters: { op: "count", field: "encounterid" }, response: { op: "avg", field: "responseminutes" } }, sort: [{ field: "encounterdate", direction: "ascending" }] },
            departments: { source: "powerbi", groupBy: ["department"], metrics: { encounters: { op: "count", field: "encounterid" } }, sort: [{ field: "encounters", direction: "descending" }] },
            reviews: { source: "powerbi", groupBy: ["reviewtype"], metrics: { reviews: { op: "count", field: "encounterid" } } },
            activepatients: { source: "powerbi", filter: { field: "status", operator: "!=", value: "Resolved" }, sort: [{ field: "responseminutes", direction: "descending" }], limit: 10 },
        } },
        components: [
            { type: "metricGrid", id: "caremetrics", span: 5, metrics: [{ title: "Active Encounters", metric: "encounters", format: "integer", intent: "primary" }, { title: "Patients Served", metric: "patients", format: "integer", intent: "success" }, { title: "Open Alerts", metric: "openalerts", format: "integer", intent: "danger" }, { title: "Avg Response", metric: "averageresponse", format: "integer", suffix: " min", intent: "warning" }], interaction: disabledInteraction },
            { type: "areaChart", id: "patientstatistics", dataset: "daily", title: "Patient Statistics", span: 7, height: 250, category: "encounterdate", measure: "encounters", aggregation: "first", options: { color: ["#2eb7ee"], series: [{ smooth: true, areaStyle: { opacity: .22 }, lineStyle: { width: 3 }, symbolSize: 6 }] }, interaction: selectionInteraction("encounterdate") },
            { type: "donutChart", id: "reviewmix", dataset: "reviews", title: "Patient Reviews", span: 4, height: 245, category: "reviewtype", measure: "reviews", aggregation: "first", options: { color: ["#2eb7ee", "#48d9b0", "#7b57ef"], series: [{ radius: ["52%", "76%"] }] }, interaction: selectionInteraction("reviewtype") },
            { type: "barChart", id: "departmentload", dataset: "departments", title: "Department Load", span: 4, height: 245, category: "department", measure: "encounters", aggregation: "first", options: { color: ["#48d9b0"], series: [{ barWidth: 16, itemStyle: { borderRadius: [8, 8, 2, 2] } }] }, interaction: selectionInteraction("department") },
            { type: "custom", id: "carecalendar", span: 4, html: "<section class='care-calendar'><header><strong>Care Calendar</strong><span>July 2026</span></header><div class='week'><b>M</b><b>T</b><b>W</b><b>T</b><b>F</b><b>S</b><b>S</b><i>20</i><i>21</i><i>22</i><i>23</i><i>24</i><i>25</i><i class='active'>26</i></div><p>72 encounters are included in this portable sample.</p></section>", interaction: disabledInteraction },
            { type: "table", id: "patientapplications", dataset: "activepatients", title: "Patient Applications", span: 12, columns: [{ field: "patientname", title: "Patient" }, { field: "gender", title: "Gender" }, { field: "age", title: "Age", hozAlign: "right" }, { field: "department", title: "Department" }, { field: "severity", title: "Severity", cellType: "badge", intentMap: { Low: "success", Moderate: "warning", High: "danger" } }, { field: "responseminutes", title: "Response", format: "integer", hozAlign: "right" }, { field: "status", title: "Status", cellType: "badge", intentMap: { Open: "danger", "In Review": "primary", Resolved: "success" } }], pagination: false, maxRows: 10, hover: true, interaction: selectionInteraction("encounterid") },
        ],
        css: `${baseLightCss}
.hp-app-main{background:#f3f7f8}.hp-component-metricGrid .hp-metric{color:#fff;background:linear-gradient(135deg,#36c4ef,#579df3)}.hp-component-metricGrid .hp-metric:nth-child(2){background:linear-gradient(135deg,#37d7af,#58cfa3)}.hp-component-metricGrid .hp-metric:nth-child(3){background:linear-gradient(135deg,#7257ec,#8e67f5)}.hp-component-metricGrid .hp-metric:nth-child(4){background:linear-gradient(135deg,#49a4f2,#6b7cf0)}.hp-component-metricGrid .hp-metric-label,.hp-component-metricGrid .hp-metric-value{color:#fff}
.care-calendar{padding:16px;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgb(29 42 68 / 7%)}.care-calendar header{display:flex;justify-content:space-between}.care-calendar header span{color:#8391a3}.care-calendar .week{display:grid;grid-template-columns:repeat(7,1fr);gap:7px;margin:18px 0}.care-calendar b,.care-calendar i{display:grid;place-items:center;height:28px;font-size:10px;font-style:normal}.care-calendar b{color:#98a4b4}.care-calendar i{border-radius:8px;background:#f4f7fa}.care-calendar i.active{background:#2eb7ee;color:#fff}.care-calendar p{margin:0;color:#718094;font-size:10px}
`,
    };
    return {
        id: "patient-care-operations", title: "Patient Care Operations", useCase: "Healthcare capacity and patient-flow analytics",
        summary: "A calm clinical operations dashboard for alerts, patient demand, review mix, department load, and response queues.",
        description: "Translates the airy blue-and-mint healthcare reference into a safe, accessible operational workspace.",
        theme: "light", accent: "#2eb7ee", tags: ["healthcare", "operations", "patients"], referenceImages: [6], powerBiPackage: "core",
        expected: "Patient-level data drives aggregate KPIs, daily and departmental charts, and a selectable active-patient work queue.",
        limitations: "All people and clinical events are synthetic; the dashboard is not intended for diagnosis or real patient decisions.",
        headers, rows, specification, runtime: lightRuntime,
    };
}

function digitalBanking(): ExampleDefinition {
    const random = seededRandom(606);
    const headers = ["recordtype", "recordid", "accountname", "date", "month", "monthorder", "merchant", "category", "transactiontype", "amount", "status", "channel", "balance", "debit", "credit", "cardlast4", "cardholder", "expiry"];
    const rows: Row[] = [{ recordtype: "Account", recordid: "ACC-001", accountname: "Everyday Account", balance: 10250, debit: 3500, credit: 4200, cardlast4: "8075", cardholder: "Marvin McKinney", expiry: "12/2028" }];
    const merchants = ["Figma Pro Plan", "YouTube Premium", "Fresh Market", "City Rail", "Health Studio", "Cloud Hosting"];
    const categories = ["Shopping", "Food", "Travel", "Health"];
    for (let index = 0; index < 72; index += 1) {
        const monthOrder = index % 9 + 1;
        rows.push({
            recordtype: "Transaction", recordid: `TX-${String(index + 1).padStart(4, "0")}`, accountname: "Everyday Account", date: isoDate(index % 28),
            month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"][monthOrder - 1], monthorder: monthOrder,
            merchant: merchants[index % merchants.length], category: categories[index % categories.length], transactiontype: index % 5 === 0 ? "Credit" : "Debit",
            amount: 50 + Math.floor(random() * 4950), status: ["Success", "Pending", "Success"][index % 3], channel: ["Card", "Mobile", "Transfer"][index % 3],
        });
    }
    const conditionalAmount = (type: string) => ({ op: "if", condition: { op: "=", left: { field: "transactiontype" }, right: { value: type } }, then: { field: "amount" }, else: { value: 0 } });
    const specification: Specification = {
        version: "2.0", title: "Digital Banking Overview",
        theme: { mode: "dark", density: "compact", primaryColor: "#2596ff", accentColor: "#24d2ed", surfaceColor: "#0e1929", textColor: "#eef5ff", borderColor: "#203047", successColor: "#15bc88", warningColor: "#ff9c35", dangerColor: "#d81b71", radius: 12, cardPadding: 14, gap: 12 },
        app: applicationShell("Paycent", "Personal finance", "Home", "Balances, transactions, and spending health", [
            { id: "home", label: "Home", icon: "home" }, { id: "accounts", label: "Accounts", icon: "wallet" }, { id: "transactions", label: "Transactions", icon: "repeat" }, { id: "reports", label: "Reports", icon: "chart" }, { id: "expenses", label: "Expenses", icon: "receipt" }, { id: "settings", label: "Settings", icon: "settings" },
        ]),
        data: { datasets: {
            account: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Account" } },
            transactions: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Transaction" } },
            monthly: { source: "transactions", derive: { debitamount: conditionalAmount("Debit"), creditamount: conditionalAmount("Credit") }, groupBy: ["month", "monthorder"], metrics: { debits: { op: "sum", field: "debitamount" }, credits: { op: "sum", field: "creditamount" } }, sort: [{ field: "monthorder", direction: "ascending" }] },
            expenses: { source: "transactions", filter: { field: "transactiontype", operator: "=", value: "Debit" }, groupBy: ["category"], metrics: { spend: { op: "sum", field: "amount" } }, sort: [{ field: "spend", direction: "descending" }] },
            recent: { source: "transactions", sort: [{ field: "date", direction: "descending" }], limit: 10 },
        } },
        components: [
            { type: "metricGrid", id: "bankmetrics", dataset: "account", span: 8, responsive: { xs: { span: 12 }, lg: { span: 8 } }, metrics: [{ title: "Total Balance", field: "balance", aggregation: "first", format: "currency", intent: "primary" }, { title: "Debit", field: "debit", aggregation: "first", format: "currency", intent: "danger" }, { title: "Credit", field: "credit", aggregation: "first", format: "currency", intent: "success" }], interaction: disabledInteraction },
            { type: "custom", id: "paymentcard", dataset: "account", span: 4, responsive: { xs: { span: 12 }, lg: { span: 4 } }, repeat: { source: "rows", limit: 1, template: "<article class='payment-card'><header><strong>Paycent</strong><span>contactless</span></header><b>6219&nbsp;&nbsp;8610&nbsp;&nbsp;2888&nbsp;&nbsp;{{row.cardlast4}}</b><footer><span>{{row.cardholder}}</span><span>{{row.expiry}}</span></footer></article>" }, interaction: disabledInteraction },
            { type: "comboChart", id: "transactionreport", dataset: "monthly", title: "Transaction Reports", span: 8, responsive: { xs: { span: 12 }, lg: { span: 8 } }, height: 290, category: "month", series: [{ field: "debits", label: "Debit", chartType: "bar", aggregation: "first" }, { field: "credits", label: "Credit", chartType: "line", aggregation: "first" }], options: { ...darkChartOptions(["#2596ff", "#24d2ed"]), series: [{ barWidth: 24, itemStyle: { borderRadius: [8, 8, 2, 2] } }, { smooth: true, symbolSize: 7, lineStyle: { width: 3 } }] }, interaction: selectionInteraction("month") },
            { type: "donutChart", id: "expensesdonut", dataset: "expenses", title: "Expenses", span: 4, responsive: { xs: { span: 12 }, lg: { span: 4 } }, height: 290, category: "category", measure: "spend", aggregation: "first", options: { ...darkChartOptions(["#2596ff", "#24d2ed", "#d81b71", "#965cf8"]), series: [{ radius: ["52%", "76%"], label: { show: false } }] }, interaction: selectionInteraction("category") },
            { type: "table", id: "recenttransactions", dataset: "recent", title: "Recent Transactions", span: 12, columns: [{ field: "merchant", title: "Account" }, { field: "category", title: "Category" }, { field: "amount", title: "Amount", format: "currency", hozAlign: "right" }, { field: "date", title: "Date" }, { field: "status", title: "Status", cellType: "badge", intentMap: { Success: "success", Pending: "warning" } }, { field: "channel", title: "Channel" }], pagination: false, maxRows: 10, hover: true, interaction: selectionInteraction("recordid") },
        ],
        css: `${baseDarkCss}
.hp-app-shell{color-scheme:dark}.hp-navbar-search input{background:#091321;border-color:#26364d;color:#edf5ff}.hp-sidebar-app .hp-nav-active{background:linear-gradient(90deg,#258dff,#0764cd);color:#fff}.hp-component-metricGrid .hp-metric{background:linear-gradient(145deg,#101c2d,#0b1422)}.hp-component-metricGrid .hp-metric:first-child{border-color:#2596ff}
.payment-card{min-height:154px;display:flex;flex-direction:column;justify-content:space-between;padding:20px;border-radius:18px;color:#fff;background:radial-gradient(circle at 85% 110%,#ff59d1,transparent 38%),radial-gradient(circle at 5% -10%,#29d3ff,transparent 42%),linear-gradient(135deg,#11104a,#17082e);box-shadow:0 18px 35px rgb(0 0 0 / 28%)}.payment-card header,.payment-card footer{display:flex;justify-content:space-between;align-items:center}.payment-card header span{font-size:9px;color:#bcd1e7}.payment-card b{font-size:17px;letter-spacing:.12em}.payment-card footer{font-size:10px;color:#dbe7fa}
`,
    };
    return {
        id: "digital-banking-overview", title: "Digital Banking Overview", useCase: "Personal banking and transaction analytics",
        summary: "A responsive dark banking workspace with balance cards, transaction history, spending mix, and account detail.",
        description: "Captures the midnight Paycent reference with neon accents and a safe CSS-rendered card that works offline.",
        theme: "dark", accent: "#2596ff", tags: ["banking", "transactions", "responsive"], referenceImages: [8], powerBiPackage: "core",
        expected: "Account summary values, monthly debit/credit activity, category spending, and recent transactions render responsively from one source.",
        limitations: "The payment card is a decorative dashboard element and never exposes or processes real card credentials.",
        headers, rows, specification, runtime: darkRuntime,
    };
}

function mediaWebPerformance(): ExampleDefinition {
    const random = seededRandom(707);
    const headers = ["recordtype", "recordid", "date", "dayorder", "medium", "channel", "conversions", "conversionrate", "sessions", "newuserspct", "sessionsperuser", "engagementseconds", "pagespersession", "bouncerate", "location", "latitude", "longitude", "mentions"];
    const rows: Row[] = [{ recordtype: "Summary", recordid: "SUMMARY", conversions: 229, conversionrate: .009, sessions: 26900, newuserspct: .803, sessionsperuser: 1.14, engagementseconds: 59, pagespersession: 1.47, bouncerate: 82.5 }];
    const media = ["organic", "cpc", "referral", "p_social", "(none)"];
    for (let index = 0; index < 28; index += 1) {
        rows.push({ recordtype: "Daily", recordid: `DAY-${index + 1}`, date: isoDate(index, Date.UTC(2026, 10, 10)), dayorder: index + 1, conversions: 35 + Math.floor(random() * 80), conversionrate: number(.004 + random() * .022, 4), sessions: 1800 + Math.floor(random() * 3600), mentions: 800 + Math.floor(random() * 4600), channel: ["Radio", "TV", "Outdoor", "Web"][index % 4] });
    }
    media.forEach((medium, index) => rows.push({ recordtype: "Medium", recordid: `MED-${index + 1}`, medium, conversions: [97, 49, 31, 3, 49][index], conversionrate: [.006, .06, .031, .037, .007][index], sessions: [17300, 1333, 1009, 87, 6603][index] }));
    [["Chicago", 41.8781, -87.6298], ["London", 51.5072, -.1276], ["Singapore", 1.3521, 103.8198], ["San Francisco", 37.7749, -122.4194]].forEach(([location, latitude, longitude], index) => rows.push({ recordtype: "Location", recordid: `LOC-${index + 1}`, location: String(location), latitude: Number(latitude), longitude: Number(longitude), sessions: [6800, 4900, 3300, 5200][index] }));
    const specification: Specification = {
        version: "2.0", title: "Media & Web Performance",
        theme: { mode: "dark", density: "compact", primaryColor: "#21d4fd", accentColor: "#ffe04a", surfaceColor: "#292d59", textColor: "#f4f5ff", borderColor: "#3b4073", successColor: "#37db8d", warningColor: "#ffe04a", dangerColor: "#ff5e72", radius: 10, cardPadding: 14, gap: 10 },
        data: { datasets: {
            summary: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Summary" } },
            daily: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Daily" }, sort: [{ field: "dayorder", direction: "ascending" }] },
            media: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Medium" }, sort: [{ field: "sessions", direction: "descending" }] },
            locations: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Location" }, sort: [{ field: "sessions", direction: "descending" }] },
        } },
        components: [
            { type: "custom", id: "mediaheader", span: 12, html: "<header class='media-header'><div><span>NOISE MONITOR</span><h1>Monitoring</h1></div><nav><b>Radio 29,384</b><b>TV 11,697</b><b>Outdoor 1,818</b><b>Web 1,226</b></nav></header>", interaction: disabledInteraction },
            { type: "metricGrid", id: "webmetrics", dataset: "summary", span: 12, metrics: [{ title: "Conversions · past 7 days", field: "conversions", aggregation: "first", format: "integer", intent: "primary" }, { title: "Conversion rate", field: "conversionrate", aggregation: "first", format: "percent", intent: "danger" }, { title: "Sessions · past 7 days", field: "sessions", aggregation: "first", format: "integer", intent: "primary" }, { title: "New users · 7 day", field: "newuserspct", aggregation: "first", format: "percent", intent: "success" }, { title: "Engagement", field: "engagementseconds", aggregation: "first", suffix: "s", intent: "warning" }], interaction: disabledInteraction },
            { type: "lineChart", id: "conversiontrend", dataset: "daily", title: "Conversions", span: 4, height: 220, category: "date", measure: "conversions", aggregation: "first", options: { ...darkChartOptions(["#21d4fd"]), series: [{ smooth: false, symbol: "none", lineStyle: { width: 3 } }] }, interaction: selectionInteraction("date") },
            { type: "lineChart", id: "ratetrend", dataset: "daily", title: "Conversion Rate", span: 4, height: 220, category: "date", measure: "conversionrate", aggregation: "first", options: { ...darkChartOptions(["#ffe04a"]), series: [{ smooth: false, symbol: "none", lineStyle: { width: 3 } }] }, interaction: selectionInteraction("date") },
            { type: "lineChart", id: "sessiontrend", dataset: "daily", title: "Sessions", span: 4, height: 220, category: "date", measure: "sessions", aggregation: "first", options: { ...darkChartOptions(["#21d4fd"]), series: [{ smooth: false, symbol: "none", lineStyle: { width: 3 } }] }, interaction: selectionInteraction("date") },
            { type: "table", id: "mediumperformance", dataset: "media", title: "Performance by Medium", span: 8, columns: [{ field: "medium", title: "Medium" }, { field: "conversions", title: "Conversions", format: "integer", hozAlign: "right" }, { field: "conversionrate", title: "Conversion rate", format: "percent", hozAlign: "right" }, { field: "sessions", title: "Sessions", format: "integer", hozAlign: "right" }], pagination: false, maxRows: 8, interaction: selectionInteraction("medium") },
            { type: "gauge", id: "bouncegauge", dataset: "summary", title: "Bounce rate · 7 day", span: 4, height: 210, measure: "bouncerate", aggregation: "first", options: { ...darkChartOptions(["#21d4fd"]), series: [{ min: 0, max: 100, startAngle: 180, endAngle: 0, center: ["50%", "68%"], radius: "90%", progress: { show: true, width: 13, itemStyle: { color: "#21d4fd" } }, axisLine: { lineStyle: { width: 13, color: [[1, "#444a76"]] } }, pointer: { length: "58%", width: 5, itemStyle: { color: "#f4f5ff" } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { formatter: "{value}%", color: "#f4f5ff", fontSize: 24 }, title: { show: false } }] }, interaction: disabledInteraction },
            { type: "listGroup", id: "livelocations", dataset: "locations", title: "User Locations · Live", span: 12, source: "rows", primaryField: "location", secondaryField: "recordid", valueField: "sessions", maxItems: 8, compact: true, interaction: selectionInteraction("location") },
        ],
        css: `${baseDarkCss}
.hp-grid{padding:16px;background:#17133d}.media-header{display:flex;align-items:flex-end;justify-content:space-between;padding:8px 4px 14px}.media-header span{font-size:9px;font-weight:800;letter-spacing:.12em;color:#21d4fd}.media-header h1{margin:4px 0 0;font-size:36px;font-weight:500}.media-header nav{display:flex;flex-wrap:wrap;gap:7px}.media-header nav b{padding:8px 13px;border:1px solid #4a4f77;border-radius:999px;font-size:9px;font-weight:500}
.hp-component-metricGrid .hp-metric{min-height:112px;background:#292d59}.hp-component-metricGrid .hp-metric-value{font-size:34px}.hp-card,.hp-table-wrap{background:#292d59;border-color:#3b4073}.hp-table th{background:#252951}
`,
    };
    return {
        id: "media-web-performance", title: "Media & Web Performance", useCase: "Marketing, audience, and media monitoring",
        summary: "A dark editorial command board combining media monitoring with website conversion, engagement, and audience KPIs.",
        description: "Blends the coral-framed monitoring reference and the dense website KPI wall into one practical growth dashboard.",
        theme: "dark", accent: "#21d4fd", tags: ["marketing", "media", "web-analytics"], referenceImages: [7, 11], powerBiPackage: "core",
        expected: "Summary metrics, daily trends, medium performance, bounce gauge, and live-location list render from explicit logical record types.",
        limitations: "Location data is shown as a portable ranked list; this Core-profile example intentionally avoids external map tiles.",
        headers, rows, specification, runtime: darkRuntime,
    };
}

function industrialTelemetry(): ExampleDefinition {
    const random = seededRandom(808);
    const headers = ["recordtype", "recordid", "timestamp", "timeorder", "network", "site", "throughput", "latency", "packetloss", "uptime", "temperature", "pressure", "signal", "alertcount", "region", "latitude", "longitude"];
    const rows: Row[] = [{ recordtype: "Summary", recordid: "SUMMARY", throughput: 133, latency: 24, packetloss: 8, uptime: 99.4, temperature: 67, pressure: 85, signal: 75, alertcount: 6 }];
    const networks = ["Core", "Edge", "Backhaul"];
    for (let index = 0; index < 48; index += 1) {
        const nodeIndex = index % 8;
        rows.push({
            recordtype: "Reading", recordid: `READ-${String(index + 1).padStart(3, "0")}`, timestamp: `2026-07-25T${String(index % 24).padStart(2, "0")}:${index % 2 ? "30" : "00"}:00Z`, timeorder: index + 1,
            network: networks[nodeIndex % networks.length], site: `NODE-${1 + nodeIndex}`, throughput: number(70 + Math.sin(index / 3) * 34 + random() * 18, 1),
            latency: number(18 + Math.cos(index / 5) * 8 + random() * 7, 1), packetloss: number(random() * 4.5, 2), uptime: number(98.7 + random() * 1.25, 2),
            temperature: number(54 + random() * 22, 1), pressure: number(65 + random() * 27, 1), signal: number(55 + random() * 40, 1), alertcount: Math.floor(random() * 4),
            region: ["North", "East", "South", "West"][nodeIndex % 4], latitude: number(34 + random() * 10, 5), longitude: number(-119 + random() * 30, 5),
        });
    }
    const specification: Specification = {
        version: "2.0", title: "Industrial Network Telemetry",
        theme: { mode: "dark", density: "compact", primaryColor: "#04d9d2", accentColor: "#f43f9e", surfaceColor: "#142535", textColor: "#dffcff", borderColor: "#224556", successColor: "#04d9d2", warningColor: "#f8e84e", dangerColor: "#f43f5e", radius: 12, cardPadding: 12, gap: 10 },
        data: { datasets: {
            summary: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Summary" } },
            readings: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Reading" }, sort: [{ field: "timeorder", direction: "ascending" }] },
            sites: { source: "readings", groupBy: ["site", "network", "region"], metrics: { throughput: { op: "avg", field: "throughput" }, latency: { op: "avg", field: "latency" }, alerts: { op: "sum", field: "alertcount" }, uptime: { op: "avg", field: "uptime" } }, sort: [{ field: "alerts", direction: "descending" }] },
        } },
        components: [
            { type: "custom", id: "telemetryheader", span: 12, html: "<header class='telemetry-header'><div><span>INDUSTRIAL NETWORK</span><h1>Telemetry Control</h1></div><nav><b>Live</b><b>48 samples</b><b>8 nodes</b></nav></header>", interaction: disabledInteraction },
            { type: "metricGrid", id: "telemetrymetrics", dataset: "summary", span: 12, metrics: [{ title: "Throughput", field: "throughput", aggregation: "first", suffix: " Gbps", intent: "success" }, { title: "Latency", field: "latency", aggregation: "first", suffix: " ms", intent: "warning" }, { title: "Packet Loss", field: "packetloss", aggregation: "first", suffix: "%", intent: "danger" }, { title: "Uptime", field: "uptime", aggregation: "first", suffix: "%", intent: "success" }], interaction: disabledInteraction },
            { type: "gauge", id: "pressuregauge", dataset: "summary", title: "Pressure", span: 2, height: 190, measure: "pressure", aggregation: "first", options: { ...darkChartOptions(["#04d9d2"]), series: [{ min: 0, max: 100, progress: { show: true, width: 12, itemStyle: { color: "#04d9d2" } }, axisLine: { lineStyle: { width: 12, color: [[1, "#203f4e"]] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, detail: { color: "#dffcff", fontSize: 24 }, title: { show: false } }] }, interaction: disabledInteraction },
            { type: "gauge", id: "temperaturegauge", dataset: "summary", title: "Temperature", span: 2, height: 190, measure: "temperature", aggregation: "first", options: { ...darkChartOptions(["#f43f9e"]), series: [{ min: 0, max: 100, progress: { show: true, width: 12, itemStyle: { color: "#f43f9e" } }, axisLine: { lineStyle: { width: 12, color: [[1, "#203f4e"]] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, detail: { color: "#dffcff", fontSize: 24 }, title: { show: false } }] }, interaction: disabledInteraction },
            { type: "gauge", id: "signalgauge", dataset: "summary", title: "Signal", span: 2, height: 190, measure: "signal", aggregation: "first", options: { ...darkChartOptions(["#4db5ff"]), series: [{ min: 0, max: 100, progress: { show: true, width: 12, itemStyle: { color: "#4db5ff" } }, axisLine: { lineStyle: { width: 12, color: [[1, "#203f4e"]] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, detail: { color: "#dffcff", fontSize: 24 }, title: { show: false } }] }, interaction: disabledInteraction },
            { type: "svgMarkup", id: "networktopology", span: 6, heightMode: "fixed", height: 190, viewBox: "0 0 600 190", ariaLabel: "Industrial network topology", description: "Simplified industrial network topology", svg: "<svg viewBox='0 0 600 190' role='img' aria-label='Network topology'><defs><linearGradient id='link' x1='0' x2='1'><stop offset='0' stop-color='#04d9d2'/><stop offset='1' stop-color='#f43f9e'/></linearGradient></defs><rect width='600' height='190' rx='18' fill='#10212f'/><g stroke='url(#link)' stroke-width='2' fill='none' opacity='.8'><path d='M72 95 L190 48 L300 95 L414 45 L532 95'/><path d='M72 95 L190 145 L300 95 L414 145 L532 95'/></g><g fill='#142f3d' stroke='#04d9d2' stroke-width='3'><circle cx='72' cy='95' r='20'/><circle cx='190' cy='48' r='16'/><circle cx='190' cy='145' r='16'/><circle cx='300' cy='95' r='24'/><circle cx='414' cy='45' r='16'/><circle cx='414' cy='145' r='16'/><circle cx='532' cy='95' r='20'/></g><g fill='#dffcff' font-size='10' text-anchor='middle'><text x='72' y='99'>EDGE</text><text x='190' y='52'>N-02</text><text x='190' y='149'>N-03</text><text x='300' y='99'>CORE</text><text x='414' y='49'>N-06</text><text x='414' y='149'>N-07</text><text x='532' y='99'>WAN</text></g></svg>", interaction: disabledInteraction },
            { type: "comboChart", id: "networkwaves", dataset: "readings", title: "Network Waveforms", span: 8, height: 310, category: "timestamp", series: [{ field: "throughput", label: "Throughput", chartType: "line", aggregation: "first" }, { field: "latency", label: "Latency", chartType: "line", aggregation: "first" }, { field: "signal", label: "Signal", chartType: "line", aggregation: "first" }], options: { ...darkChartOptions(["#04d9d2", "#f43f9e", "#4db5ff"]), series: [{ smooth: true, symbol: "none", lineStyle: { width: 2 }, areaStyle: { opacity: .08 } }, { smooth: true, symbol: "none", lineStyle: { width: 2 } }, { smooth: true, symbol: "none", lineStyle: { width: 2 } }] }, interaction: selectionInteraction("timestamp") },
            { type: "table", id: "nodestatus", dataset: "sites", title: "Node Health", span: 4, columns: [{ field: "site", title: "Node" }, { field: "network", title: "Network" }, { field: "throughput", title: "Gbps", format: "number", hozAlign: "right" }, { field: "latency", title: "Latency", format: "number", hozAlign: "right" }, { field: "alerts", title: "Alerts", format: "integer", hozAlign: "right" }, { field: "uptime", title: "Uptime", format: "number", hozAlign: "right" }], pagination: false, maxRows: 10, hover: true, interaction: selectionInteraction("site") },
        ],
        css: `${baseDarkCss}
.hp-grid{padding:18px;background:radial-gradient(circle at 50% 10%,#183949,#0b1a27 50%,#08131e)}.telemetry-header{display:flex;align-items:center;justify-content:space-between;padding:4px 2px 10px}.telemetry-header span{color:#04d9d2;font-size:9px;font-weight:800;letter-spacing:.14em}.telemetry-header h1{margin:4px 0 0;font-size:30px;font-weight:500}.telemetry-header nav{display:flex;gap:7px}.telemetry-header nav b{padding:7px 11px;border:1px solid #27556a;border-radius:999px;color:#8ddde1;font-size:9px}
.hp-card,.hp-metric,.hp-table-wrap{background:linear-gradient(145deg,#142735,#10202d);border-color:#244859;box-shadow:inset 0 1px 0 rgb(255 255 255 / 3%),0 16px 38px rgb(0 0 0 / 24%)}.hp-component-metricGrid .hp-metric{border-bottom:2px solid var(--hp-intent,#04d9d2)}.hp-component-svgMarkup{border:1px solid #244859;border-radius:12px;overflow:hidden}
`,
    };
    return {
        id: "industrial-network-telemetry", title: "Industrial Network Telemetry", useCase: "Network, plant, and infrastructure telemetry",
        summary: "A deep-teal telemetry wall with neon gauges, network topology, waveform analysis, and node health.",
        description: "Represents the futuristic HUD references using safe ECharts options and sanitized inline SVG rather than external raster artwork.",
        theme: "dark", accent: "#04d9d2", tags: ["industrial", "telemetry", "network"], referenceImages: [9, 10], powerBiPackage: "core",
        expected: "Summary gauges, topology, ordered multiseries telemetry, and grouped node-health records render without network access.",
        limitations: "The topology is a schematic network map; advanced 3D surfaces and geographic basemaps are intentionally omitted from the Core package.",
        headers, rows, specification, runtime: darkRuntime,
    };
}

const examples: ExampleDefinition[] = [
    talentAcquisition(),
    capitalProjectControls(),
    retailSalesOperations(),
    urbanMobility(),
    patientCareOperations(),
    digitalBanking(),
    mediaWebPerformance(),
    industrialTelemetry(),
];

function readme(example: ExampleDefinition): string {
    const packageInstruction = example.powerBiPackage === "maps"
        ? "Import the HyperPBI Maps PBIVIZ package. The package must include the OpenStreetMap WebAccess declaration."
        : "Import the HyperPBI Core PBIVIZ package.";
    const projectDescription = example.powerBiPackage === "maps"
        ? "complete Playground project with embedded synthetic rows, stable row keys, and an OpenStreetMap basemap configuration."
        : "complete offline Playground project with normalized rows and stable row keys.";
    const playgroundDataDescription = example.powerBiPackage === "maps"
        ? "The synthetic dataset is embedded locally and the bundle contains no credentials. The configured OpenStreetMap basemap fetches remote tiles, so a network connection is required to display the basemap."
        : "The bundle is local-first and contains no credentials or remote data.";
    return `# ${example.title}

${example.description}

## Files

- \`specification.json\` — strict HyperPBI dashboard schema 2.0.
- \`runtime.json\` — Runtime Configuration protocol 1.0.
- \`data.csv\` — deterministic synthetic source data.
- \`project.hyperpbi\` — ${projectDescription}

## Playground

Load this example from the Dashboard Examples gallery, or import \`project.hyperpbi\` from the Playground home page. ${playgroundDataDescription}

## Power BI

1. ${packageInstruction}
2. Import \`data.csv\` as one table.
3. Add every column to HyperPBI's single **Values** field well. Keep the simple lowercase column names unchanged.
4. Paste \`runtime.json\` into Runtime Configuration.
5. Paste \`specification.json\` into Advanced JSON, validate, preview, and save.

All logical datasets use the portable \`powerbi\` source alias. The CSV has ${example.headers.length} fields, below the visual's 50-field limit, and ${example.rows.length} rows, below the 30,000-row Power BI window.

## Source fields

${example.headers.map(field => `- \`${field}\``).join("\n")}

## Expected behavior

${example.expected}

## Limitations

${example.limitations}

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
`;
}

await mkdir(outputRoot, { recursive: true });
const manifestExamples: Array<Record<string, unknown>> = [];

for (const example of examples) {
    const directory = resolve(outputRoot, example.id);
    await mkdir(directory, { recursive: true });
    const csvText = toCsv(example.headers, example.rows);
    await writeFile(resolve(directory, "specification.json"), `${JSON.stringify(example.specification, null, 2)}\n`, "utf8");
    await writeFile(resolve(directory, "runtime.json"), `${JSON.stringify(example.runtime, null, 2)}\n`, "utf8");
    await writeFile(resolve(directory, "data.csv"), csvText, "utf8");
    await writeFile(resolve(directory, "README.md"), readme(example), "utf8");

    const instantiated = instantiateDashboardExample({
        id: example.id,
        title: example.title,
        specification: example.specification,
        runtimeConfiguration: example.runtime,
        csvText,
        dataFileName: "data.csv",
    }, {
        projectId: `example-${example.id}`,
        createdAt: fixedTimestamp,
        updatedAt: fixedTimestamp,
        requirePowerBiCompatible: true,
    });
    await writeFile(resolve(directory, "project.hyperpbi"), `${exportProjectBundle(instantiated.project)}\n`, "utf8");

    manifestExamples.push({
        id: example.id,
        slug: example.id,
        title: example.title,
        useCase: example.useCase,
        summary: example.summary,
        description: example.description,
        theme: example.theme,
        accent: example.accent,
        tags: example.tags,
        referenceImages: example.referenceImages,
        folder: example.id,
        specification: `${example.id}/specification.json`,
        runtime: `${example.id}/runtime.json`,
        data: `${example.id}/data.csv`,
        project: `${example.id}/project.hyperpbi`,
        powerBiPackage: example.powerBiPackage,
        expected: example.expected,
        limitations: example.limitations,
    });
}

await writeFile(resolve(outputRoot, "manifest.json"), `${canonicalJson({ version: "1.0", examples: manifestExamples })}\n`, "utf8");
console.log(`Generated ${examples.length} portable dashboard examples in ${outputRoot}.`);
