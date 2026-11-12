import { render } from "preact";
import "../../src/styles/hyperpbi.css";
import "../../src/styles/hyperpbi-svg.css";
import { calculateAggregates } from "../../src/data/aggregations";
import { normalizeMapBindings } from "../../src/data/normalizeMapBindings";
import type { NormalizedData } from "../../src/data/normalizeData";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import type { DashboardComponent, HyperPbiSchema } from "../../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";

const params = new URLSearchParams(location.search);
const mode = params.get("mode");
const panZoom = params.get("panZoom") === "false" ? false : params.get("panZoom") === "omitted" ? undefined : true;
const drawing = (label: string, width: number, height: number) => `<svg width="${width}" height="${height}" preserveAspectRatio="none">
    <script>throw new Error('unsafe')</script><rect width="${width}" height="${height}" fill="#2563eb"/>
    <path d="M10 20H80" fill="none" stroke="white" stroke-dasharray="5 5">
        <animate attributeName="stroke-dashoffset" from="10" to="0" dur="2s" repeatCount="indefinite"/>
    </path><text x="10" y="50">${label}</text></svg>`;

const component: DashboardComponent = mode === "inline" || mode === "image" ? {
    type: "svgMarkup", id: "drawing", ariaLabel: "Station drawing", heightMode: "fill", panZoom,
    svgBinding: { mode: "data", keyField: "station", svgField: "drawing", renderMode: mode },
} : mode === "authored" ? {
    type: "svgMarkup", id: "drawing", ariaLabel: "Authored drawing", panZoom,
    svg: drawing("{{station}}", 200, 100),
} : {
    type: "svg", id: "drawing", ariaLabel: "Structured drawing", heightMode: "fill", panZoom,
    viewBox: "0 0 200 100", preserveAspectRatio: "none", elements: [
        { type: "rect", width: 200, height: 100, fill: "#2563eb" },
        { type: "circle", cx: 75, cy: 40, r: 10, fill: "white", ariaLabel: "Select pump",
            interaction: { enabled: true, internalMode: "none", externalMode: "selection", field: "station" } },
        { type: "text", x: 10, y: 80, text: { bind: "station" } },
    ],
};
const schema: HyperPbiSchema = { version: "2.0", components: [component] };
const fields: NormalizedData["fields"] = {
    station: { key: "station", displayName: "Station", type: "dimension", dataType: "text", roles: ["values"] },
    drawing: { key: "drawing", displayName: "Drawing", type: "dimension", dataType: "text", roles: ["values"] },
};
const settings = toRuntimeSettings(new VisualFormattingSettingsModel());
const stationSelect = document.querySelector<HTMLSelectElement>("#station")!;
const selections = document.querySelector<HTMLOutputElement>("#selections")!;

function renderStation() {
    const station = stationSelect.value;
    const rows = [{ station, drawing: station === "A" ? drawing("Station A", 200, 100) : drawing("Station B", 100, 200) }];
    const data = { rows, rowKeys: [station], fields, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };
    render(<HyperPbiRoot instanceId="svg-pan-zoom-test" schema={schema} data={data} settings={settings} renderMs={0}
        selectExternal={() => { selections.value = String(Number(selections.value) + 1); return { sent: true }; }} />,
    document.querySelector("#app")!);
}

stationSelect.addEventListener("change", renderStation);
renderStation();
