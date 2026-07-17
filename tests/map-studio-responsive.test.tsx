import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mountMapStudio } from "./map-studio-fixture";
import { act } from "preact/test-utils";

describe("Map Studio responsive contract", () => {
  it("provides pane switching and a narrow property selector without losing selection", () => {
    const mounted = mountMapStudio();
    expect(mounted.host.querySelector('.hp-map-studio-pane-switch [role="tab"]')).not.toBeNull();
    const selector = mounted.host.querySelector<HTMLSelectElement>(".hp-map-property-select select")!;
    expect(Array.from(selector.options).map((option) => option.value)).toContain("diagnostics");
    expect(mounted.host.querySelector('.hp-map-studio-layer[draggable="true"]')).not.toBeNull();
    mounted.cleanup();
  });

  it("uses Map Studio container width for single-pane and compact property modes", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/hyperpbi-map-studio.css"), "utf8");
    expect(css).toContain("container: hp-map-studio / inline-size");
    expect(css).toContain("@container hp-map-studio (max-width: 720px)");
    expect(css).toContain("@container hp-map-studio (max-width: 560px)");
    expect(css).toContain(".hp-map-property-select");
    expect(css).toContain("grid-template-columns: 140px minmax(320px, 1fr)");
  });

  it("authors rectangle and lasso tools through the basemap and view editor", () => {
    const mounted = mountMapStudio();
    const basemap = Array.from(mounted.host.querySelectorAll<HTMLButtonElement>("button")).find(item => item.textContent?.includes("Basemap & view"))!;
    act(() => basemap.click());
    const label = (text: string) => Array.from(mounted.host.querySelectorAll("label")).find(item => item.textContent?.includes(text))!;
    const rectangle = label("Rectangle selection").querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const lasso = label("Lasso selection").querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    act(() => { rectangle.checked = true; rectangle.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(JSON.parse(mounted.json()).components[0].tools, "rectangle change did not commit").toBeDefined();
    act(() => { lasso.checked = true; lasso.dispatchEvent(new Event("change", { bubbles: true })); });
    const map = JSON.parse(mounted.json()).components[0];
    expect(map.tools, mounted.host.textContent ?? "").toMatchObject({ rectangleSelection: { enabled: true, selectionMode: "replace" }, lassoSelection: { enabled: true, selectionMode: "replace", minimumPoints: 3 } });
    expect(map.toolbar).toMatchObject({ rectangleSelection: true, lassoSelection: true });
    mounted.cleanup();
  });
});
