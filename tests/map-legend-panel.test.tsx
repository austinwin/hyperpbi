import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { MapLegendPanel } from "../src/components/maps/MapLegendPanel";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { initialDashboardState } from "../src/render/stateStore";
import type { ResolvedMapLayer, ResolvedMapRenderer } from "../src/maps/model/resolvedMapTypes";

function layer(id: string, renderer: ResolvedMapRenderer, overrides: Partial<ResolvedMapLayer> = {}): ResolvedMapLayer {
    return { id, name: id, sourceType: "powerbi", geometryType: "point", visible: true, opacity: 1, order: 1, features: [], renderer,
        diagnostics: { featureCount: 0, requestCount: 0, loading: false, sourceType: "powerbi", geometryType: "point", usedServiceSymbology: false, usedServiceLabels: false, warnings: [] }, loading: false, ...overrides };
}

function mount(layers: ResolvedMapLayer[], hidden: string[] = []) {
    const state = initialDashboardState();
    state.mapLayerState.map = { visibility: Object.fromEntries(hidden.map(id => [id, false])) };
    const context = { state } as unknown as RenderContextValue;
    const host = document.createElement("div");
    act(() => render(h(RenderContext.Provider, { value: context }, h(MapLegendPanel, { mapId: "map", layers })), host));
    return host;
}

describe("MapLegendPanel", () => {
    it("renders all supported renderer types across multiple layers", () => {
        const host = mount([
            layer("Simple", { type: "simple", symbol: { shape: "circle", fillColor: "#111", outlineColor: "#fff", outlineWidth: 2 } }),
            layer("Unique", { type: "uniqueValue", valueMap: new Map([["Open", { fillColor: "#0f0", outlineColor: "#030", outlineWidth: 3 }]]), valueLabels: new Map([["Open", "Open facilities"]]) }),
            layer("Breaks", { type: "classBreaks", breaks: [{ min: 0, max: 10, symbol: { fillColor: "#f00", outlineColor: "#300", outlineWidth: 2 } }] }),
            layer("Continuous", { type: "continuousColor", minColor: "#fff", maxColor: "#000", domainMin: 5, domainMax: 25 }),
            layer("Proportional", { type: "proportionalSize", minSize: 4, maxSize: 20, baseColor: "#00f", domainMin: 10, domainMax: 30 }),
            layer("Cluster", { type: "cluster" }),
        ]);
        expect(host.querySelectorAll(".hp-map-legend-group")).toHaveLength(6);
        expect(host.textContent).toContain("Open facilities");
        expect(host.textContent).toContain("0 – 10");
        expect(host.textContent).toContain("Cluster count");
        expect(host.textContent).toContain("10");
        expect(host.textContent).toContain("20");
        expect(host.textContent).toContain("30");
        expect(host.textContent).not.toContain("default");
        expect(host.querySelector('[title="Open facilities"]')?.getAttribute("style")).toContain("3px solid");
    });

    it("renders an Other category when a default symbol has no label", () => {
        const host = mount([layer("Unique", { type: "uniqueValue", valueMap: new Map([["A", { fillColor: "#aaa" }]]), defaultSymbol: { fillColor: "#ccc" } })]);
        expect(host.textContent).toContain("Other");
        expect(host.querySelector('[title="Other"]')).not.toBeNull();
    });

    it("uses details/summary for collapsed legends", () => {
        const host = mount([layer("Collapsed", { type: "simple", symbol: { fillColor: "#111" } }, { legend: { collapsed: true, title: "Assets" } })]);
        expect(host.querySelector("details")).not.toBeNull();
        expect(host.querySelector("summary")?.textContent).toBe("Assets");
    });

    it("omits hidden and legend-disabled layers while rendering heat and density legends", () => {
        const host = mount([
            layer("Hidden", { type: "simple", symbol: {} }),
            layer("Disabled", { type: "simple", symbol: {} }, { legend: { visible: false } }),
            layer("Heat", { type: "heatmap" }),
            layer("Density", { type: "densityGrid" }),
            layer("Shown", { type: "simple", symbol: { fillColor: "#123" } }),
        ], ["Hidden"]);
        expect(host.querySelectorAll(".hp-map-legend-group")).toHaveLength(3);
        expect(host.querySelectorAll(".hp-map-legend-gradient")).toHaveLength(2);
        expect(host.textContent).toContain("Shown");
    });

    it("shows an explicit empty state when no visible layer has legend entries", () => {
        const host = mount([layer("Hidden", { type: "simple", symbol: {} })], ["Hidden"]);
        expect(host.textContent).toContain("No legend entries are available for the currently visible layers.");
    });

    it("uses one click/hover pipeline for select, Ctrl/Cmd multi-select, and external interaction", () => {
        const dispatch = vi.fn();
        const select = vi.fn();
        const state = initialDashboardState();
        const context = { state, dispatch } as unknown as RenderContextValue;
        const features = ["Active", "Warning"].map((category, index) => ({
            id: `f${index}`,
            featureKey: `feature-${index}`,
            layerId: "Status",
            geometryType: "point" as const,
            geometry: null,
            lat: 30 + index,
            lon: -97,
            powerBiAttributes: { category },
            serviceAttributes: {},
            joinedAttributes: {},
            powerBiRowIndices: [index],
            powerBiRowKeys: [`row-${index}`],
            selected: false,
        }));
        const interactive = layer("Status", {
            type: "uniqueValue",
            field: "category",
            fieldSource: "powerbi",
            valueMap: new Map([["Active", { fillColor: "#0f0" }], ["Warning", { fillColor: "#f90" }]]),
        }, {
            features,
            legend: { interactive: true, clickAction: "select", selectionMode: "multiple", hoverAction: "highlight", externalInteraction: true },
        });
        const host = document.createElement("div");
        act(() => render(h(RenderContext.Provider, { value: context }, h(MapLegendPanel, { mapId: "map", layers: [interactive], onSelectFeatures: select })), host));
        const entries = host.querySelectorAll<HTMLButtonElement>(".hp-map-legend-entry-main");
        act(() => entries[0].dispatchEvent(new MouseEvent("mouseenter", { bubbles: true })));
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "setMapLegendHover", featureKeys: ["feature-0"] }));
        act(() => entries[0].dispatchEvent(new MouseEvent("click", { bubbles: true })));
        act(() => entries[1].dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true })));
        expect(select).toHaveBeenNthCalledWith(1, interactive, ["feature-0"], "toggle");
        expect(select).toHaveBeenNthCalledWith(2, interactive, ["feature-1"], "toggle");
    });
});
