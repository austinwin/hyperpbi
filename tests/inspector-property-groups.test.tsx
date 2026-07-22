import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { componentDescriptors } from "../src/catalog/componentDescriptors";
import { SpecificationInspector } from "../src/editor/inspector/SpecificationInspector";
import { mapStudioData } from "./map-studio-fixture";

describe("Inspector property groups", () => {
  it("assigns explicit groups and stable ordering metadata to stable controls", () => {
    const controls = componentDescriptors
      .filter((descriptor) => descriptor.maturity === "stable")
      .flatMap((descriptor) => descriptor.inspector);
    expect(controls.length).toBeGreaterThan(0);
    expect(controls.every((control) => Boolean(control.group))).toBe(true);
    expect(controls.every((control) => typeof control.order === "number")).toBe(true);
  });

  it("starts Advanced and Structured JSON collapsed without giant fieldsets", () => {
    const host = document.createElement("div");
    const json = JSON.stringify({ version: "2.0", components: [{ type: "text", id: "note", text: "Hello" }] });
    act(() => render(
      <SpecificationInspector json={json} data={mapStudioData} selectedComponentId="note" onChange={vi.fn()} />,
      host,
    ));
    const details = Array.from(host.querySelectorAll<HTMLDetailsElement>("details"));
    const advanced = details.find((section) => section.querySelector("summary")?.textContent?.includes("Advanced"))!;
    const structured = details.find((section) => section.querySelector("summary")?.textContent?.includes("Structured JSON"))!;
    expect(advanced.open).toBe(false);
    expect(structured.open).toBe(false);
    expect(host.querySelector(".hp-inspector-property-groups fieldset")).toBeNull();
    expect(host.querySelector(".hp-inspector-node-actions")).toBeNull();
    expect(host.querySelector(".hp-inspector-component-actions .hp-inspector-delete-action")).not.toBeNull();
  });
});
