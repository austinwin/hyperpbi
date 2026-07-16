import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  StudioWorkspaceNav,
  studioWorkspaceGroups,
} from "../src/editor/ui/StudioWorkspaceNav";

describe("Studio workspace navigation", () => {
  it("exposes every existing workspace in grouped menus and the narrow selector", () => {
    const host = document.createElement("div");
    const onChange = vi.fn();
    act(() => render(<StudioWorkspaceNav value="mapStudio" advanced onChange={onChange} />, host));
    const expected = studioWorkspaceGroups.flatMap((group) => group.items.map((item) => item.id));
    const selector = host.querySelector<HTMLSelectElement>(".hp-studio-workspace-select select")!;
    expect(Array.from(selector.options).map((option) => option.value)).toEqual(expected);
    expect(Array.from(host.querySelectorAll(".hp-studio-workspace-group > button")).map((button) => button.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining("Build"), "Data", "Test", "JSON", "Help"]),
    );

    const json = Array.from(host.querySelectorAll<HTMLButtonElement>(".hp-studio-workspace-group > button")).find((button) => button.textContent === "JSON")!;
    expect(json.getAttribute("aria-haspopup")).toBeNull();
    act(() => json.click());
    expect(onChange).toHaveBeenCalledWith("specification");

    const help = Array.from(host.querySelectorAll<HTMLButtonElement>(".hp-studio-workspace-group > button")).find((button) => button.textContent === "Help")!;
    act(() => help.click());
    expect(Array.from(host.querySelectorAll('[role="menuitem"]')).map((item) => item.textContent)).toEqual(["Documentation", "AI Skill"]);

    const build = host.querySelector<HTMLButtonElement>(".hp-studio-workspace-group > button")!;
    act(() => build.click());
    expect(build.getAttribute("aria-expanded")).toBe("true");
    const inspector = Array.from(host.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).find((item) => item.textContent === "Inspector")!;
    act(() => inspector.click());
    expect(onChange).toHaveBeenCalledWith("inspector");
  });

  it("closes an open group on Escape", () => {
    const host = document.createElement("div");
    act(() => render(<StudioWorkspaceNav value="ai" advanced onChange={vi.fn()} />, host));
    const build = host.querySelector<HTMLButtonElement>(".hp-studio-workspace-group > button")!;
    act(() => build.click());
    expect(host.querySelector('[role="menu"]')).not.toBeNull();
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(host.querySelector('[role="menu"]')).toBeNull();
  });
});
