import { render } from "preact";
import { useMemo, useState } from "preact/hooks";
import "@tabler/core/dist/css/tabler.css";
import "leaflet/dist/leaflet.css";
import "../../src/styles/tabler-overrides.css";
import "../../src/styles/hyperpbi.css";
import "../../src/styles/hyperpbi-studio.css";
import "../../src/styles/hyperpbi-map-studio.css";
import "../../src/styles/hyperpbi-inspector.css";
import "../../src/styles/hyperpbi-shell.css";
import "../../src/styles/hyperpbi-map.css";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import { HyperPbiStudio } from "../../src/editor/HyperPbiStudio";
import { parseMapManifest } from "../../src/maps/imports/mapManifest";
import { importPublishedMap } from "../../src/maps/imports/mapImport";
import { defaultConfig, defaultConfigJson } from "../../src/config/hyperpbiConfig";
import { calculateAggregates } from "../../src/data/aggregations";
import { normalizeMapBindings } from "../../src/data/normalizeMapBindings";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";
import type { NormalizedData, NormalizedField } from "../../src/data/normalizeData";
import fixture from "../../examples/map/published-map.json";

declare global { interface Window { publishedMapRuntime: { selectionCalls: number; rowKeys: string[]; saved: string; specification: string; }; } }
window.publishedMapRuntime = { selectionCalls: 0, rowKeys: [], saved: "", specification: "" };
const fields: Record<string, NormalizedField> = Object.fromEntries(["code", "amount", "lat", "lon", "date"].map(key => [key, { key, displayName: key, type: key === "code" ? "dimension" : key === "date" ? "date" : "measure", roles: ["values"], dataType: key === "code" ? "text" : key === "date" ? "datetime" : "number", kind: "column", origin: "powerbi-column", sourceTable: "Facility", sourceColumn: key }]));
const allRows = [{ code: "A", amount: 10, lat: 30.25, lon: -97.78, date: "2026-10-10" }, { code: "B", amount: 30, lat: 30.3, lon: -97.7, date: "2026-11-01" }];
const imported = importPublishedMap({ type: "map", id: "network", heightMode: "fill", layers: [{ id: "analytics", name: "Power BI facilities", source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } }, renderer: { type: "simple", symbol: { color: "#7c3aed", radius: 5 } } }] }, parseMapManifest(fixture).manifest, { mode: "snapshot" }).map;
imported.layers![1].join = { enabled: true, powerBiField: "code", serviceField: "site_id", unmatchedPolicy: "diagnose", aggregations: [{ field: "amount", aggregation: "sum", as: "sales" }] };
imported.layers![1].interaction = { enabled: true, internalMode: "highlight", externalMode: "selection", multiSelect: true };
imported.layers![1].renderer = { type: "proportionalSize", field: "sales", fieldSource: "joined", minSize: 8, maxSize: 15, color: "#0f766e" };
imported.layers![2].order = -1;
imported.view = { center: [30.29, -97.74], zoom: 11, fitMode: "none" };
const schema = { version: "2.0" as const, title: "Facility Network", components: [imported] };
const settings = toRuntimeSettings(new VisualFormattingSettingsModel());
function Harness() {
    const [month, setMonth] = useState("all");
    const data = useMemo<NormalizedData>(() => { const indices = allRows.flatMap((row, index) => month === "all" || row.date.startsWith(month) ? [index] : []); const rows = indices.map(index => allRows[index]), rowKeys = indices.map(index => `facility-${index}`); return { rows, rowKeys, fields, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields, { latitude: "lat", longitude: "lon" }, {}, rowKeys) }; }, [month]);
    const studio = new URLSearchParams(location.search).has("studio");
    const selectExternal = (indices: number[]) => { window.publishedMapRuntime.selectionCalls++; window.publishedMapRuntime.rowKeys = indices.map(index => data.rowKeys[index]); return { sent: true }; };
    return <div><div class="harness-filters"><strong>Facility Network</strong><label>Date slicer <select aria-label="Report date slicer" value={month} onChange={event => setMonth(event.currentTarget.value)}><option value="all">All dates</option><option value="2026-11">November</option><option value="2026-10">October</option></select></label></div><div class="harness-view">{studio ? <HyperPbiStudio instanceId="map-studio" data={data} settings={settings} initialSpecification={new URLSearchParams(location.search).has("saved") ? sessionStorage.getItem("saved-map") ?? JSON.stringify(schema) : JSON.stringify(schema)} initialConfiguration={defaultConfigJson} initialEditorTab="mapStudio" onDraftChange={specification => { window.publishedMapRuntime.specification = specification; }} onSave={specification => { window.publishedMapRuntime.saved = specification; sessionStorage.setItem("saved-map", specification); }} selectExternal={selectExternal} /> : <HyperPbiRoot instanceId="map-viewer" schema={schema} data={data} settings={settings} config={defaultConfig} renderMs={0} selectExternal={selectExternal} />}</div></div>;
}
render(<Harness />, document.getElementById("app")!);
