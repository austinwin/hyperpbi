import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { mountMapStudio } from "./map-studio-fixture";

describe("Map Studio form controls", () => {
  it("renders layer visibility as a compact checkbox row and updates canonical JSON", () => {
    const mounted = mountMapStudio();
    const row = mounted.host.querySelector<HTMLElement>(".hp-map-studio-layer")!;
    const checkboxRow = row.querySelector<HTMLElement>(".hp-map-layer-visibility")!;
    const checkbox = checkboxRow.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(checkboxRow.classList.contains("hp-studio-check")).toBe(true);
    expect(checkbox.checked).toBe(true);
    act(() => {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(JSON.parse(mounted.json()).components[0].layers[0].visible).toBe(false);
    expect(row.querySelector(".hp-map-source-badge")?.textContent).toContain("Power BI");
    expect(mounted.host.querySelector(".hp-studio-button-danger")).not.toBeNull();
    mounted.cleanup();
  });
});
