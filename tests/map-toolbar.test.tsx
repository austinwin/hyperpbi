import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { MapToolbar } from "../src/components/maps/MapToolbar";
import type { MapComponent } from "../src/schema/hyperpbiSchema";

function mount(overrides: Partial<Parameters<typeof MapToolbar>[0]> = {}) {
    const callbacks = {
        onHome: vi.fn(), onZoomToSelection: vi.fn(), onToggleLayers: vi.fn(),
        onToggleLegend: vi.fn(), onClearSelection: vi.fn(),
    };
    const props: Parameters<typeof MapToolbar>[0] = {
        component: { type: "map", id: "map" } as MapComponent,
        layerPanelOpen: false, legendOpen: false, layerControlEnabled: true, legendEnabled: true,
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
        for (const callback of Object.values(callbacks)) expect(callback).toHaveBeenCalledTimes(1);
    });

    it("hides disabled layer, legend, and configured toolbar controls", () => {
        const { host } = mount({
            component: { type: "map", toolbar: { home: false, clearSelection: false, zoomToSelection: false } },
            layerControlEnabled: false,
            legendEnabled: false,
        });
        expect(host.querySelectorAll("button")).toHaveLength(0);
        expect(host.querySelector('[aria-label="Toggle layers"]')).toBeNull();
        expect(host.querySelector('[aria-label="Toggle legend"]')).toBeNull();
        expect(host.querySelector('[aria-label*="Fullscreen"]')).toBeNull();
    });

    it("exposes pressed state for Layers and Legend", () => {
        const { host } = mount({ layerPanelOpen: true, legendOpen: false });
        expect(host.querySelector('[aria-label="Toggle layers"]')?.getAttribute("aria-pressed")).toBe("true");
        expect(host.querySelector('[aria-label="Toggle legend"]')?.getAttribute("aria-pressed")).toBe("false");
    });
});
