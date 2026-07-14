import { render } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { MapStudio } from "../src/editor/map-studio/MapStudio";
import { SpecificationHistory } from "../src/editor/inspector/specificationEditor";
import { mapStudioData, mapStudioSpecification } from "./map-studio-fixture";

describe("Map Studio text transactions", () => {
  it("keeps a ten-character draft local, commits once on blur, and undoes the complete edit", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const history = new SpecificationHistory(mapStudioSpecification);
    let latest = mapStudioSpecification;
    function Harness() {
      const [json, setJson] = useState(mapStudioSpecification);
      return (
        <MapStudio
          json={json}
          data={mapStudioData}
          selectedComponentId="operations"
          history={history}
          onChange={(next) => {
            latest = next;
            setJson(next);
          }}
        />
      );
    }
    act(() => render(<Harness />, host));
    const input = host.querySelector(
      '[aria-label="Layer name"]',
    ) as HTMLInputElement;
    act(() => {
      input.focus();
      for (const value of [
        "F",
        "Fa",
        "Fac",
        "Faci",
        "Facil",
        "Facili",
        "Facilit",
        "Faciliti",
        "Facilitie",
        "Facilities",
      ]) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    expect(latest).toBe(mapStudioSpecification);
    expect(history.canUndo).toBe(false);
    act(() => input.blur());
    expect(JSON.parse(latest).components[0].layers[0].name).toBe("Facilities");
    expect(history.canUndo).toBe(true);
    expect(JSON.parse(history.undo()).components[0].layers[0].name).toBe(
      "Assets",
    );
    act(() => render(null, host));
    host.remove();
  });

  it("cancels on Escape and preserves invalid local text without replacing canonical JSON", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let latest = mapStudioSpecification;
    act(() =>
      render(
        <MapStudio
          json={latest}
          data={mapStudioData}
          selectedComponentId="operations"
          onChange={(next) => {
            latest = next;
          }}
        />,
        host,
      ),
    );
    const input = host.querySelector(
      '[aria-label="Layer name"]',
    ) as HTMLInputElement;
    act(() => {
      input.value = "Draft";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(input.value).toBe("Assets");
    expect(latest).toBe(mapStudioSpecification);
    act(() => {
      input.focus();
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.blur();
    });
    expect(latest).toBe(mapStudioSpecification);
    expect(input.value).toBe("");
    expect(host.textContent).toContain("last valid preview is unchanged");
    act(() => render(null, host));
    host.remove();
  });
});
