import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio workspace layout", () => {
  it("uses a layer tree, vertical property navigation, and one accessible add menu", () => {
    const mounted = mountMapStudio();
    const navigation = mounted.host.querySelector<HTMLElement>(".hp-map-property-tabs");
    expect(navigation?.getAttribute("aria-orientation")).toBe("vertical");
    expect(navigation?.querySelectorAll('[role="tab"]')).toHaveLength(12);
    expect(mounted.host.querySelector(".hp-map-property-workspace")).not.toBeNull();
    expect(button(mounted.host, "+ Add source").getAttribute("aria-expanded")).toBe("false");

    act(() => button(mounted.host, "+ Add source").click());
    expect(mounted.host.querySelector('[role="menu"][aria-label="Add source"]')).not.toBeNull();
    expect(mounted.host.querySelectorAll('[role="menuitem"]')).toHaveLength(9);
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(mounted.host.querySelector('[role="menu"]')).toBeNull();
    mounted.cleanup();
  });
});
