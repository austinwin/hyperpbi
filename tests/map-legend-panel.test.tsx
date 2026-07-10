import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
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
            layer("Unique", { type: "uniqueValue", valueMap: new Map([["Open", { fillColor: "#0f0", outlineColor: "#030", outlineWidth: 3 }]]) }),
            layer("Breaks", { type: "classBreaks", breaks: [{ min: 0, max: 10, symbol: { fillColor: "#f00", outlineColor: "#300", outlineWidth: 2 } }] }),
            layer("Continuous", { type: "continuousColor", minColor: "#fff", maxColor: "#000", domainMin: 5, domainMax: 25 }),
            layer("Proportional", { type: "proportionalSize", minSize: 4, maxSize: 20, baseColor: "#00f", domainMin: 10, domainMax: 30 }),
            layer("Cluster", { type: "cluster" }),
        ]);
        expect(host.querySelectorAll(".hp-map-legend-layer")).toHaveLength(6);
        expect(host.textContent).toContain("Open");
        expect(host.textContent).toContain("0 – 10");
        expect(host.textContent).toContain("Clustered points");
        expect(host.textContent).toContain("10");
        expect(host.textContent).toContain("20");
        expect(host.textContent).toContain("30");
        expect(host.querySelector('[title="Open"]')?.getAttribute("style")).toContain("3px solid");
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

    it("omits hidden, legend-disabled, heatmap, and density-grid layers", () => {
        const host = mount([
            layer("Hidden", { type: "simple", symbol: {} }),
            layer("Disabled", { type: "simple", symbol: {} }, { legend: { visible: false } }),
            layer("Heat", { type: "heatmap" }),
            layer("Density", { type: "densityGrid" }),
            layer("Shown", { type: "simple", symbol: { fillColor: "#123" } }),
        ], ["Hidden"]);
        expect(host.querySelectorAll(".hp-map-legend-layer")).toHaveLength(1);
        expect(host.textContent).toContain("Shown");
    });
});
