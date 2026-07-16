import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { button, mountMapStudio } from "./map-studio-fixture";

function inputFor(host: HTMLElement, label: string): HTMLInputElement {
  return Array.from(host.querySelectorAll("label"))
    .find((candidate) => candidate.textContent?.includes(label))
    ?.querySelector("input") as HTMLInputElement;
}

describe("Map Studio performance editor", () => {
  it("uses the Power BI runtime feature-limit default", () => {
    const mounted = mountMapStudio();
    act(() => button(mounted.host, "Performance").click());
    expect(inputFor(mounted.host, "Maximum features").value).toBe("10000");
    expect(mounted.host.textContent).not.toContain("Cache minutes");
    expect(mounted.host.textContent).not.toContain("Query the current viewport");
    mounted.cleanup();
  });

  it("uses ArcGIS runtime defaults and omits nonfunctional authoring options", () => {
    const mounted = mountMapStudio();
    act(() => button(mounted.host, "+ Add layer").click());
    act(() => button(mounted.host, "ArcGIS feature layer").click());
    act(() => button(mounted.host, "Performance").click());

    expect(inputFor(mounted.host, "Maximum features").value).toBe("2000");
    expect(inputFor(mounted.host, "Cache minutes").value).toBe("0");
    expect(inputFor(mounted.host, "Request batch size").value).toBe("");
    expect(inputFor(mounted.host, "Request batch size").placeholder).toBe(
      "Service maximum",
    );
    expect(mounted.host.textContent).toContain("Query the current viewport");
    expect(mounted.host.textContent).not.toContain("Generalize by zoom");
    expect(mounted.host.textContent).not.toContain("Progressive rendering");
    mounted.cleanup();
  });
});
