import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { MapToolbar } from "../src/components/maps/MapToolbar";
import type { MapComponent } from "../src/schema/hyperpbiSchema";

function mount(overrides: Partial<Parameters<typeof MapToolbar>[0]> = {}) {
    const callbacks = {
        onHome: vi.fn(), onZoomToSelection: vi.fn(), onSetPopover: vi.fn(), onClearSelection: vi.fn(),
    };
    const props: Parameters<typeof MapToolbar>[0] = {
        mapId: "map",
        component: { type: "map", id: "map" } as MapComponent,
        activePopover: null, layerControlEnabled: true, legendEnabled: true, searchEnabled: true,
        ...callbacks, ...overrides,
    };
    const host = document.createElement("div");
    act(() => render(h(MapToolbar, props), host));
    return { host, callbacks };
}

describe("MapToolbar", () => {
    it("invokes every enabled map callback", () => {
        const { host, callbacks } = mount();
        for (const button of host.querySelectorAll("button")) {
            act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
        }
        expect(callbacks.onHome).toHaveBeenCalledTimes(1);
        expect(callbacks.onZoomToSelection).toHaveBeenCalledTimes(1);
        expect(callbacks.onClearSelection).toHaveBeenCalledTimes(1);
        expect(callbacks.onSetPopover).toHaveBeenCalledTimes(3);
    });

    it("hides disabled layer, legend, and configured toolbar controls", () => {
        const { host } = mount({
            component: { type: "map", toolbar: { home: false, clearSelection: false, zoomToSelection: false } },
            layerControlEnabled: false,
            legendEnabled: false,
            searchEnabled: false,
        });
        expect(host.querySelectorAll("button")).toHaveLength(0);
        expect(host.querySelector('[aria-label="Layers"]')).toBeNull();
        expect(host.querySelector('[aria-label="Legend"]')).toBeNull();
        expect(host.querySelector('[aria-label*="Fullscreen"]')).toBeNull();
    });

    it("exposes pressed state for Layers and Legend", () => {
        const { host } = mount({ activePopover: "layers" });
        expect(host.querySelector('[aria-label="Layers"]')?.getAttribute("aria-pressed")).toBe("true");
        expect(host.querySelector('[aria-label="Legend"]')?.getAttribute("aria-pressed")).toBe("false");
        expect(host.querySelector('[aria-label="Layers"]')?.getAttribute("aria-controls")).toBe("map-map-toolbar-layers-popover");
    });
});
