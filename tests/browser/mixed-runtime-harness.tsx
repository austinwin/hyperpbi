import { options, render, type VNode } from "preact";
import type powerbi from "powerbi-visuals-api";
import { getInstanceByDom } from "echarts/core";
import { EditorView } from "@codemirror/view";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import { HyperPbiStudio } from "../../src/editor/HyperPbiStudio";
import { ComponentRegistry } from "../../src/render/ComponentRegistry";
import { IncrementalData } from "../../src/powerbi/IncrementalData";
import type { NormalizedData } from "../../src/data/normalizeData";
import type { DashboardComponent, HyperPbiSchema } from "../../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";
import "../../src/styles/hyperpbi.css";
import "leaflet/dist/leaflet.css";

const host = document.getElementById("app")!;
const settings = toRuntimeSettings(new VisualFormattingSettingsModel());
const frames = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const counted = options as typeof options & { __r?: (vnode: VNode) => void };
const original = counted.__r;
let renders = new Map<string, number>();
counted.__r = vnode => {
    original?.(vnode);
    if (vnode.type === ComponentRegistry) {
        const id = (vnode.props as unknown as { component: DashboardComponent }).component.id ?? "";
        renders.set(id, (renders.get(id) ?? 0) + 1);
    }
};
let chartOps = { resize: 0, resizeMs: 0, setOption: 0, setOptionMs: 0, dispatchAction: 0, dispatchActionMs: 0 };
let chartProbe = false;
function attachChartProbe(root = host) {
    if (chartProbe) return;
    const element = root.querySelector<HTMLElement>(".hp-chart-canvas");
    const chart = element && getInstanceByDom(element);
    if (!chart) throw new Error("Expected a mounted chart");
    chartProbe = true;
    const prototype = Object.getPrototypeOf(chart) as Record<string, (...args: unknown[]) => unknown>;
    for (const method of ["resize", "setOption", "dispatchAction"] as const) {
        const wrap = (run: (...args: unknown[]) => unknown) => function (this: unknown, ...args: unknown[]) {
            const started = performance.now();
            try { return run.apply(this, args); }
            finally {
                chartOps[method]++;
                chartOps[`${method}Ms`] += performance.now() - started;
            }
        };
        prototype[method] = wrap(prototype[method]);
        for (const container of root.querySelectorAll<HTMLElement>(".hp-chart-canvas")) {
            const instance = getInstanceByDom(container) as unknown as typeof prototype | undefined;
            if (instance && Object.hasOwn(instance, method)) instance[method] = wrap(instance[method]);
        }
    }
}

function input(count: number, width: number, revision: number) {
    const names = ["order", "status", "district", "cost", "lat", "lon", "asset", "priority", "month"];
    const columns = Array.from({ length: width }, (_, i) => {
        const name = names[i] ?? `attribute${i}`;
        return { displayName: name, queryName: name, type: i >= 3 && i <= 5 ? { numeric: true } : { text: true }, isMeasure: i === 3 };
    });
    const rows = Array.from({ length: count }, (_, i) => columns.map((_column, field) => {
        if (field === 0) return `WO-${String(i).padStart(6, "0")}`;
        if (field === 1) return i % 3 === 0 ? "Open" : "Closed";
        if (field === 2) return `District ${i % 48}`;
        if (field === 3) return (i + revision) % 1000;
        if (field === 4) return 29 + i % 140 / 100;
        if (field === 5) return -96 + i % 157 / 100;
        if (field === 6) return `Asset ${i % 113}`;
        if (field === 7) return i % 2 ? "Urgent" : "Routine";
        if (field === 8) return `2026-${String(i % 12 + 1).padStart(2, "0")}`;
        return `Attribute ${field}-${i % 997}`;
    }));
    return { columns, rows };
}

function dashboard(size: number): HyperPbiSchema {
    const interaction = { enabled: true, internalMode: "highlight", internalScope: "self", externalMode: "selection" } as const;
    const widgets: DashboardComponent[] = [
        { type: "kpi", id: "affected", title: "Filtered orders", aggregation: "count", format: "0", span: 3 },
        { type: "barChart", id: "scoped-chart", category: "district", measure: "cost", height: 144, span: 5 },
        { type: "table", id: "work-orders", title: "Work orders", columns: ["order", "district", "status", "cost"], pageSize: 15, interaction, span: 4 },
        { type: "treemapChart", id: "asset-tree", pathFields: ["priority", "district"], valueField: "cost", height: 160, span: 7, interaction },
        { type: "map", id: "district-map", height: 160, span: 5, basemap: { type: "none" }, layers: [{
            id: "points", name: "Work order locations", source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } },
            performance: { maxFeatures: 200 }, renderer: { type: "simple", symbol: { shape: "circle", radius: 3 } },
        }] },
        { type: "kpi", id: "unaffected", title: "Total orders", aggregation: "count", format: "0", span: 3 },
    ];
    const targets = widgets.slice(0, 5).map(widget => widget.id!);
    for (let i = widgets.length; i < size - 4; i++) {
        const id = `widget-${i}`;
        switch (i % 12) {
            case 0:
                widgets.push({ type: "lineChart", id, dataset: "monthly", category: "month", measure: "spend", height: 124, span: 3 });
                break;
            case 1:
                widgets.push({ type: "barChart", id, dataset: "districts", category: "district", measure: "spend", height: 124, span: 3 });
                break;
            case 2:
                widgets.push({ type: "svgMarkup", id, title: "Operational indicator", span: 2, svg: '<svg viewBox="0 0 100 20"><rect width="100" height="20" fill="#225599"/><text x="4" y="14" fill="white">Work orders</text></svg>' });
                break;
            case 3:
                widgets.push({ type: "table", id, dataset: "monthly", columns: ["month", "spend"], pageSize: 5, span: 3 });
                break;
            case 4:
                widgets.push({ type: "text", id, span: 3, text: "Operational costs {{sum.cost}}" });
                break;
            case 5:
                widgets.push({ type: "kpi", id, dataset: "monthly", title: "Latest period", field: "spend", aggregation: "first", span: 3 });
                break;
            default:
                widgets.push({ type: "kpi", id, title: "Work order cost", field: "cost", aggregation: "sum", span: 2 });
        }
    }
    return {
        version: "2.0", title: "Work order portfolio",
        data: { datasets: {
            monthly: { source: "powerbi", groupBy: ["month"], metrics: { spend: { op: "sum", field: "cost" } }, sort: [{ field: "month", direction: "asc" }] },
            districts: { source: "powerbi", filterContext: "host", groupBy: ["district"], metrics: { spend: { op: "sum", field: "cost" } } },
        } },
        components: [
            { type: "segmentedControl", id: "status-control", title: "Order status", options: ["Open", "Closed"], field: "status", interaction: { enabled: true, internalMode: "filter", externalMode: "none", targets } },
            { type: "searchBox", id: "search", placeholder: "Search all work orders" },
            { type: "segmentedControl", id: "external", title: "Power BI filter", field: "priority", options: ["Urgent", "Routine"],
                interaction: { enabled: true, internalMode: "none", externalMode: "filter" } },
            { type: "tabs", id: "workspaces", tabs: [{ id: "overview", title: "Overview", children: widgets }, {
                id: "details", title: "Details", children: [{ type: "table", id: "raw-table", columns: ["order", "status", "priority"], pagination: false, interaction }],
            }] },
        ],
    };
}
const ingestion = new IncrementalData();
const perf = ingestion.performance;
let schema: HyperPbiSchema;
let data: NormalizedData | undefined;
let selected: number[] = [];
let requestCount = 0;
const selectExternal = (indices: number[]) => { selected = indices; return { sent: true }; };
const applyExternalFilter = () => { requestCount++; return { sent: true }; };
const renderDashboard = () => render(<HyperPbiRoot instanceId="mixed" schema={schema} data={data!} settings={settings} renderMs={0}
    remoteSourceHost="powerbi" selectExternal={selectExternal} applyExternalFilter={applyExternalFilter} />, host);

function replaceData(count: number, width: number, revision: number) {
    const table = input(count, width, revision);
    const started = performance.now();
    let offset = 0;
    const send = () => {
        const start = offset;
        offset = Math.min(offset + 30_000, count);
        const view = {
            table: { columns: table.columns, rows: table.rows.slice(start, offset) },
            metadata: { columns: table.columns, segment: offset < count ? {} : undefined },
        } as powerbi.DataView;
        ingestion.accept(view, start === 0 ? "replace" : "segment");
        return true;
    };
    send();
    while (ingestion.canFetch) ingestion.requestNext({ fetchMoreData: send });
    data = ingestion.data;
    return performance.now() - started;
}

const count = (id: string) => host.querySelector(`[data-hp-id="${id}"] .hp-metric-value`)?.textContent?.replaceAll(",", "").trim();
function click(container: string, label: string) {
    const button = [...host.querySelectorAll<HTMLButtonElement>(`${container} button`)].find(item => item.textContent?.trim() === label);
    if (!button) throw new Error(`Button not found ${container} ${label}`);
    button.click();
}
async function until(predicate: () => boolean) {
    const deadline = performance.now() + 45_000;
    while (!predicate() && performance.now() < deadline) await frames();
    if (!predicate()) throw new Error("Expected dashboard update did not render");
}
const measure = async (operation: () => void, settled?: () => boolean) => {
    renders = new Map();
    chartOps = { resize: 0, resizeMs: 0, setOption: 0, setOptionMs: 0, dispatchAction: 0, dispatchActionMs: 0 };
    const started = performance.now();
    operation();
    await Promise.resolve();
    const commitMs = performance.now() - started;
    if (settled) await until(settled);
    const settledMs = performance.now() - started;
    await frames();
    return { commitMs, settledMs, frameMs: performance.now() - started, renders: [...renders.values()].reduce((a, b) => a + b, 0), ids: [...renders.keys()], chartOps,
        affected: count("affected"), unaffected: count("unaffected"), selected: selected.length, requestCount };
};
const harness = {
    async mount(size: number, count: number, width: number) {
        schema = dashboard(size);
        const normalizationMs = replaceData(count, width, 0);
        const rendering = await measure(renderDashboard);
        await until(() => Boolean(host.querySelector(".hp-chart-canvas canvas")));
        attachChartProbe();
        return { normalizationMs, ...rendering };
    },
    scope: (kind: "Open" | "Closed" | "All") => measure(() => click("[data-hp-id=status-control]", kind)),
    global: (query: string, expected: number) => measure(() => {
        const search = host.querySelector<HTMLInputElement>('input[placeholder="Search all work orders"]')!;
        search.value = query;
        search.dispatchEvent(new Event("input", { bubbles: true }));
    }, () => count("unaffected") === String(expected)),
    rapid: () => measure(() => {
        for (const label of ["Open", "Closed", "Open", "Closed", "All"]) click("[data-hp-id=status-control]", label);
    }),
    select: () => measure(() => host.querySelector<HTMLElement>("[data-hp-id=work-orders] tbody tr[aria-rowindex]")!.click()),
    selectGroup: () => measure(() => {
        const element = host.querySelector<HTMLElement>("[data-hp-id=asset-tree] .hp-chart-canvas")!;
        const chart = getInstanceByDom(element) as unknown as { trigger: (name: string, payload: object) => void };
        chart.trigger("click", { seriesIndex: 0, seriesType: "treemap", dataIndex: 1, data: { id: '["Urgent"]' } });
    }),
    external: (label: "Urgent" | "Routine") => measure(() => click("[data-hp-id=external]", label)),
    tab: (label: "Details" | "Overview") => measure(() => click("[role=tablist]", label)),
    resize(width: number) {
        const element = host.querySelector<HTMLElement>(".hp-chart-canvas")!;
        const chart = getInstanceByDom(element)!;
        const previous = chart.getWidth();
        return measure(() => {
            host.style.width = `${width}px`;
            globalThis.dispatchEvent(new Event("hyperpbi:layout-resize"));
        }, () => chart.getWidth() !== previous && Math.abs(chart.getWidth() - element.clientWidth) <= 1);
    },
    unchangedLayout: () => measure(() => globalThis.dispatchEvent(new Event("hyperpbi:layout-resize"))),
    async refresh(count: number, width: number, revision: number) {
        const normalizationMs = replaceData(count, width, revision);
        return { normalizationMs, ...await measure(renderDashboard) };
    },
    async studio() {
        render(null, host);
        return measure(() => render(<HyperPbiStudio instanceId="mixed-editor" initialSpecification={JSON.stringify(schema)} initialConfiguration=""
            initialEditorTab="specification" onSave={() => undefined} settings={settings} data={data!} />, host), () => Boolean(host.querySelector(".cm-editor")));
    },
    studioEdit() {
        const view = EditorView.findFromDOM(host.querySelector<HTMLElement>(".cm-editor")!)!;
        const source = view.state.doc.toString();
        const title = "Work order portfolio";
        const from = source.indexOf(title);
        if (from < 0) throw new Error("Benchmark dashboard title is missing from the editor");
        return measure(() => view.dispatch({ changes: { from, to: from + title.length, insert: "Updated portfolio" } }));
    },
    destroy: () => {
        render(null, host);
        data = undefined;
        ingestion.reset();
        selected = [];
        return host.children.length;
    },
    performance: () => perf.snapshot(),
};
declare global { interface Window { hpMixedRuntime: typeof harness } }
window.hpMixedRuntime = harness;
