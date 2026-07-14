import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { MapDiagnosticsPanel } from "../src/editor/map-studio/MapDiagnosticsPanel";

describe("Map Studio selected-layer diagnostic scope", () => {
  it("does not confuse layer 1 with sibling layer 10", () => {
    const host = document.createElement("div");
    act(() => render(
      <MapDiagnosticsPanel
        layer={{ id: "one", name: "One", source: { type: "powerbi", bindings: {} } }}
        dataset="powerbi"
        rows={[]}
        fields={[]}
        selectedMapPath="/components/3"
        selectedLayerPath="/components/3/layers/1"
        prepared={{
          aliases: {}, errors: [], warnings: [],
          diagnostics: [
            { code: "MAP_ONE", severity: "error", path: "/components/3/layers/1/source", message: "selected" },
            { code: "MAP_TEN", severity: "error", path: "/components/3/layers/10/source", message: "sibling" },
            { code: "MAP_LEVEL", severity: "warning", path: "/components/3/view", message: "map-level" },
          ],
        }}
      />,
      host,
    ));
    expect(host.textContent).toContain("MAP_ONE");
    expect(host.textContent).not.toContain("MAP_TEN");
    expect(host.textContent).toContain("MAP_LEVEL");
    expect(host.textContent).toContain("/components/3/layers/1");
  });
});
