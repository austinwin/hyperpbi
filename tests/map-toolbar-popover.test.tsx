import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapToolbarPopover } from "../src/components/maps/MapToolbarPopover";

function mount() {
    const close = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    act(() => render(h(MapToolbarPopover, { id: "map-popover", title: "Layers", subtitle: "2 total", onClose: close }, h("button", { type: "button" }, "Inside")), host));
    return { host, close };
}

afterEach(() => document.body.replaceChildren());

describe("MapToolbarPopover", () => {
    it("exposes an accessible nonmodal dialog and closes on Escape", () => {
        const { host, close } = mount();
        expect(host.querySelector('[role="dialog"]')?.getAttribute("aria-modal")).toBe("false");
        act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
        expect(close).toHaveBeenCalledTimes(1);
    });

    it("closes on outside pointer interaction but not on interaction inside", () => {
        const { host, close } = mount();
        act(() => host.querySelector('[role="dialog"]')!.dispatchEvent(new Event("pointerdown", { bubbles: true })));
        expect(close).not.toHaveBeenCalled();
        act(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
        expect(close).toHaveBeenCalledTimes(1);
    });
});
