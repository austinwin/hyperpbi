import { render } from "preact";
import { getInstanceByDom } from "echarts/core";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import { HyperPbiStudio } from "../../src/editor/HyperPbiStudio";
import { defaultRuntimeSettings } from "../../src/runtime/runtimeSettings";
import { createEmptyNormalizedData } from "../../src/data/dataWorkspace";
import { defaultConfigJson } from "../../src/config/hyperpbiConfig";
import type { HyperPbiSchema } from "../../src/schema/hyperpbiSchema";
import spec from "../../examples/dashboards/dynamic-gis-analytics/specification.json";
import assetSpec from "../../examples/dashboards/universal-dynamic-content/specification.json";
import assetCsv from "../../examples/dashboards/universal-dynamic-content/data.csv?raw";
import { parseCsvText } from "../../src/data/fileImport";
import { defaultWorkspaceData } from "../../src/data/dataWorkspace";
import "leaflet/dist/leaflet.css";
import "../../src/styles/hyperpbi.css";
import "../../src/styles/hyperpbi-studio.css";
import "../../src/styles/hyperpbi-shell.css";
import "../../src/styles/hyperpbi-map.css";
import "../../src/styles/hyperpbi-map-studio.css";

const chart = () => {
    const node = document.querySelector<HTMLElement>(".hp-remote-fragment .hp-chart-canvas");
    return node ? getInstanceByDom(node) : undefined;
};
window.remoteDemo = {
    chartId: () => chart()?.id, zoom: () => (chart()?.getOption() as { dataZoom?: unknown[] })?.dataZoom,
    setZoom: () => chart()?.dispatchAction({ type: "dataZoom", start: 25, end: 75 }), saved: "", selections: 0,
    assetPoint: () => {
        const node = document.querySelector<HTMLElement>('[data-hp-type="barChart"][data-hp-id="asset_chart"] .hp-chart-canvas');
        return node ? getInstanceByDom(node)?.convertToPixel({ seriesIndex: 0 }, ["P-204", 7]) as number[] | undefined : undefined;
    },
};
const params = new URLSearchParams(location.search);
const api = "https://functions.miniup.app/hyperpbi-dynamic-demo";
const saved = localStorage.getItem("remote-demo-spec");
if (params.has("studio")) {
    render(<HyperPbiStudio instanceId="remote-studio" data={createEmptyNormalizedData()} settings={defaultRuntimeSettings} initialSpecification={saved ?? JSON.stringify(spec)} initialConfiguration={defaultConfigJson} initialEditorTab="mapStudio" webAccessAvailable onDraftChange={specification => { window.remoteDemo.saved = specification; }} onSave={specification => { window.remoteDemo.saved = specification; localStorage.setItem("remote-demo-spec", specification); }} />, document.getElementById("app")!);
} else if (params.has("assets")) {
    const source = parseCsvText(assetCsv, "data.csv");
    const workspace = { defaultSourceId: source.id, sources: { [source.id]: source } };
    const schema = assetSpec as unknown as HyperPbiSchema;
    if (params.has("filterEvent")) schema.rightPanel = [...(schema.rightPanel ?? []), {
        type: "dynamicContent", id: "filter_events", title: "Priority event", trigger: { source: "priority", event: "change" },
        request: { endpoint: `${api}/backlog?priority={{context.$value}}` },
    }];
    if (params.has("chart")) schema.components = [
        { type: "button", id: "open", title: "Open asset inspector", uiAction: { type: "openOverlay", target: "asset_modal" } },
        { type: "barChart", id: "asset_chart", category: "assetid", measure: "hours", title: "Hours by asset", interaction: { enabled: false } },
        { type: "modal", id: "asset_modal", title: "Chart selection", children: [
            { type: "dynamicContent", id: "chart_details", trigger: { source: "asset_chart", event: "select" }, request: { endpoint: `${api}/asset?id={{context.assetid}}` } },
        ] },
    ];
    render(<HyperPbiRoot instanceId="asset-demo" data={defaultWorkspaceData(workspace)} dataWorkspace={workspace} schema={schema} settings={defaultRuntimeSettings} renderMs={0} />, document.getElementById("app")!);
} else {
    const schema = spec as unknown as HyperPbiSchema;
    if (params.has("mapRegion")) schema.rightPanel = [
        { type: "dynamicContent", id: "map_details", title: "Linked station", trigger: { source: "sensor_map", event: "click" }, request: { endpoint: `${api}/sensor?id={{context.site_id}}` } },
    ];
    render(<HyperPbiRoot instanceId="remote-demo" data={createEmptyNormalizedData()} schema={schema} settings={defaultRuntimeSettings} renderMs={0} webAccessAvailable selectExternal={() => { window.remoteDemo.selections++; return { sent: true }; }} />, document.getElementById("app")!);
}
