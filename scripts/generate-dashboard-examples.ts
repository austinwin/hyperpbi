import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defaultConfig, type HyperPbiConfig } from "../src/config/hyperpbiConfig";
import { instantiateDashboardExample } from "../src/playground/dashboardExample";
import { canonicalJson } from "../src/playground/canonicalJson";
import { exportProjectBundle } from "../src/playground/projectBundle";
import type { Scene3dComponent, Scene3dObject, Scene3dVector } from "../src/schema/scene3dSchema";

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
    previewImage?: string;
    powerBiPackage: "core" | "maps";
    expected: string;
    limitations: string;
    liveApi?: string;
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

const demoApi = "https://functions.miniup.app/hyperpbi-dynamic-demo";
const demoRuntime: HyperPbiConfig = { ...lightRuntime, providers: { ...lightRuntime.providers, mode: "maps" } };
const liveLimitations = "The local CSV is synthetic. Live details require HTTPS access to the public MiniUp Function. In Power BI, the Maps package and runtime WebAccess permission are required.";
const demoTheme = { mode: "light", density: "comfortable", primaryColor: "#0f766e", accentColor: "#0284c7", radius: 12, cardPadding: 14, gap: 14 };
const header = (id: string, title: string, instructions: string) => ({ type: "markdown", id, text: `# ${title}\n\n${instructions}` });

function dynamicGisAnalytics(): ExampleDefinition {
    const rows = [
        { siteid: "1024", name: "North pressure station", zone: "North Loop", latitude: 29.79, longitude: -95.382 },
        { siteid: "1025", name: "River pressure station", zone: "East River", latitude: 29.752, longitude: -95.34 },
        { siteid: "1026", name: "West pressure station", zone: "West Loop", latitude: 29.766, longitude: -95.427 },
    ];
    const features = rows.map(({ siteid, latitude, longitude, ...properties }) => ({
        type: "Feature", id: siteid, geometry: { type: "Point", coordinates: [longitude, latitude] }, properties: { ...properties, site_id: siteid },
    }));
    const specification = {
        version: "2.0", title: "Dynamic GIS Analytics", theme: demoTheme,
        toolbar: [header("gis_intro", "Water distribution · Houston", "Select a pressure station to inspect its last 24 hours, measurements, and next maintenance action.")],
        components: [
            { type: "map", id: "sensor_map", title: "Pressure monitoring network", heightMode: "fill", minHeight: 420, basemap: { type: "none" },
                view: { center: [29.77, -95.385], zoom: 12, fitMode: "none" }, featureDetails: { mode: "auto" },
                toolbar: { visible: true, home: true, zoomIn: true, zoomOut: true }, layers: [
                    { id: "mains", name: "Illustrative distribution mains", source: { type: "geoJson", data: { type: "FeatureCollection", features: [
                        { type: "Feature", geometry: { type: "LineString", coordinates: [[-95.427, 29.766], [-95.404, 29.777], [-95.382, 29.79], [-95.366, 29.765], [-95.34, 29.752]] }, properties: {} },
                    ] } }, renderer: { type: "simple", symbol: { outlineColor: "#438d9b", outlineWidth: 4 } }, popup: { mode: "none" }, interaction: disabledInteraction },
                    { id: "sensors", name: "Pressure sensors", source: { type: "geoJson", data: { type: "FeatureCollection", features } },
                        renderer: { type: "simple", symbol: { shape: "circle", fillColor: "#0f766e", size: 18, outlineColor: "#ffffff", outlineWidth: 3 } },
                        labels: { enabled: true, field: "name", fieldSource: "service", placement: "right", color: "#0f766e", size: 12 },
                        tooltip: { enabled: true, template: "{{service.name}} · Click for pressure analytics" },
                        popup: { mode: "dynamic", title: "{{service.name}}", width: 540, maxHeight: 560,
                            request: { endpoint: `${demoApi}/sensor?id={{context.site_id}}`, cacheTtlSeconds: 30, timeoutMs: 10000, fallbackMessage: "Station telemetry is temporarily unavailable." } },
                        interaction: { enabled: true, externalMode: "none" } },
                ] },
        ],
    };
    return {
        id: "dynamic-gis-analytics", title: "Dynamic GIS Analytics", useCase: "Water utility pressure monitoring",
        summary: "Three Houston pressure stations open interactive, live API analytics in map popups.",
        description: "A synthetic water distribution network pairs inline station geometry with on-demand pressure telemetry, operating assignments, and maintenance notes.",
        theme: "light", accent: "#0f766e", tags: ["GIS", "utilities", "live-api"], referenceImages: [], powerBiPackage: "maps",
        expected: "Click each station to load different pressure readings. Hover or zoom its chart, expand the popup, page through the measurements, or refresh the station data.",
        limitations: liveLimitations, liveApi: `${demoApi}/sensor?id=1024`,
        headers: Object.keys(rows[0]), rows, specification, runtime: demoRuntime,
    };
}

function universalDynamicContent(): ExampleDefinition {
    const rows = [
        { assetid: "P-204", asset: "Intake pump 204", zone: "North Loop", priority: "High", hours: 14 },
        { assetid: "V-118", asset: "Isolation valve 118", zone: "East River", priority: "Normal", hours: 6 },
        { assetid: "M-307", asset: "Flow meter 307", zone: "West Loop", priority: "Normal", hours: 4 },
        { assetid: "P-209", asset: "Booster pump 209", zone: "North Loop", priority: "High", hours: 9 },
    ];
    const specification = {
        version: "2.0", title: "Universal Dynamic Content", theme: { ...demoTheme, primaryColor: "#3156a8", accentColor: "#0d9488" },
        toolbar: [header("work_intro", "Utility maintenance · Dispatch", "Select an asset for its live work plan. Change the priority or refresh the workload to query the dispatch API.")],
        components: [
            { type: "card", id: "work_queue", header: { title: "Scheduled work orders" }, children: [
                { type: "flex", id: "work_controls", gap: 12, children: [
                    { type: "select", id: "priority", title: "Work priority", field: "priority", options: ["High", "Normal"],
                        interaction: { enabled: true, internalMode: "filter", targets: ["assets"], externalMode: "none" } },
                    { type: "button", id: "refresh_workload", title: "Refresh workload" },
                ] },
                { type: "table", id: "assets", title: "Assets", columns: [{ field: "assetid", title: "Asset ID" }, { field: "asset", title: "Equipment" }, { field: "zone", title: "Zone" }, { field: "priority", title: "Priority" }],
                    hover: true, interaction: { enabled: true, internalMode: "highlight", internalScope: "self", externalMode: "none" } },
            ] },
            { type: "card", id: "dispatch", header: { title: "Dispatch workload" }, children: [
                { type: "dynamicContent", id: "workload", title: "Workload", loadOnMount: true,
                    trigger: { source: "refresh_workload", event: "click", refresh: true },
                    request: { endpoint: `${demoApi}/backlog?priority={{state.priority}}`, cacheTtlSeconds: 30 } },
            ] },
        ],
        rightPanel: [
            { type: "card", id: "asset_panel", header: { title: "Asset work plan" }, children: [
                { type: "dynamicContent", id: "asset_details", title: "Asset details", emptyText: "Select a work order to see its assignment and scheduled tasks.",
                    trigger: { source: "assets", event: "click" }, request: { endpoint: `${demoApi}/asset?id={{context.assetid}}`, cacheTtlSeconds: 30 } },
            ] },
        ],
    };
    return {
        id: "universal-dynamic-content", title: "Universal Dynamic Content", useCase: "Maintenance dispatch and asset work orders",
        summary: "Select a work order to open its live details, and query workload independently by priority.",
        description: "A maintenance dispatcher browses a local asset queue while a responsive side panel and workload card fetch their component trees from MiniUp.",
        theme: "light", accent: "#3156a8", tags: ["maintenance", "work-orders", "live-api"], referenceImages: [], powerBiPackage: "maps",
        expected: "Select P-204 or another asset to load its work plan in the side panel. Select High under Work priority to query the filtered workload, then click Refresh workload to repeat the live request.",
        limitations: liveLimitations, liveApi: `${demoApi}/asset?id=P-204`,
        headers: Object.keys(rows[0]), rows, specification, runtime: demoRuntime,
    };
}

function pumpStationMonitoring(): ExampleDefinition {
    const title = "Pump Station Monitoring";
    const pumps = [
        { id: "P-101", name: "Booster 01", x: -3.3, flow: 1280, pressure: 68.4, load: 72 },
        { id: "P-102", name: "Booster 02", x: -1.1, flow: 1150, pressure: 65.8, load: 67 },
        { id: "P-103", name: "Booster 03", x: 1.1, flow: 1010, pressure: 62.0, load: 82 },
        { id: "P-104", name: "Standby 04", x: 3.3, flow: 980, pressure: 64.3, load: 65 },
    ];
    const scenarios = ["Normal duty", "Peak demand", "Maintenance"];
    const palette = [
        { value: "Running", color: "#29b99a" }, { value: "Warning", color: "#efaa49" }, { value: "Stopped", color: "#8298ae" },
    ];
    const rows: Row[] = scenarios.flatMap((scenario, mode) => {
        const assets = pumps.map((pump, index) => {
            const stopped = mode === 0 && index === 3 || mode === 2 && index === 1;
            const warning = mode === 1 && index === 2;
            return {
                equipmentid: pump.id, equipment: pump.name, scenario,
                status: stopped ? "Stopped" : warning ? "Warning" : "Running",
                flowgpm: stopped ? 0 : Math.round(pump.flow * (mode === 1 ? 1.14 : 1)),
                pressurepsi: stopped ? 0 : number(pump.pressure + (warning ? -6.1 : mode === 1 ? 2.4 : 0), 1),
                motorloadpct: stopped ? 0 : warning ? 94 : pump.load + (mode === 1 ? 9 : 0),
            };
        });
        const stationflow = assets.reduce((sum, asset) => sum + asset.flowgpm, 0);
        const online = assets.filter(asset => asset.status !== "Stopped");
        const stationpressure = number(online.reduce((sum, asset) => sum + asset.pressurepsi, 0) / online.length, 1);
        const stationalerts = assets.filter(asset => asset.status === "Warning").length;
        return assets.flatMap((asset, index) => {
            const base = { ...asset, stationflow, stationpressure, stationalerts, stationonline: online.length };
            const snapshot = { ...base, readingid: `${mode}-${asset.equipmentid}-snapshot`, recordtype: "Snapshot", sampleorder: 100 - mode, hour: "Snapshot" };
            const trend = Array.from({ length: 10 }, (_value, hour) => ({
                ...base, readingid: `${mode}-${asset.equipmentid}-${hour}`, recordtype: "Trend", sampleorder: hour,
                hour: `${String(hour + 7).padStart(2, "0")}:00`,
                pressurepsi: asset.pressurepsi ? number(asset.pressurepsi + Math.sin(hour * 0.62 + index * 0.8) * 1.4 + Math.cos(hour * 0.28) * 0.75, 1) : 0,
            }));
            return [snapshot, ...trend];
        });
    });
    const objects: Scene3dObject[] = pumps.map(pump => ({
        id: pump.id, kind: "pump", label: pump.id, dataKey: pump.id, position: [pump.x, 0, 0.55],
    }));
    const pipe = (id: string, position: Scene3dVector, length: number, axis: "x" | "y" | "z", diameter = 0.24, color = "#3b94bb") => {
        const rotation: Scene3dVector = axis === "x" ? [0, 0, 90] : axis === "z" ? [90, 0, 0] : [0, 0, 0];
        objects.push({ id, kind: "pipe", position, rotation, size: [diameter, length, diameter], color, metalness: 0.33 });
    };
    for (const [index, x] of [-2.55, 2.55].entries()) {
        objects.push({ id: `vessel_${index}`, kind: "tank", label: `V-20${index + 1}`, position: [x, 0, -2.35], size: [1.05, 0.94, 1.05] });
        pipe(`vessel_inlet_${index}`, [x, 0.46, -1.17], 0.76, "z", 0.31);
    }
    pipe("inlet_header", [0, 0.46, -0.92], 8.7, "x", 0.34);
    pipe("inlet_feed", [-4.35, 0.46, -2.04], 2.3, "z", 0.34);
    pipe("outlet_header", [0, 1.39, 2.2], 9.3, "x", 0.33, "#477fae");
    pipe("outlet_feed", [4.57, 1.39, 3], 1.58, "z", 0.33, "#477fae");
    for (const [index, pump] of pumps.entries()) {
        pipe(`suction_${index}`, [pump.x - 0.75, 0.46, -0.31], 1.24, "z", 0.23);
        pipe(`riser_${index}`, [pump.x - 0.59, 1.41, 0.55], 0.27, "y", 0.22);
        pipe(`discharge_${index}`, [pump.x - 0.59, 1.39, 1.39], 1.65, "z", 0.21, "#477fae");
        pipe(`flange_${index}`, [pump.x - 0.59, 1.39, 1.77], 0.12, "z", 0.35, "#90aabc");
    }
    for (const [index, x] of [-4.6, 0, 4.6].entries()) {
        objects.push({ id: `header_support_${index}`, kind: "box", position: [x, 0.61, 2.2], size: [0.14, 1.22, 0.16], color: "#66829a" });
    }
    const targetIds = ["station_scene", "station_online", "station_flow", "station_pressure", "station_alerts", "pressure_trend", "motor_load", "asset_register"];
    const scene: Scene3dComponent = {
        type: "scene3d", id: "station_scene", title: "Booster gallery · spatial overview", dataset: "equipment_readings",
        objectIdField: "equipmentid", statusField: "status", statusColors: palette,
        tooltipFields: [{ field: "equipment", label: "Equipment" }, { field: "flowgpm", label: "Flow (GPM)" },
            { field: "pressurepsi", label: "Pressure (PSI)" }, { field: "motorloadpct", label: "Motor load (%)" }],
        objects, height: 410, theme: "dark",
        interaction: { ...selectionInteraction("equipmentid"), internalMode: "filter", targets: ["pressure_trend", "motor_load", "asset_register"] },
    };
    const specification: Specification = {
        version: "2.0", title,
        theme: { mode: "dark", density: "compact", primaryColor: "#54bcff", accentColor: "#29b99a", surfaceColor: "#101e2e", textColor: "#e7f1ff", borderColor: "#2b4159", successColor: "#29b99a", warningColor: "#efaa49", radius: 12, gap: 10 },
        app: {
            enabled: true, layout: "horizontal", container: "fluid", density: "compact",
            brand: { title: "Northbank Water", shortTitle: "NW", subtitle: "Operations", icon: "dashboard" },
            navbar: { visible: true },
            pageHeader: {
                visible: true, title: "Booster Station 07", subtitle: "Pump station monitoring · Distribution operations",
                meta: [{ label: "Telemetry", value: "Simulated", intent: "info" }],
            },
        },
        data: { datasets: {
            equipment_readings: { source: "powerbi", sort: [{ field: "sampleorder", direction: "descending" }] },
            snapshots: { source: "equipment_readings", filter: { field: "recordtype", operator: "=", value: "Snapshot" } },
            pressure_history: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Trend" }, sort: [{ field: "sampleorder", direction: "ascending" }] },
        } },
        styles: { globalCss: baseDarkCss },
        components: [
            { type: "segmentedControl", id: "operating_scenario", label: "Operating scenario", field: "scenario", options: scenarios, interaction: { internalMode: "filter", targets: targetIds, externalMode: "none" } },
            { type: "grid", id: "station_kpis", columns: 12, children: [
                { type: "kpi", id: "station_online", title: "Pumps online", dataset: "snapshots", field: "stationonline", aggregation: "first", span: 3, intent: "success" },
                { type: "kpi", id: "station_flow", title: "Station flow (GPM)", dataset: "snapshots", field: "stationflow", aggregation: "first", span: 3 },
                { type: "kpi", id: "station_pressure", title: "Discharge pressure (PSI)", dataset: "snapshots", field: "stationpressure", aggregation: "first", span: 3 },
                { type: "kpi", id: "station_alerts", title: "Active alerts", dataset: "snapshots", field: "stationalerts", aggregation: "first", span: 3, intent: "warning" },
            ] },
            scene,
            { type: "grid", id: "station_trends", columns: 12, children: [
                { type: "lineChart", id: "pressure_trend", title: "Discharge pressure · PSI", dataset: "pressure_history", category: "hour", measure: "pressurepsi", aggregation: "avg",
                    span: 7, height: 270, options: darkChartOptions(["#58bcf4"]), interaction: disabledInteraction },
                { type: "barChart", id: "motor_load", title: "Motor utilization · %", dataset: "snapshots", category: "equipmentid", measure: "motorloadpct", aggregation: "first",
                    span: 5, height: 270, options: darkChartOptions(["#36c3ae"]), interaction: { ...selectionInteraction("equipmentid"), targets: ["station_scene"] } },
            ] },
            { type: "table", id: "asset_register", title: "Snapshot register", dataset: "snapshots", maxRows: 12,
                columns: [
                    { field: "equipmentid", title: "Asset" }, { field: "equipment", title: "Equipment" }, { field: "scenario", title: "Scenario" },
                    { field: "status", title: "Status" }, { field: "flowgpm", title: "Flow (GPM)" },
                    { field: "pressurepsi", title: "Pressure (PSI)" }, { field: "motorloadpct", title: "Motor load (%)" },
                ], interaction: { ...selectionInteraction("equipmentid"), targets: ["station_scene"] } },
        ],
    };
    return {
        id: "pump-station-monitoring", title, useCase: "Water utility operations and equipment telemetry",
        summary: "Explore a 3D booster station, rehearse changing duty conditions, and trace each pump to its operating history.",
        description: "Northbank Water's fictional booster station pairs four selectable centrifugal pump assemblies with pressure vessels, suction and discharge manifolds, and synthetic operating records. The spatial view, station KPIs, pressure trend, motor-load chart, and snapshot register all use the same source data.",
        theme: "dark", accent: "#54bcff", tags: ["3D", "utilities", "SCADA"], referenceImages: [],
        previewImage: "/images/pump-station-monitoring.webp", powerBiPackage: "core",
        expected: "Choose Peak demand to flag P-103 and start the standby pump, or Maintenance to stop P-102. Select equipment in the scene or its keyboard-accessible list to filter the trend, motor-load chart, and register. Select a motor-load bar or snapshot row to highlight its pump. Select the same asset again or clear the scene selection to restore the linked views. All uses the newest snapshot for station KPIs and asset status and averages pressure across the available scenarios.",
        limitations: "The three operating scenarios are precomputed snapshots. The project works offline and uses procedural equipment geometry. In Power BI, include readingid as a categorical column and set numeric fields to Don't summarize to preserve distinct reading rows. Configure Power BI visual interactions to test the selected rows against a second visual.",
        headers: ["readingid", "equipmentid", "equipment", "scenario", "status", "recordtype", "sampleorder", "hour", "flowgpm", "pressurepsi", "motorloadpct", "stationflow", "stationpressure", "stationalerts", "stationonline"],
        rows, specification, runtime: darkRuntime,
    };
}

function groundwaterSupplyDistribution(): ExampleDefinition {
    const title = "Groundwater Supply & Distribution";
    const assets = [
        ["W-01", "Local well", "Groundwater abstraction"],
        ["W-02", "Remote well", "Groundwater abstraction"],
        ["TP-01", "Groundwater plant", "Treatment and storage"],
        ["P-01", "Distribution pump", "High-service pumping"],
        ["R-01", "Maple Court", "Residential delivery"],
        ["R-02", "Cedar Lane", "Residential delivery"],
        ["R-03", "Birch Grove", "Residential delivery"],
        ["CW-01", "Clearwell", "Treated water storage"],
    ];
    const scenarios = [
        { name: "Normal flow", local: 620, remote: 440, pressure: 61, level: 78, hourlyChange: 2 },
        { name: "Remote well offline", local: 650, remote: 0, pressure: 47, level: 43, hourlyChange: -4 },
        { name: "Peak demand", local: 780, remote: 570, pressure: 57, level: 61, hourlyChange: -1.5 },
    ];
    const rows: Row[] = scenarios.flatMap((scenario, index) => {
        const raw = scenario.local + scenario.remote;
        const delivered = Math.round(raw * 0.97);
        const maple = Math.round(delivered * 0.35);
        const cedar = Math.round(delivered * 0.34);
        const flows = [scenario.local, scenario.remote, raw, delivered, maple, cedar, delivered - maple - cedar, delivered];
        return assets.flatMap(([assetid, asset, stage], i) => {
            const tank = assetid === "CW-01";
            const pump = i === 0 || i === 1 || i === 3;
            const status = tank ? "Storage" : flows[i] === 0 ? "Offline" : index === 1 && i >= 3 ? "Reduced flow" : "Running";
            const equipmentcolor = pump ? flows[i] > 0 ? "#26a66a" : "#d9484b" : null;
            const row = { assetid, asset, stage, scenario: scenario.name, status, equipmentcolor, flowgpm: flows[i], levelpct: tank ? scenario.level : null,
                wellsactive: scenario.remote ? 2 : 1, rawgpm: raw, deliveredgpm: delivered, mainpsi: scenario.pressure };
            return [
                { ...row, readingid: `${index}-${assetid}-snapshot`, recordtype: "Snapshot", sampleorder: 100 - index, hour: "Snapshot" },
                ...Array.from({ length: 8 }, (_value, hour) => ({
                    ...row, readingid: `${index}-${assetid}-${hour}`, recordtype: "Trend", sampleorder: hour * scenarios.length + index,
                    hour: `${String(hour + 6).padStart(2, "0")}:00`,
                    flowgpm: Math.round(row.flowgpm * (0.95 + 0.06 * Math.sin(hour * 0.56))),
                    levelpct: tank ? Math.round(scenario.level - (7 - hour) * scenario.hourlyChange) : null,
                })),
            ];
        });
    });

    const objects: Scene3dObject[] = [];
    const rawPipe = "#179587";
    const treatedPipe = "#317bc5";
    const shape = (id: string, kind: Scene3dObject["kind"], position: Scene3dVector, size: Scene3dVector, color: string,
        rotation?: Scene3dVector, asset?: typeof assets[number]) => {
        objects.push({ id, kind, position, size, color, rotation, ...(asset ? { dataKey: asset[0], label: asset[1] } : {}) });
    };
    const pipeRotation: Record<"x" | "-x" | "z" | "-z", Scene3dVector> = { x: [0, 0, -90], "-x": [0, 0, 90], z: [90, 0, 0], "-z": [-90, 0, 0] };
    const pipe = (id: string, x: number, y: number, z: number, length: number, axis: keyof typeof pipeRotation, color: string, flowKey: string, width = 0.22) => {
        const rotation = pipeRotation[axis];
        objects.push({ id, kind: "pipe", position: [x, y, z], size: [width, length, width], color, rotation, flowKey });
    };
    const arrow = (id: string, x: number, y: number, z: number, color: string) => {
        shape(id, "cone", [x, y, z], [0.36, 0.48, 0.36], color, [0, 0, -90]);
    };
    for (const [index, z] of [-2.4, 2.3].entries()) {
        shape(`well_pad_${index}`, "box", [-6.65, 0.08, z], [2.15, 0.16, 1.58], index ? "#b6aa96" : "#a9b7c4");
        shape(`well_casing_${index}`, "cylinder", [-7.25, 0.39, z - 0.48], [0.45, 0.63, 0.45], "#6d899c");
        shape(`well_pump_${index}`, "pump", [-6.56, 0.16, z], [0.84, 0.82, 0.85], rawPipe, undefined, assets[index]);
        pipe(`well_lateral_${index}`, -4.71, 0.66, z, 2.35, "x", rawPipe, assets[index][0]);
        arrow(`well_direction_${index}`, -4.68, 0.66, z, "#57cebb");
    }
    pipe("local_collection", -3.53, 0.66, -0.91, 2.98, "z", rawPipe, "W-01");
    pipe("remote_collection", -3.53, 0.66, 1.44, 1.72, "-z", rawPipe, "W-02");
    pipe("plant_inlet", -3.05, 0.66, 0.58, 1.05, "x", rawPipe, "TP-01", 0.25);

    shape("plant_slab", "box", [-1.41, 0.09, -0.04], [2.85, 0.18, 2.6], "#9caebe");
    shape("plant", "box", [-1.41, 0.79, -0.04], [2.4, 1.22, 1.97], "#b9d1d9", undefined, assets[2]);
    shape("plant_roof", "box", [-1.41, 1.43, -0.04], [2.58, 0.17, 2.13], "#3e647e");
    shape("plant_door", "box", [-1.53, 0.56, 0.96], [0.54, 0.76, 0.06], "#254966");
    shape("plant_window", "box", [-0.72, 0.94, 0.96], [0.58, 0.3, 0.07], "#365e76");
    shape("clearwell", "tank", [2.25, 0, -2.4], [0.88, 0.92, 0.88], "#a4bfcb", undefined, assets[7]);
    pipe("clearwell_outlet", 2.25, 0.74, -1.43, 0.56, "z", treatedPipe, "CW-01");
    pipe("clearwell_return", 1.315, 0.74, -1.15, 1.87, "-x", treatedPipe, "CW-01");
    pipe("clearwell_connection", 0.38, 0.74, -0.285, 1.73, "z", treatedPipe, "CW-01");
    pipe("plant_outlet", 0.02, 0.74, 0.58, 0.66, "x", treatedPipe, "P-01", 0.26);
    shape("high_service_pump", "pump", [1.22, 0, 0.58], [1.02, 1, 1.02], treatedPipe, undefined, assets[3]);
    pipe("distribution_main", 3.72, 0.74, 0.58, 3.35, "x", treatedPipe, "P-01", 0.29);
    arrow("distribution_direction", 3.6, 0.74, 0.58, "#8bcaff");
    pipe("north_neighborhood_header", 5.38, 0.74, -0.93, 3.02, "-z", treatedPipe, "R-01");
    pipe("south_neighborhood_header", 5.38, 0.74, 1.745, 2.33, "z", treatedPipe, "R-03");

    for (const [index, z] of [-2.44, 0.23, 2.91].entries()) {
        const x = 6.78;
        shape(`house_lot_${index}`, "box", [x, 0.06, z], [2.24, 0.12, 1.94], "#a5b8a8");
        shape(`house_${index}`, "box", [x, 0.62, z], [1.32, 1, 1.19], "#c2d3db", undefined, assets[index + 4]);
        const roof = ["#476887", "#5b6286", "#486e72"][index];
        for (const side of [-1, 1]) shape(`house_roof_${index}_${side === 1 ? "south" : "north"}`, "box",
            [x, 1.27, z + side * 0.3], [1.55, 0.11, 0.78], roof, [side * 25, 0, 0]);
        shape(`house_door_${index}`, "box", [x - 0.27, 0.4, z + 0.61], [0.25, 0.55, 0.05], "#314a63");
        shape(`house_window_${index}`, "box", [x + 0.29, 0.78, z + 0.61], [0.35, 0.23, 0.05], "#e1ecf5");
        pipe(`house_service_${index}`, 5.77, 0.74, z, 0.78, "x", treatedPipe, assets[index + 4][0], 0.15);
    }
    const linked = ["groundwater_flow", "groundwater_by_asset", "groundwater_assets"];
    const kpis = [
        ["groundwater_wells", "Active source wells", "wellsactive"], ["groundwater_raw", "Plant intake (GPM)", "rawgpm"],
        ["groundwater_delivered", "Residential delivery (GPM)", "deliveredgpm"], ["groundwater_pressure", "Distribution main (PSI)", "mainpsi"],
        ["groundwater_level", "Clearwell level (%)", "levelpct"],
    ];
    const scene: Scene3dComponent = {
        type: "scene3d", id: "groundwater_scene", title: "Source to tap · hydraulic schematic", dataset: "asset_readings",
        height: 455, theme: "light", objectIdField: "assetid", statusField: "status", colorField: "equipmentcolor",
        levelField: "levelpct", flowField: "flowgpm", objects,
        statusColors: [{ value: "Reduced flow", color: "#db9a39" }, { value: "Offline", color: "#7b8798" }],
        tooltipFields: [{ field: "stage", label: "Stage" }, { field: "flowgpm", label: "Flow (GPM)" }],
        interaction: { ...selectionInteraction("assetid"), internalMode: "filter", targets: linked },
    };
    const specification: Specification = {
        version: "2.0", title,
        theme: { mode: "dark", density: "compact", primaryColor: "#6eb5ff", surfaceColor: "#101e2e", textColor: "#e7f1ff", borderColor: "#2b4159", radius: 12, gap: 10 },
        app: {
            enabled: true, layout: "horizontal", container: "fluid", density: "compact",
            brand: { title: "Ridgeway Water", shortTitle: "RW", subtitle: "Groundwater operations", icon: "dashboard" },
            navbar: { visible: true },
            pageHeader: { visible: true, title, subtitle: "Local well and remote well → treatment → distribution pump → residential service",
                meta: [{ label: "Telemetry", value: "Simulated", intent: "info" }] },
        },
        data: { datasets: {
            asset_readings: { source: "powerbi", sort: [{ field: "sampleorder", direction: "descending" }] },
            snapshots: { source: "asset_readings", filter: { field: "recordtype", operator: "=", value: "Snapshot" } },
            flow_history: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Trend" }, sort: [{ field: "sampleorder", direction: "ascending" }] },
            storage_snapshot: { source: "snapshots", filter: { field: "assetid", operator: "=", value: "CW-01" } },
            storage_history: { source: "flow_history", filter: { field: "assetid", operator: "=", value: "CW-01" } },
        } },
        styles: { globalCss: baseDarkCss },
        components: [
            { type: "segmentedControl", id: "groundwater_scenario", label: "Operating scenario", field: "scenario", options: scenarios.map(item => item.name),
                interaction: { internalMode: "filter", targets: ["groundwater_scene", ...kpis.map(([id]) => id), ...linked, "groundwater_level_history"], externalMode: "none" } },
            { type: "grid", id: "groundwater_kpis", columns: 12, children: kpis.map(([id, title, field], index) =>
                ({ type: "kpi", id, title, field, dataset: field === "levelpct" ? "storage_snapshot" : "snapshots", aggregation: "first", span: index < 3 ? 2 : 3 })) },
            { type: "text", id: "groundwater_legend", text: "Teal pipes carry raw groundwater. Blue pipes carry treated water. Green pumps are running and red pumps are stopped. Select the Clearwell tank to inspect its water level." },
            scene,
            { type: "grid", id: "groundwater_charts", columns: 12, children: [
                { type: "lineChart", id: "groundwater_flow", title: "Mean flow profile · GPM", dataset: "flow_history", category: "hour", measure: "flowgpm",
                    aggregation: "avg", span: 4, height: 270, options: darkChartOptions(["#6eb5ff"]), interaction: disabledInteraction },
                { type: "barChart", id: "groundwater_by_asset", title: "Snapshot flow by asset · GPM", dataset: "snapshots", category: "assetid", measure: "flowgpm",
                    aggregation: "first", span: 4, height: 270, options: darkChartOptions(["#57cebb"]), interaction: { ...selectionInteraction("assetid"), targets: ["groundwater_scene"] } },
                { type: "lineChart", id: "groundwater_level_history", title: "Clearwell water level · %", dataset: "storage_history", category: "hour", measure: "levelpct",
                    aggregation: "first", span: 4, height: 270, options: darkChartOptions(["#62dafa"]),
                    chartStyle: { yAxis: [{ domain: "fixed", min: 0, max: 100, suffix: "%" }], series: [{ smooth: true }] }, interaction: disabledInteraction },
            ] },
            { type: "table", id: "groundwater_assets", title: "Source-to-tap asset register", dataset: "snapshots", maxRows: 24,
                columns: [{ field: "assetid", title: "ID" }, { field: "asset", title: "Asset" }, { field: "stage", title: "Stage" },
                    { field: "scenario", title: "Scenario" }, { field: "status", title: "Status" }, { field: "flowgpm", title: "Flow (GPM)" }, { field: "levelpct", title: "Tank level (%)" }],
                interaction: { ...selectionInteraction("assetid"), targets: ["groundwater_scene"] } },
        ],
    };
    return {
        id: "groundwater-supply-distribution", title, useCase: "Groundwater treatment and residential water distribution",
        summary: "Follow water from two wells through treatment and high-service pumping to three residential delivery points.",
        description: "Ridgeway Water's fictional network collects groundwater from two wells, treats it, and pumps it through a distribution main to three residential areas. Select the Clearwell tank to inspect its water level, or change operating scenarios to watch its waterline and pipe flow update.",
        theme: "dark", accent: "#6eb5ff", tags: ["3D", "groundwater", "distribution"], referenceImages: [],
        previewImage: "/images/groundwater-supply-distribution.webp", powerBiPackage: "core",
        expected: "Choose Remote well offline to turn its pump red and stop its pipe animation. The Clearwell level drops from 78% to 43% in the tank, KPI, and trend. Peak demand sets the level to 61%. Select the tank or another asset to filter the flow views and register. Use Pause flow to stop the moving markers. All uses the Normal flow snapshot and level trend and averages the flow history across scenarios.",
        limitations: "The scene illustrates precomputed operating scenarios and flow direction. Import readingid in Power BI and set numeric columns to Don't summarize to preserve row identities.",
        headers: ["readingid", "assetid", "asset", "stage", "scenario", "status", "equipmentcolor", "recordtype", "sampleorder", "hour", "flowgpm", "wellsactive", "rawgpm", "deliveredgpm", "mainpsi", "levelpct"],
        rows, specification, runtime: { ...darkRuntime, motion: { ...darkRuntime.motion, maxConcurrentAnimations: 16 } },
    };
}

/** Demonstrates the animation editor with live row bindings and the same portable Power BI dataset. */
function scene3dAnimationStudio(): ExampleDefinition {
    const original = pumpStationMonitoring();
    const specification = structuredClone(original.specification);
    const components = specification.components as Array<Record<string, unknown>>;
    const scene = components.find(component => component.type === "scene3d") as unknown as Scene3dComponent;
    if (!scene) throw new Error("The pump-station demo must contain a 3D scene.");
    scene.title = "Animated equipment · rotation, translation, pulse and visibility";
    scene.height = 490;
    const fans = [
        { id: "P-101", x: -3.3 }, { id: "P-102", x: -1.1 },
        { id: "P-103", x: 1.1 }, { id: "P-104", x: 3.3 },
    ];
    for (const fan of fans) {
        scene.objects.push(
            { id: `fan_stand_${fan.id.replace("-", "_")}`, kind: "box", position: [fan.x, 1.65, 1.4], size: [0.12, 0.75, 0.14], color: "#738da8" },
            { id: `fan_${fan.id.replace("-", "_")}`, kind: "fan", label: `Cooling fan ${fan.id}`,
                dataKey: fan.id, position: [fan.x, 2.12, 1.4], size: [0.88, 0.88, 0.88], color: "#5fc6ed",
                animations: [{ kind: "rotate", axis: "z", rpm: 75, rpmField: "motorloadpct", enabledField: "flowgpm" }] },
        );
    }
    scene.objects.push(
        { id: "motion_alert", kind: "sphere", label: "Warning pulse", dataKey: "P-103",
            position: [1.1, 3.35, 1.4], size: [0.25, 0.25, 0.25], color: "#ffac4b",
            animations: [{ kind: "pulse", amplitude: 0.65, period: 1.1, enabledField: "status", enabledValue: "Warning" }] },
        { id: "motion_actuator", kind: "box", label: "Reciprocating actuator", dataKey: "P-101",
            position: [-3.3, 1.18, 1.45], size: [0.34, 0.3, 0.3], color: "#7ed7a7",
            animations: [{ kind: "translate", axis: "x", amplitude: 0.25, period: 2.4, enabledField: "flowgpm" }] },
        { id: "motion_indicator", kind: "sphere", label: "Status beacon", dataKey: "P-102",
            position: [-1.1, 3.3, 1.4], size: [0.2, 0.2, 0.2], color: "#f7d45b",
            animations: [{ kind: "blink", period: 1.2, enabledField: "status", enabledValue: "Stopped" }] },
        { id: "motion_expansion", kind: "box", label: "Expansion test", dataKey: "P-104",
            position: [3.3, 3.35, 1.4], size: [0.3, 0.3, 0.3], color: "#a9a0f4",
            animations: [{ kind: "scale", axis: "y", amplitude: 0.45, period: 1.6, enabledField: "flowgpm" }] },
    );
    specification.title = "3D Animation Studio";
    const app = specification.app as { pageHeader: { title: string; subtitle: string } };
    app.pageHeader.title = "Interactive 3D Animation Studio";
    app.pageHeader.subtitle = "Rotating cooling fans, reciprocating actuator, status beacons and live data bindings";
    components.splice(1, 0, { type: "text", id: "motion_guide",
        text: "Choose an operating scenario, then watch motor-driven fans spin, a warning light pulse, and a stopped pump's beacon blink. Select any 3D asset to filter the linked charts. Open Visual Inspector to edit or add animations without writing code." });
    return {
        ...original,
        id: "scene3d-animation-studio",
        title: "3D Animation Studio",
        useCase: "Interactive equipment animations and industrial digital twins",
        summary: "Explore fan rotation, moving actuators, animated alarms, data-driven speed and Power BI selection.",
        description: "A hands-on Three.js motion laboratory using synthetic booster-station readings. Configure RPM-driven cooling fans, moving actuators, alert pulses, scaling indicators and visibility animation in the Visual Inspector. Every object can be selected and linked to charts and tables.",
        tags: ["3D", "animation", "SCADA", "Three.js"],
        expected: "Normal duty spins three fans, Peak demand spins all four and pulses the P-103 warning beacon, and Maintenance stops P-102 so its status beacon blinks. Edit any object's Animations section to adjust RPM, axis, period and data fields.",
        limitations: "Scenario values and readings are synthetic. Animations are local rendering only, not SCADA control commands. Requires WebGL 2 and respects reduced motion and runtime animation budgets.",
        previewImage: "/images/pump-station-monitoring.webp",
        specification,
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
    dynamicGisAnalytics(),
    universalDynamicContent(),
    pumpStationMonitoring(),
    groundwaterSupplyDistribution(),
    scene3dAnimationStudio(),
];

function readme(example: ExampleDefinition): string {
    const packageInstruction = example.liveApi
        ? "Import the HyperPBI Maps PBIVIZ package with WebAccess for `https://functions.miniup.app`. Allow the origin in Power BI."
        : example.powerBiPackage === "maps"
        ? "Import the HyperPBI Maps PBIVIZ package. The package must include the OpenStreetMap WebAccess declaration."
        : "Import the HyperPBI Core PBIVIZ package.";
    const projectDescription = example.liveApi
        ? "complete Playground project with the local synthetic records and live MiniUp bindings."
        : example.powerBiPackage === "maps"
        ? "complete Playground project with embedded synthetic rows, stable row keys, and an OpenStreetMap basemap configuration."
        : "complete offline Playground project with normalized rows and stable row keys.";
    const playgroundDataDescription = example.liveApi
        ? `The preview calls the [public MiniUp API](${example.liveApi}) when triggered. The bundle embeds the local CSV and contains no credentials. See the [live preview and Open in Playground action](https://hyperpbi.com/examples/${example.id}) and the [Function source](../dynamic-content-api.mjs).`
        : example.powerBiPackage === "maps"
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
        ...(example.previewImage ? { previewImage: example.previewImage } : {}),
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
