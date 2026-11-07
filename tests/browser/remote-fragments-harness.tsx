import { render } from "preact";
import { getInstanceByDom } from "echarts/core";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import { HyperPbiStudio } from "../../src/editor/HyperPbiStudio";
import { defaultRuntimeSettings } from "../../src/runtime/runtimeSettings";
import { createEmptyNormalizedData } from "../../src/data/dataWorkspace";
import { defaultConfigJson } from "../../src/config/hyperpbiConfig";
import type { HyperPbiSchema } from "../../src/schema/hyperpbiSchema";
import spec from "../../examples/map/remote-analytics/spec.json";
import "leaflet/dist/leaflet.css";
import "../../src/styles/hyperpbi.css";
import "../../src/styles/hyperpbi-studio.css";
import "../../src/styles/hyperpbi-map.css";
import "../../src/styles/hyperpbi-map-studio.css";

declare global { interface Window { remoteDemo: { chartId: () => string | undefined; zoom: () => unknown; setZoom: () => void; saved: string; selections: number } } }
const chart = () => {
    const node = document.querySelector<HTMLElement>(".hp-remote-fragment .hp-chart-canvas");
    return node ? getInstanceByDom(node) : undefined;
};
window.remoteDemo = { chartId: () => chart()?.id, zoom: () => (chart()?.getOption() as { dataZoom?: unknown[] })?.dataZoom, setZoom: () => chart()?.dispatchAction({ type: "dataZoom", start: 25, end: 75 }), saved: "", selections: 0 };
const saved = localStorage.getItem("remote-demo-spec");
if (new URLSearchParams(location.search).has("studio")) {
    render(<HyperPbiStudio instanceId="remote-studio" data={createEmptyNormalizedData()} settings={defaultRuntimeSettings} initialSpecification={saved ?? JSON.stringify(spec)} initialConfiguration={defaultConfigJson} initialEditorTab="mapStudio" webAccessAvailable onDraftChange={specification => { window.remoteDemo.saved = specification; }} onSave={specification => { window.remoteDemo.saved = specification; localStorage.setItem("remote-demo-spec", specification); }} />, document.getElementById("app")!);
} else {
    render(<HyperPbiRoot instanceId="remote-demo" data={createEmptyNormalizedData()} schema={spec as unknown as HyperPbiSchema} settings={defaultRuntimeSettings} renderMs={0} webAccessAvailable selectExternal={() => { window.remoteDemo.selections++; return { sent: true }; }} />, document.getElementById("app")!);
}
