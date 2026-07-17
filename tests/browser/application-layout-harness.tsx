import { render } from "preact";
import "../../src/styles/hyperpbi.css";
import { calculateAggregates } from "../../src/data/aggregations";
import { normalizeMapBindings } from "../../src/data/normalizeMapBindings";
import { HyperPbiRoot } from "../../src/render/HyperPbiRoot";
import type { HyperPbiSchema } from "../../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";

const data = {
  rows: [],
  rowKeys: [],
  fields: {},
  aggregates: calculateAggregates([]),
  map: normalizeMapBindings([], {}),
};

const schema: HyperPbiSchema = {
  version: "2.0",
  components: [{
    type: "split",
    id: "browser-workspace",
    title: "Resizable workspace",
    heightMode: "fill",
    direction: "row",
    sizes: [30, 70],
    minSizes: [20, 30],
    maxSizes: [60, 80],
    resizable: true,
    persist: "local",
    responsive: {
      xs: { stack: true },
      md: { stack: false, direction: "row" },
    },
    children: [
      {
        type: "grid",
        id: "navigation-layout",
        columns: 2,
        responsive: { sm: { columns: 2, stack: false } },
        children: [
          { type: "text", id: "navigation-pane", text: "Navigation" },
          { type: "text", id: "navigation-detail", text: "Details" },
        ],
      },
      { type: "text", id: "analysis-pane", text: "Analysis", heightMode: "fill" },
    ],
  }],
};

declare global {
  interface Window {
    hpApplicationLayoutHarness: { resizeEvents: number };
  }
}

window.hpApplicationLayoutHarness = { resizeEvents: 0 };
window.addEventListener("hyperpbi:layout-resize", () => {
  window.hpApplicationLayoutHarness.resizeEvents += 1;
});

render(
  <HyperPbiRoot
    instanceId="application-layout-browser"
    schema={schema}
    data={data}
    settings={toRuntimeSettings(new VisualFormattingSettingsModel())}
    renderMs={0}
  />,
  document.getElementById("app")!,
);
