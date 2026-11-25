import { options, render } from "preact";
import type { VNode } from "preact";
import powerbi from "powerbi-visuals-api";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import { HyperPbiStudio } from "../../src/editor/HyperPbiStudio";
import { ComponentRegistry } from "../../src/render/ComponentRegistry";
import { parseDataView } from "../../src/data/parseDataView";
import type { DashboardComponent, HyperPbiSchema } from "../../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";
import "../../src/styles/hyperpbi.css";

const hostElement = document.getElementById("app")!;
const settings = toRuntimeSettings(new VisualFormattingSettingsModel());
const afterPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const countedOptions = options as typeof options & { __r?: (vnode: VNode) => void };
const originalRender = countedOptions.__r;
let componentRenders = 0;
countedOptions.__r = vnode => {
    originalRender?.(vnode);
    if (vnode.type === ComponentRegistry) componentRenders++;
};

function dataView(rows: number, fields: number): powerbi.DataView {
    const columns = Array.from({ length: fields }, (_, index) => {
        const displayName = index === 0 ? "status" : index === 1 ? "amount" : index === 2 ? "category" : `field${index + 1}`;
        return { displayName, queryName: displayName, roles: { values: true }, isMeasure: index === 1,
            type: index === 1 ? { numeric: true } : { text: true } };
    });
    const values = Array.from({ length: rows }, (_, index) => columns.map((_column, field) =>
        field === 0 ? index % 2 ? "Closed" : "Open" : field === 1 ? index % 500 + 1 : field === 2 ? `Group ${index % 32}` : `Value-${index % 997}`));
    return { metadata: { columns }, table: { columns, rows: values } };
}

function specification(size: number): HyperPbiSchema {
    const widgets: DashboardComponent[] = Array.from({ length: size - 1 }, (_, index) => index >= 5 && index < 9
        ? { type: "barChart", id: `widget-${index}`, title: `By category ${index}`, category: "category", measure: "amount", aggregation: "sum", limit: 16 }
        : { type: "kpi", id: `widget-${index}`, title: `Workload ${index}`, aggregation: "count", format: "0", span: 2 });
    return { version: "2.0", title: "Dense operational dashboard", components: [{
        type: "segmentedControl",
        id: "status-control",
        title: "Status",
        field: "status",
        options: ["Open", "Closed"],
        interaction: { enabled: true, internalMode: "filter", externalMode: "none", targets: widgets.slice(0, 5).map(widget => widget.id!) },
    }, ...widgets] };
}

const visible = (selectors: string) => Boolean(hostElement.querySelector(selectors));
const metric = (id: number) => hostElement.querySelector(`[data-hp-id="widget-${id}"] .hp-metric-value`)?.textContent?.replaceAll(",", "").trim();
const formats = ["Open", "Closed", "All"] as const;
let denseSchema: HyperPbiSchema;
let denseData: ReturnType<typeof parseDataView>;

const harness = {
    async mount(size: number, rows: number, fields: number) {
        denseData = parseDataView(dataView(rows, fields));
        denseSchema = specification(size);
        componentRenders = 0;
        const start = performance.now();
        render(<HyperPbiRoot instanceId="dense" schema={denseSchema} data={denseData} settings={settings} renderMs={0} />, hostElement);
        await afterPaint();
        return { elapsed: performance.now() - start, componentRenders, displayed: metric(0) };
    },
    async interact(index: number) {
        const button = [...hostElement.querySelectorAll<HTMLButtonElement>("#dense fieldset button")].find(item => item.textContent === formats[index % formats.length]);
        if (!button) throw new Error("Benchmark status control unavailable");
        componentRenders = 0;
        const start = performance.now();
        button.click();
        // A microtask after dispatch sees the committed Preact update. Also
        // measure paint independently to include rendering and layout work.
        await Promise.resolve();
        const commitMs = performance.now() - start;
        await afterPaint();
        return { commitMs, paintMs: performance.now() - start, componentRenders, affected: metric(0), unaffected: metric(9) };
    },
    async studio() {
        render(null, hostElement);
        const start = performance.now();
        render(<HyperPbiStudio instanceId="dense-editor" initialSpecification={JSON.stringify(denseSchema)} initialConfiguration="" onSave={() => undefined} settings={settings} data={denseData} />, hostElement);
        await afterPaint();
        return { elapsed: performance.now() - start, opened: visible(".hp-studio"), workspaceNodes: hostElement.querySelectorAll("*").length };
    },

};

declare global { interface Window { hpDenseRuntime: typeof harness } }
window.hpDenseRuntime = harness;
