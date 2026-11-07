import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, change, mapStudioSpecification, mountMapStudio } from "./map-studio-fixture";
import { createMapCommandChannel } from "../src/maps/interactions/mapStudioCommands";

function contentsFixture() {
  const spec = JSON.parse(mapStudioSpecification);
  spec.components[0].layers = [
    { ...spec.components[0].layers[0], id: "a", name: "Alpha", order: 2 },
    { ...spec.components[0].layers[0], id: "b", name: "Beta", order: 0 },
    { ...spec.components[0].layers[0], id: "c", name: "Charlie", order: 1 },
  ];
  spec.components[0].layerGroups = [{ id: "g", name: "Operations", visible: false }];
  return JSON.stringify(spec);
}

describe("Map Studio contents workflows", () => {
  it("keeps modifier selection in Contents and commits bulk visibility as one undo step", () => {
    const mounted = mountMapStudio(contentsFixture(), { preview: <div>Native preview</div> });
    const click = (name: string) => act(() => mounted.host.querySelector<HTMLButtonElement>(`[aria-label="Select layer ${name}"]`)!.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true })));
    click("Alpha"); click("Beta");
    expect(mounted.host.querySelector(".hp-map-studio")?.getAttribute("data-drawer")).toBe("layers");
    act(() => button(mounted.host, "Hide selected").click());
    expect(JSON.parse(mounted.json()).components[0].layers.filter((layer: { visible?: boolean }) => layer.visible === false)).toHaveLength(2);
    act(() => mounted.host.querySelector<HTMLButtonElement>('.hp-map-studio-rail [aria-label="Undo"]')!.click());
    expect(JSON.parse(mounted.json()).components[0].layers.every((layer: { visible?: boolean }) => layer.visible !== false)).toBe(true);
    act(() => mounted.host.querySelector<HTMLButtonElement>('.hp-map-studio-rail [aria-label="Redo"]')!.click());
    expect(JSON.parse(mounted.json()).components[0].layers.filter((layer: { visible?: boolean }) => layer.visible === false)).toHaveLength(2);
    change(mounted.host.querySelector<HTMLSelectElement>('[aria-label="Move selected to group"]')!, "g");
    expect(JSON.parse(mounted.json()).components[0].layers.filter((layer: { groupId?: string }) => layer.groupId === "g")).toHaveLength(2);
    act(() => button(mounted.host, "Show selected").click());
    expect(JSON.parse(mounted.json()).components[0].layerGroups[0].visible).toBe(true);
    mounted.cleanup();
  });

  it("orders by canonical order, provides keyboard alternatives, and never estimates runtime counts", () => {
    const commands = createMapCommandChannel();
    const mounted = mountMapStudio(contentsFixture(), { mapCommands: commands });
    const rows = () => Array.from(mounted.host.querySelectorAll('[data-layer-id]')).map(row => row.getAttribute("data-layer-id"));
    expect(rows()).toEqual(["b", "c", "a"]);
    expect(mounted.host.querySelector(".hp-map-contents-list")?.textContent).toContain("Not previewed");
    act(() => mounted.host.querySelector<HTMLButtonElement>('[aria-label="Select layer Alpha"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true })));
    expect(rows()).toEqual(["b", "a", "c"]);
    act(() => commands.publishStatus("operations", { a: { loading: false, featureCount: 1, warnings: ["Partial result"], canFit: true } }));
    change(mounted.host.querySelector<HTMLSelectElement>('[aria-label="Filter layers"]')!, "issues");
    expect(rows()).toEqual(["a"]);
    expect(mounted.host.querySelector(".hp-map-contents-list")?.textContent).toContain("1 feature");
    expect(mounted.host.querySelector(".hp-map-contents-summary")?.textContent).toContain("1 of 3 layers");
    mounted.cleanup();
  });

  it("finds layers inside collapsed groups without changing saved collapse state", () => {
    const spec = JSON.parse(contentsFixture());
    spec.components[0].layerGroups[0].collapsed = true;
    spec.components[0].layers[0].groupId = "g";
    const mounted = mountMapStudio(JSON.stringify(spec));
    expect(mounted.host.querySelector('[aria-label="Select layer Alpha"]')).toBeNull();
    const search = mounted.host.querySelector<HTMLInputElement>('[aria-label="Search layers"]')!;
    act(() => { search.value = "alpha"; search.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(mounted.host.querySelector('[aria-label="Select layer Alpha"]')).not.toBeNull();
    expect(JSON.parse(mounted.json()).components[0].layerGroups[0].collapsed).toBe(true);
    mounted.cleanup();
  });
});
