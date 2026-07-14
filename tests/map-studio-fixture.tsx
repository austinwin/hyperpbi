import { render } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { calculateAggregates } from "../src/data/aggregations";
import type {
  NormalizedData,
  NormalizedField,
} from "../src/data/normalizeData";
import {
  MapStudio,
  type MapStudioProps,
} from "../src/editor/map-studio/MapStudio";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";

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
  { lat: 30, lon: -96, status: "Closed", amount: 20, code: "B" },
];
const fields = {
  lat: field("lat", "number"),
  lon: field("lon", "number"),
  status: field("status", "text"),
  amount: field("amount", "number"),
  code: field("code", "text"),
};
export const mapStudioData = {
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
export const mapStudioSpecification = JSON.stringify({
  version: "2.0",
  data: {
    datasets: {
      openAssets: {
        source: "powerbi",
        filter: { field: "status", operator: "=", value: "Open" },
      },
    },
  },
  components: [
    {
      type: "map",
      id: "operations",
      title: "Operations",
      layers: [
        {
          id: "assets",
          name: "Assets",
          source: {
            type: "powerbi",
            bindings: { latitude: "lat", longitude: "lon" },
          },
        },
      ],
    },
  ],
});

export function mountMapStudio(
  initial = mapStudioSpecification,
  props: Partial<
    Omit<MapStudioProps, "json" | "data" | "selectedComponentId" | "onChange">
  > = {},
) {
  const host = document.createElement("div");
  let latest = initial;
  function Harness() {
    const [json, setJson] = useState(initial);
    return (
      <MapStudio
        json={json}
        data={mapStudioData}
        configurationJson={defaultConfigJson}
        selectedComponentId="operations"
        onChange={(next) => {
          latest = next;
          setJson(next);
        }}
        {...props}
      />
    );
  }
  act(() => render(<Harness />, host));
  return {
    host,
    json: () => latest,
    cleanup: () => act(() => render(null, host)),
  };
}

export const button = (host: HTMLElement, text: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(
    (item) => item.textContent?.trim() === text,
  )!;
export const change = (
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string,
) =>
  act(() => {
    element.value = value;
    element.dispatchEvent(
      new Event(element instanceof HTMLTextAreaElement ? "input" : "change", {
        bubbles: true,
      }),
    );
  });
