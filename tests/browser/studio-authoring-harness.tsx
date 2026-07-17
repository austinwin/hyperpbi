import { render } from "preact";
import "leaflet/dist/leaflet.css";
import "../../src/styles/hyperpbi.css";
import "../../src/styles/hyperpbi-map.css";
import "../../src/styles/hyperpbi-studio.css";
import "../../src/styles/hyperpbi-map-studio.css";
import { calculateAggregates } from "../../src/data/aggregations";
import { normalizeMapBindings } from "../../src/data/normalizeMapBindings";
import type { NormalizedData, NormalizedField } from "../../src/data/normalizeData";
import { defaultConfigJson } from "../../src/config/hyperpbiConfig";
import { HyperPbiStudio } from "../../src/editor/HyperPbiStudio";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";

const field = (key: string, dataType: NormalizedField["dataType"]): NormalizedField => ({
  key,
  displayName: key.replace(/_/g, " "),
  type: dataType === "number" ? "measure" : "dimension",
  dataType,
  roles: ["values"],
  kind: "column",
  origin: "powerbi-column",
  sourceTable: "Assets",
  sourceColumn: key,
});

const rows = [
  { asset_id: "AS-101", status: "Operational", latitude: 30.274, longitude: -97.744 },
  { asset_id: "AS-102", status: "Attention", latitude: 30.267, longitude: -97.735 },
  { asset_id: "AS-103", status: "Offline", latitude: 30.258, longitude: -97.752 },
];
const fields = {
  asset_id: field("asset_id", "text"),
  status: field("status", "text"),
  latitude: field("latitude", "number"),
  longitude: field("longitude", "number"),
};
const rowKeys = [
  '[{"identityIndex":0}]',
  '[{"identityIndex":1}]',
  '[{"identityIndex":2}]',
];
const data: NormalizedData = {
  rows,
  fields,
  rowKeys,
  aggregates: calculateAggregates(rows),
  map: normalizeMapBindings(rows, fields, { latitude: "latitude", longitude: "longitude" }, {}, rowKeys),
};

const initialSpecification = JSON.stringify({
  version: "2.0",
  components: [{
    type: "map",
    id: "municipal-map",
    title: "Municipal Asset Status",
    heightMode: "fixed",
    height: 380,
    style: { colorMode: "single", defaultPointColor: "#2563eb" },
  }],
});

const candidate = JSON.stringify({
  version: "2.0",
  components: [
    {
      type: "map",
      id: "municipal-map",
      title: "Municipal Asset Status",
      heightMode: "fixed",
      height: 380,
      tools: {
        rectangleSelection: { enabled: true, selectionMode: "replace" },
        lassoSelection: { enabled: true, selectionMode: "replace", minimumPoints: 3 },
      },
      interaction: {
        enabled: true,
        internalMode: "highlight",
        internalScope: "all",
        externalMode: "selection",
        targets: ["asset-list"],
      },
      featureDetails: { mode: "auto", clearSelectionOnBackgroundClick: true, clearSelectionOnClose: false },
      layers: [{
        id: "municipal-assets",
        name: "Municipal Assets",
        source: { type: "powerbi", bindings: { latitude: "latitude", longitude: "longitude" } },
        renderer: {
          type: "uniqueValue",
          field: "status",
          fieldSource: "powerbi",
          values: [
            { value: "Operational", symbol: { fillColor: "#2f855a", outlineColor: "#ffffff", outlineWidth: 2, radius: 8 } },
            { value: "Attention", symbol: { fillColor: "#d97706", outlineColor: "#ffffff", outlineWidth: 2, radius: 8 } },
            { value: "Offline", symbol: { fillColor: "#b91c1c", outlineColor: "#ffffff", outlineWidth: 2, radius: 8 } },
          ],
        },
        tooltip: {
          enabled: true,
          fields: [
            { field: "asset_id", fieldSource: "powerbi", label: "Asset ID" },
            { field: "status", fieldSource: "powerbi", label: "Status" },
          ],
        },
        popup: {
          enabled: true,
          defaultFieldSource: "powerbi",
          title: "{{asset_id}}",
          fields: [{ field: "status", fieldSource: "powerbi", label: "Status" }],
        },
        interaction: {
          enabled: true,
          trigger: "click",
          internalMode: "highlight",
          internalScope: "all",
          externalMode: "selection",
          multiSelect: true,
          clearOnSecondClick: false,
        },
        legend: { visible: true, title: "Status" },
      }],
      layerPanel: { visible: true },
      settings: { showLayerControl: true, showLegend: true },
      toolbar: { visible: true, layers: true, legend: true, search: false, rectangleSelection: true, lassoSelection: true },
    },
    {
      type: "table",
      id: "asset-list",
      title: "Interaction target",
      columns: ["asset_id", "status"],
      pagination: false,
      search: false,
    },
  ],
});

declare global {
  interface Window {
    hpStudioAuthoringHarness: {
      candidate: string;
      draft: string;
      saved: string;
      externalSelections: number[][];
    };
  }
}

window.hpStudioAuthoringHarness = {
  candidate,
  draft: initialSpecification,
  saved: "",
  externalSelections: [],
};

render(
  <HyperPbiStudio
    instanceId="studio-authoring-browser"
    data={data}
    settings={toRuntimeSettings(new VisualFormattingSettingsModel())}
    initialSpecification={initialSpecification}
    initialConfiguration={defaultConfigJson}
    initialEditorTab="ai"
    initialLayout={JSON.stringify({ editorPercent: 42, bottomHeight: 180, bottomOpen: false, advanced: true })}
    selectionIdentityCount={rows.length}
    hostAllowsInteractions
    selectExternal={(indices) => {
      window.hpStudioAuthoringHarness.externalSelections.push(indices);
      return { sent: true };
    }}
    clearExternal={() => ({ sent: true })}
    onDraftChange={(specification) => {
      window.hpStudioAuthoringHarness.draft = specification;
    }}
    onSave={(specification) => {
      window.hpStudioAuthoringHarness.saved = specification;
    }}
  />,
  document.getElementById("app")!,
);
