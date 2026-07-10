import { beforeEach, describe, expect, it, vi } from "vitest";

const leaflet = vi.hoisted(() => {
    const overlays: Array<Record<string, unknown>> = [];
    const imageOverlay = vi.fn((_url: string, bounds: unknown, options: Record<string, unknown>) => {
        const element = { style: { display: "" } };
        const overlay: Record<string, unknown> = {
            bounds, options, element, urls: [] as string[], opacity: options.opacity,
            onAdd: vi.fn(() => element), onRemove: vi.fn(),
            getElement: vi.fn(() => element),
            setUrl: vi.fn((url: string) => { (overlay.urls as string[]).push(url); return overlay; }),
            setBounds: vi.fn((next: unknown) => { overlay.bounds = next; return overlay; }),
            setOpacity: vi.fn((value: number) => { overlay.opacity = value; return overlay; }),
        };
        overlays.push(overlay);
        return overlay;
    });
    return { overlays, imageOverlay };
});

vi.mock("leaflet", () => ({ imageOverlay: leaflet.imageOverlay }));

import { createArcGisDynamicLayer } from "../src/maps/arcgis/arcGisDynamicLayer";

function fakeMap(initialZoom = 10) {
    let zoom = initialZoom;
    const listeners = new Map<string, Set<() => void>>();
    const bounds = { getWest: () => -96, getSouth: () => 29, getEast: () => -94, getNorth: () => 31 };
    return {
        on: vi.fn((name: string, handler: () => void) => { const set = listeners.get(name) ?? new Set(); set.add(handler); listeners.set(name, set); }),
        off: vi.fn((name: string, handler: () => void) => listeners.get(name)?.delete(handler)),
        emit(name: string) { for (const handler of listeners.get(name) ?? []) handler(); },
        getBounds: vi.fn(() => bounds), getSize: vi.fn(() => ({ x: 640, y: 480 })),
        getZoom: vi.fn(() => zoom), setZoom(value: number) { zoom = value; }, listeners,
    };
}

let preloadFails = false;
let objectUrlIndex = 0;
const revoked: string[] = [];

beforeEach(() => {
    vi.useRealTimers();
    leaflet.overlays.length = 0;
    leaflet.imageOverlay.mockClear();
    preloadFails = false;
    objectUrlIndex = 0;
    revoked.length = 0;
    vi.stubGlobal("fetch", vi.fn(async () => ({
        ok: true, headers: { get: () => "image/png" }, blob: async () => new Blob(["png"], { type: "image/png" }),
    })));
    vi.stubGlobal("URL", class extends globalThis.URL {
        static createObjectURL() { return `blob:test-${++objectUrlIndex}`; }
        static revokeObjectURL(url: string) { revoked.push(url); }
    });
    vi.stubGlobal("Image", class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) { queueMicrotask(() => preloadFails ? this.onerror?.() : this.onload?.()); }
    });
});

function addLayer(options: Record<string, unknown> = {}, state = vi.fn()) {
    const layer = createArcGisDynamicLayer({
        url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/MapServer",
        debounceMs: 20,
        ...options,
    }, state);
    const map = fakeMap((options.zoom as number | undefined) ?? 10);
    (layer.onAdd as (map: unknown) => unknown)(map);
    return { layer, map, overlay: leaflet.overlays.at(-1)!, state };
}

describe("ArcGIS dynamic layer", () => {
    it("builds a real export request with bounds, size, layers, and definitions", async () => {
        const { overlay } = addLayer({ layerIds: [1, 3], layerDefinitions: { 1: "STATUS='Open'" }, pane: "assets-pane", opacity: .4 });
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
        expect(url.pathname).toMatch(/MapServer\/export$/);
        expect(url.searchParams.get("bbox")).toBe("-96,29,-94,31");
        expect(url.searchParams.get("size")).toBe("640,480");
        expect(url.searchParams.get("layers")).toBe("show:1,3");
        expect(url.searchParams.get("layerDefs")).toContain("STATUS");
        expect((overlay.options as Record<string, unknown>).pane).toBe("assets-pane");
        expect(overlay.opacity).toBe(.4);
    });

    it("preloads replacements, preserves the current image on failure, and revokes URLs safely", async () => {
        const { map, overlay } = addLayer();
        await vi.waitFor(() => expect((overlay.urls as string[])).toEqual(["blob:test-1"]));
        map.emit("moveend");
        await new Promise(resolve => setTimeout(resolve, 30));
        await vi.waitFor(() => expect((overlay.urls as string[])).toEqual(["blob:test-1", "blob:test-2"]));
        expect(revoked).toContain("blob:test-1");

        preloadFails = true;
        map.emit("moveend");
        await new Promise(resolve => setTimeout(resolve, 30));
        await vi.waitFor(() => expect(revoked).toContain("blob:test-3"));
        expect((overlay.urls as string[]).at(-1)).toBe("blob:test-2");
    });

    it("cancels immediately when an external signal is already aborted", async () => {
        const controller = new AbortController();
        controller.abort();
        addLayer({ signal: controller.signal });
        await Promise.resolve();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("does not refresh outside zoom limits and refreshes once on re-entry", async () => {
        const { map, overlay } = addLayer({ minZoom: 5, maxZoom: 12, zoom: 3 });
        await Promise.resolve();
        expect(fetch).not.toHaveBeenCalled();
        expect((overlay.element as { style: { display: string } }).style.display).toBe("none");
        map.setZoom(8);
        map.emit("zoomend");
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        expect((overlay.element as { style: { display: string } }).style.display).toBe("");
        map.emit("zoomend");
        await Promise.resolve();
        expect(fetch).toHaveBeenCalledTimes(1);
        map.setZoom(15);
        map.emit("zoomend");
        map.emit("moveend");
        await new Promise(resolve => setTimeout(resolve, 30));
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("updates opacity and cleans listeners, timers, requests, and active URLs on removal", async () => {
        vi.useFakeTimers();
        const { layer, map, overlay } = addLayer();
        await vi.runAllTicks();
        await vi.waitFor(() => expect((overlay.urls as string[])).toHaveLength(1));
        layer.setOpacity(.2);
        expect(overlay.opacity).toBe(.2);
        map.emit("moveend");
        (layer.onRemove as (map: unknown) => unknown)(map);
        await vi.advanceTimersByTimeAsync(100);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(map.off).toHaveBeenCalledWith("moveend", expect.any(Function));
        expect(map.off).toHaveBeenCalledWith("resize", expect.any(Function));
        expect(map.off).toHaveBeenCalledWith("zoomend", expect.any(Function));
        expect(revoked).toContain("blob:test-1");
    });
});
