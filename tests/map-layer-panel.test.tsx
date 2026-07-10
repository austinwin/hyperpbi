import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapLayerPanel } from "../src/components/maps/MapLayerPanel";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { initialDashboardState } from "../src/render/stateStore";
import type { ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

function layer(id: string, overrides: Partial<ResolvedMapLayer> = {}): ResolvedMapLayer {
    return {
        id, name: id === "a" ? "Assets" : "Pipes", sourceType: "arcgisFeature", geometryType: "point",
        visible: true, opacity: 1, order: id === "a" ? 1 : 2, features: [], renderer: { type: "simple", symbol: {} },
        labels: { enabled: true, placement: "center", color: "#333", size: 12, weight: "normal", collision: "none" },
        diagnostics: { featureCount: 4, requestCount: 2, loading: false, sourceType: "arcgisFeature", sourceUrl: "https://services.arcgis.com/test/FeatureServer/0", geometryType: "point", objectIdField: "OBJECTID", queryStrategy: "pagination", cacheUsed: false, joinField: "CODE", joinDiagnostics: { powerBiRowCount: 4, powerBiDistinctKeyCount: 4, serviceFeatureCount: 4, serviceDistinctKeyCount: 4, matchedPowerBiRowCount: 3, matchedServiceFeatureCount: 3, unmatchedPowerBiKeyCount: 1, unmatchedServiceFeatureCount: 1, blankPowerBiKeyCount: 0, blankServiceKeyCount: 0, duplicatePowerBiKeyCount: 0, duplicateServiceKeyCount: 0, matchRate: .75, sampleUnmatchedPowerBiKeys: [], sampleDuplicatePowerBiKeys: [], sampleDuplicateServiceKeys: [] }, usedServiceSymbology: false, usedServiceLabels: false, warnings: [] },
        loading: false, ...overrides,
    };
}

function context(state = initialDashboardState()) {
    const dispatch = vi.fn();
    const value = { state, dispatch } as unknown as RenderContextValue;
    return { value, dispatch };
}

function mount(layers = [layer("a"), layer("b")], configuration?: Parameters<typeof MapLayerPanel>[0]["configuration"], state = initialDashboardState()) {
    const test = context(state);
    const host = document.createElement("div");
    act(() => render(h(RenderContext.Provider, { value: test.value }, h(MapLayerPanel, { mapId: "map", layers, configuration })), host));
    return { ...test, host };
}

function click(host: HTMLElement, label: string) {
    const button = host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`) ??
        Array.from(host.querySelectorAll("button")).find(item => item.textContent?.trim() === label);
    act(() => button?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

afterEach(() => render(null, document.body));

describe("MapLayerPanel", () => {
    it("dispatches visibility, opacity, and label changes", () => {
        const { host, dispatch } = mount();
        click(host, "Hide Assets");
        const opacity = host.querySelector<HTMLInputElement>('input[aria-label="Assets opacity"]')!;
        act(() => { opacity.value = "35"; opacity.dispatchEvent(new Event("input", { bubbles: true })); opacity.dispatchEvent(new FocusEvent("blur", { bubbles: true })); });
        click(host, "Hide labels for Assets");
        expect(dispatch).toHaveBeenCalledWith({ type: "mapLayerVisibility", mapId: "map", layerId: "a", visible: false });
        expect(dispatch).toHaveBeenCalledWith({ type: "mapLayerOpacity", mapId: "map", layerId: "a", opacity: 0.35 });
        expect(dispatch).toHaveBeenCalledWith({ type: "mapLayerLabels", mapId: "map", layerId: "a", visible: false });
    });

    it("commits zero opacity but does not convert a temporary blank draft to zero", () => {
        const { host, dispatch } = mount([layer("a")]);
        const opacity = host.querySelector<HTMLInputElement>('input[aria-label="Assets opacity"]')!;
        act(() => { opacity.value = ""; opacity.dispatchEvent(new Event("input", { bubbles: true })); opacity.dispatchEvent(new FocusEvent("blur", { bubbles: true })); });
        expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "mapLayerOpacity" }));
        act(() => { opacity.value = "0"; opacity.dispatchEvent(new Event("input", { bubbles: true })); opacity.dispatchEvent(new FocusEvent("blur", { bubbles: true })); });
        expect(dispatch).toHaveBeenCalledWith({ type: "mapLayerOpacity", mapId: "map", layerId: "a", opacity: 0 });
    });

    it("reorders with a complete order containing newly added layer IDs", () => {
        const state = initialDashboardState();
        state.mapLayerState.map = { order: ["a", "removed"] };
        const { host, dispatch } = mount(undefined, undefined, state);
        click(host, "Move Pipes up");
        expect(dispatch).toHaveBeenCalledWith({ type: "mapLayerOrder", mapId: "map", layerIds: ["b", "a"] });
    });

    it("respects viewer restriction flags", () => {
        const { host } = mount(undefined, { allowViewerOpacity: false, allowViewerLabels: false, allowViewerReorder: false });
        expect(host.querySelector('input[type="number"]')).toBeNull();
        expect(host.querySelector(".hp-map-layer-label-toggle")).toBeNull();
        expect(host.querySelector(".hp-map-layer-reorder")).toBeNull();
    });

    it("opens readable inline error, warning, source, request, and join diagnostics", () => {
        const failing = layer("a", { error: "Network failed", diagnostics: { ...layer("a").diagnostics, error: "Network failed", warnings: ["Partial geometry"] } });
        const { host } = mount([failing]);
        click(host, "Assets error: Network failed");
        expect(host.textContent).toContain("Network failed");
        expect(host.textContent).toContain("Partial geometry");
        expect(host.textContent).toContain("arcgisFeature");
        expect(host.textContent).toContain("OBJECTID");
        expect(host.textContent).toContain("3 Power BI rows");
    });

    it("dispatches Reset and observes diagnostics loading", () => {
        const loadingLayer = layer("a", { loading: false, diagnostics: { ...layer("a").diagnostics, loading: true } });
        const { host, dispatch } = mount([loadingLayer]);
        expect(host.querySelector(".hp-map-layer-loading")).not.toBeNull();
        click(host, "Reset");
        expect(dispatch).toHaveBeenCalledWith({ type: "resetMapLayers", mapId: "map" });
    });

    it("shows an explicit no-layers state", () => {
        const { host } = mount([]);
        expect(host.textContent).toContain("No map layers are available.");
    });
});
