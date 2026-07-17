import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudioWorkspaceNav } from "../src/editor/ui/StudioWorkspaceNav";

const expectedWorkspaceIds = [
  "ai",
  "inspector",
  "mapStudio",
  "settings",
  "calculations",
  "interactions",
  "mapServices",
  "config",
  "specification",
  "help",
  "skill",
];

let host: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "requestAnimationFrame",
    (callback: FrameRequestCallback) =>
      setTimeout(() => callback(performance.now()), 0) as unknown as number,
  );
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(() => {
  act(() => render(null, host));
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function mount(value: Parameters<typeof StudioWorkspaceNav>[0]["value"] = "mapStudio") {
  const onChange = vi.fn();
  act(() =>
    render(
      <StudioWorkspaceNav value={value} advanced onChange={onChange} />,
      host,
    ),
  );
  return onChange;
}

describe("Studio workspace navigation", () => {
  it("exposes an explicit, complete workspace list in grouped menus and the selector", () => {
    const onChange = mount();
    const selector = host.querySelector<HTMLSelectElement>(
      ".hp-studio-workspace-select select",
    )!;
    expect(Array.from(selector.options).map((option) => option.value)).toEqual(
      expectedWorkspaceIds,
    );
    expect(
      Array.from(
        host.querySelectorAll<HTMLElement>("[data-workspace-trigger]"),
      ).map((button) => button.dataset.workspaceTrigger),
    ).toEqual(["Create", "Data & logic", "Test", "Advanced", "Learn"]);

    act(() => {
      selector.value = "specification";
      selector.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("specification");

    const advanced = host.querySelector<HTMLButtonElement>(
      '[data-workspace-trigger="Advanced"]',
    )!;
    act(() => advanced.click());
    expect(
      Array.from(host.querySelectorAll('[role="menuitem"]')).map(
        (item) => item.querySelector("span")?.textContent,
      ),
    ).toEqual(["Runtime settings", "JSON editor"]);
  });

  it("supports complete menu keyboard navigation and restores trigger focus", () => {
    mount("ai");
    const create = host.querySelector<HTMLButtonElement>(
      '[data-workspace-trigger="Create"]',
    )!;
    create.focus();

    act(() =>
      create.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      ),
    );
    act(() => vi.runAllTimers());

    const menu = host.querySelector<HTMLElement>('[role="menu"]')!;
    const items = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    );
    expect(items[0]).toBe(document.activeElement);

    act(() =>
      menu.dispatchEvent(
        new KeyboardEvent("keydown", { key: "End", bubbles: true }),
      ),
    );
    expect(items.at(-1)).toBe(document.activeElement);

    act(() =>
      menu.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      ),
    );
    expect(items[0]).toBe(document.activeElement);

    act(() =>
      menu.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    expect(host.querySelector('[role="menu"]')).toBeNull();
    expect(create).toBe(document.activeElement);
  });
});
