import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { button, change, mapStudioSpecification, mountMapStudio } from "./map-studio-fixture";

describe("visual symbology transactions", () => {
  it("applies a palette while preserving custom break boundaries and labels", () => {
    const specification = JSON.parse(mapStudioSpecification);
    specification.components[0].layers[0].renderer = { type: "classBreaks", field: "amount", fieldSource: "powerbi", method: "manual", breaks: [
      { min: 0, max: 15, label: "Priority", symbol: { fillColor: "#123456", radius: 9 } },
      { min: 15, max: 100, label: "Other", symbol: { fillColor: "#654321", radius: 5 } },
    ] };
    const mounted = mountMapStudio(JSON.stringify(specification));
    act(() => button(mounted.host, "Renderer").click());
    act(() => mounted.host.querySelector<HTMLButtonElement>('[aria-label="Apply Forest palette"]')!.click());
    const renderer = JSON.parse(mounted.json()).components[0].layers[0].renderer;
    expect(renderer.breaks).toMatchObject([{ min: 0, max: 15, label: "Priority", symbol: { fillColor: "#dcfce7", radius: 9 } }, { min: 15, max: 100, label: "Other", symbol: { fillColor: "#86efac", radius: 5 } }]);
    act(() => button(mounted.host, "Undo").click());
    expect(JSON.parse(mounted.json()).components[0].layers[0].renderer.breaks[0].symbol.fillColor).toBe("#123456");
    mounted.cleanup();
  });

  it("uses the chosen categorical field to create useful default classes", () => {
    const mounted = mountMapStudio();
    act(() => button(mounted.host, "Renderer").click());
    change(mounted.host.querySelector<HTMLSelectElement>('[aria-label="field"]')!, "status");
    change(mounted.host.querySelector<HTMLSelectElement>('[aria-label="Renderer type"]')!, "uniqueValue");
    expect(JSON.parse(mounted.json()).components[0].layers[0].renderer).toMatchObject({ type: "uniqueValue", field: "status", values: [{ value: "Open" }, { value: "Closed" }] });
    mounted.cleanup();
  });
});
