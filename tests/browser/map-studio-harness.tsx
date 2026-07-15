import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import "../../src/styles/hyperpbi-studio.css";
import "../../src/styles/hyperpbi-map-studio.css";
import { calculateAggregates } from "../../src/data/aggregations";
import type { NormalizedData, NormalizedField } from "../../src/data/normalizeData";
import { defaultConfigJson } from "../../src/config/hyperpbiConfig";
import { MapStudio } from "../../src/editor/map-studio/MapStudio";

const field = (
  key: string,
  dataType: NormalizedField["dataType"],
): NormalizedField => ({
  key,
  displayName: key,
  type: dataType === "number" ? "measure" : "dimension",
  dataType,
  roles: ["values"],
  kind: "column",
  origin: "powerbi-column",
  sourceTable: "Assets",
  sourceColumn: key,
});

const rows = [
  { lat: 29.7, lon: -95.3, status: "Open", amount: 10, code: "A" },
  { lat: 30, lon: -96, status: "Closed", amount: 20, code: "A" },
];
const fields = {
  lat: field("lat", "number"),
  lon: field("lon", "number"),
  status: field("status", "text"),
  amount: field("amount", "number"),
  code: field("code", "text"),
};
const data = {
  rows,
  fields,
  rowKeys: ["a", "b"],
  aggregates: calculateAggregates(rows),
  map: {
    hasGeometry: false,
    hasLatLon: true,
    hasXY: false,
    hasAddress: false,
    mode: "latLon",
    bindings: { latitude: "lat", longitude: "lon", tooltip: [], details: [] },
    layers: [],
    warnings: [],
    invalidFeatureCount: 0,
  },
} as NormalizedData;

const initialSpecification = JSON.stringify({
  version: "2.0",
  components: [{
    type: "map",
    id: "operations",
    title: "Operations",
    layers: [
      {
        id: "feature-assets",
        name: "Feature assets",
        source: { type: "arcgisFeature", url: "https://services.arcgis.com/x/ArcGIS/rest/services/Test/FeatureServer/0" },
      },
      {
        id: "dynamic-weather",
        name: "Dynamic weather",
        source: { type: "arcgisDynamic", url: "https://example.test/MapServer" },
      },
      {
        id: "tile-basemap",
        name: "Tile basemap",
        source: { type: "arcgisTile", url: "https://example.test/MapServer" },
      },
    ],
  }],
});

declare global {
  interface Window {
    hpMapStudioHarness: {
      mountCount: number;
      changeCount: number;
      json: string;
    };
  }
}

window.hpMapStudioHarness = { mountCount: 0, changeCount: 0, json: initialSpecification };

function Harness() {
  const [json, setJson] = useState(initialSpecification);
  useEffect(() => {
    window.hpMapStudioHarness.mountCount += 1;
  }, []);
  return (
    <div style={{ width: "100%", height: "720px" }}>
      <MapStudio
        json={json}
        data={data}
        configurationJson={defaultConfigJson}
        webAccessAvailable
        selectedComponentId="operations"
        onChange={(next) => {
          window.hpMapStudioHarness.changeCount += 1;
          window.hpMapStudioHarness.json = next;
          setJson(next);
        }}
      />
    </div>
  );
}

render(<Harness />, document.getElementById("app")!);
