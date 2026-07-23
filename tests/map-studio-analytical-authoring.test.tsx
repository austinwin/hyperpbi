import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { button, change, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio analytical map authoring", () => {
  it("authors legend interactions, rich icons, heat settings, selection tools, quick filters, and basic tools", () => {
    const mounted = mountMapStudio();

    act(() => button(mounted.host, "Basemap & view").click());
    expect(mounted.host.textContent).toContain("Circle / radius selection");
    expect(mounted.host.textContent).toContain("Maximum selected features");
    expect(mounted.host.textContent).toContain("Power BI identity limit");
    expect(mounted.host.textContent).toContain("Interactive legend");
    expect(mounted.host.textContent).toContain("Map quick filters");
    expect(mounted.host.textContent).toContain("Scale bar");
    expect(mounted.host.textContent).toContain("Coordinate display");

    act(() => mounted.host.querySelector<HTMLButtonElement>('[aria-label="Select layer Assets"]')!.click());
    const category = mounted.host.querySelector<HTMLSelectElement>(".hp-map-property-select select")!;
    change(category, "legend");
    expect(mounted.host.querySelector('[aria-label="Legend interaction mode"]')).not.toBeNull();
    expect(mounted.host.textContent).toContain("Feature counts");
    expect(mounted.host.textContent).toContain("Send eligible Power BI interaction");

    change(category, "renderer");
    const renderer = mounted.host.querySelector<HTMLSelectElement>('[aria-label="Renderer type"]')!;
    change(renderer, "icon");
    expect(mounted.host.textContent).toContain("Icon mapping field");
    expect(mounted.host.textContent).toContain("Selected outline color");
    expect(mounted.host.textContent).toContain("Hover outline color");
    change(renderer, "heatmap");
    expect(mounted.host.textContent).toContain("Heatmap canvas");
    expect(mounted.host.textContent).toContain("Visible viewport");

    const specification = JSON.parse(mounted.json());
    expect(specification.components[0].layers[0].renderer.type).toBe("heatmap");
    mounted.cleanup();
  });
});
