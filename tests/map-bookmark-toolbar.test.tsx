import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { MapBookmarkPanel } from "../src/components/maps/MapBookmarkPanel";
import { MapToolbar } from "../src/components/maps/MapToolbar";

const bookmarks = [
  { id: "north", label: "North operations and clinical facilities", center: [30, -95] as [number, number], zoom: 10 },
  { id: "south", label: "South", center: [29, -95] as [number, number], zoom: 11 },
];

describe("map bookmark toolbar", () => {
  it("uses a styled toolbar popover button instead of a native select", () => {
    const onSetPopover = vi.fn();
    const host = document.createElement("div");
    act(() =>
      render(
        h(MapToolbar, {
          mapId: "map",
          component: { type: "map", id: "map", bookmarks },
          activePopover: null,
          layerControlEnabled: false,
          legendEnabled: false,
          searchEnabled: false,
          onHome: vi.fn(),
          onZoomToSelection: vi.fn(),
          onSetPopover,
          onClearSelection: vi.fn(),
        }),
        host,
      ),
    );
    const button = host.querySelector<HTMLButtonElement>('[aria-label="View bookmarks"]')!;
    expect(button.classList.contains("hp-map-toolbar-btn")).toBe(true);
    expect(button.getAttribute("aria-controls")).toBe("map-map-toolbar-bookmarks-popover");
    expect(host.querySelector("select")).toBeNull();
    act(() => button.click());
    expect(onSetPopover).toHaveBeenCalledWith("bookmarks");
  });

  it("supports current-state styling, activation, and arrow-key focus", () => {
    const onActivate = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    act(() => render(h(MapBookmarkPanel, { bookmarks, activeBookmarkId: "south", onActivate }), host));
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>("button"));
    expect(buttons[1].getAttribute("aria-selected")).toBe("true");
    act(() => buttons[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
    expect(document.activeElement).toBe(buttons[1]);
    act(() => buttons[1].click());
    expect(onActivate).toHaveBeenCalledWith("south");
  });
});
