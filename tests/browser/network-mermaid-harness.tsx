import { render } from "preact";
import "../../src/styles/hyperpbi.css";
import { calculateAggregates } from "../../src/data/aggregations";
import { normalizeMapBindings } from "../../src/data/normalizeMapBindings";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import type { HyperPbiSchema } from "../../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";

const rows = Array.from({ length: 15 }, (_, index) => ({ Root: "ROOT-1", RootLabel: "500 MAYO SHELL RD\nGALENA PARK, TX 77547", Sr: `SR-${Math.floor(index / 5) + 1}`, SrLabel: `SR ${Math.floor(index / 5) + 1}\nWaterLeakIssue`, Wo: `WO-${index + 1}`, WoLabel: `WO ${index + 1} | Water Main\n10/15/2021` }));
const mode = new URLSearchParams(location.search).get("mode") ?? "network";
const fields = Object.fromEntries(Object.keys(rows[0]).map(key => [key, { key, displayName: key, queryName: `Data[${key}]`, sourceTable: "Data", sourceColumn: key, qualifiedName: `Data.${key}`, type: "dimension", roles: [], kind: "column", dataType: "text" }]));
const data: any = { rows, rowKeys: rows.map((_row, index) => String(index)), fields, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };
const schema: HyperPbiSchema = { version: "2.0", components: [{ type: "grid", id: "showcase", columns: 2, children: [
  { type: "networkGraph", id: "dense_network", title: "Dense network", hidden: mode !== "network", heightMode: "fixed", height: 420, initOptions: { renderer: "svg" }, entities: [
    { id: "root", field: "Root", labelField: "RootLabel", color: "#2563EB" },
    { id: "sr", field: "Sr", labelField: "SrLabel", color: "#7C3AED" },
    { id: "wo", field: "Wo", labelField: "WoLabel", color: "#16A34A" },
  ], relationships: [{ source: "root", target: "sr" }, { source: "sr", target: "wo" }], layout: "hierarchical", directed: true, draggable: true, focusMode: "none", showEdgeTooltip: false, denseThreshold: 8, autoCompact: true },
  { type: "grid", id: "mermaid_side", hidden: mode !== "mermaid", columns: 1, children: [
    { type: "mermaidDiagram", id: "process", title: "Interactive process", source: "flowchart LR\nSR[Service Request] --> WO[Work Order 5]", nodeBindings: [{ nodeId: "SR", field: "Sr", value: "SR-1" }, { nodeId: "WO", field: "Wo", value: "WO-5", label: "Work order 5" }], interaction: { enabled: true, trigger: "click", internalMode: "filter", internalScope: "others", externalMode: "none", targets: ["details"], clearOnSecondClick: true }, panZoom: true },
    { type: "table", id: "details", columns: [{ field: "Wo", label: "Work order" }, { field: "Sr", label: "Service request" }], pagination: false },
  ] },
  { type: "mermaidDiagram", id: "invalid_mermaid", hidden: mode !== "invalid", source: "flowchart LR\nA[", frameless: true },
] }] };
render(<HyperPbiRoot instanceId="network-mermaid-browser" schema={schema} data={data} settings={toRuntimeSettings(new VisualFormattingSettingsModel())} renderMs={0} />, document.getElementById("app")!);
