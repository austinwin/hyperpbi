// ── Map Layer State Tests ────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { dashboardReducer, initialDashboardState, type DashboardState, type DashboardAction } from "../src/render/stateStore";
import { toggleMapToolbarPopover } from "../src/components/maps/MapToolbar";
import { resolveMapToolbarPopover } from "../src/components/maps/MapBlock";

function state(overrides: Partial<DashboardState> = {}): DashboardState {
    return { ...initialDashboardState(), ...overrides };
}

describe("Map Layer State Reducer", () => {
    describe("mapLayerVisibility", () => {
        it("sets layer visibility to false", () => {
            const s = state();
            const action: DashboardAction = {
                type: "mapLayerVisibility",
                mapId: "map1",
                layerId: "layerA",
                visible: false,
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.visibility?.layerA).toBe(false);
        });

        it("sets layer visibility to true", () => {
            const s = state({
                mapLayerState: { map1: { visibility: { layerA: false } } },
            });
            const action: DashboardAction = {
                type: "mapLayerVisibility",
                mapId: "map1",
                layerId: "layerA",
                visible: true,
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.visibility?.layerA).toBe(true);
        });
    });

    describe("mapLayerOpacity", () => {
        it("sets layer opacity", () => {
            const s = state();
            const action: DashboardAction = {
                type: "mapLayerOpacity",
                mapId: "map1",
                layerId: "layerA",
                opacity: 0.5,
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.opacity?.layerA).toBe(0.5);
        });

        it("clamps opacity from 0 to 1 in the reducer", () => {
            const s = state();
            const action: DashboardAction = {
                type: "mapLayerOpacity",
                mapId: "map1",
                layerId: "layerA",
                opacity: 1.5,
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.opacity?.layerA).toBe(1);
        });

        it("clamps negative opacity to 0", () => {
            const s = state();
            const action: DashboardAction = {
                type: "mapLayerOpacity",
                mapId: "map1",
                layerId: "layerA",
                opacity: -0.5,
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.opacity?.layerA).toBe(0);
        });

        it("rejects non-finite opacity", () => {
            const next = dashboardReducer(state(), { type: "mapLayerOpacity", mapId: "map1", layerId: "layerA", opacity: Number.NaN });
            expect(next.mapLayerState.map1?.opacity?.layerA).toBe(1);
        });
    });

    describe("mapLayerLabels", () => {
        it("toggles labels on", () => {
            const s = state();
            const action: DashboardAction = {
                type: "mapLayerLabels",
                mapId: "map1",
                layerId: "layerA",
                visible: true,
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.labels?.layerA).toBe(true);
        });

        it("toggles labels off", () => {
            const s = state({ mapLayerState: { map1: { labels: { layerA: true } } } });
            const action: DashboardAction = {
                type: "mapLayerLabels",
                mapId: "map1",
                layerId: "layerA",
                visible: false,
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.labels?.layerA).toBe(false);
        });
    });

    describe("mapLayerOrder", () => {
        it("sets complete layer order array", () => {
            const s = state();
            const action: DashboardAction = {
                type: "mapLayerOrder",
                mapId: "map1",
                layerIds: ["layerB", "layerA", "layerC"],
            };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1?.order).toEqual(["layerB", "layerA", "layerC"]);
        });
    });

    describe("resetMapLayers", () => {
        it("removes all layer state for a map", () => {
            const s = state({
                mapLayerState: {
                    map1: { visibility: { layerA: false } },
                    map2: { visibility: { layerB: true } },
                },
            });
            const action: DashboardAction = { type: "resetMapLayers", mapId: "map1" };
            const next = dashboardReducer(s, action);
            expect(next.mapLayerState.map1).toBeUndefined();
            expect(next.mapLayerState.map2).toBeDefined();
        });
    });

    describe("selectMapFeatures", () => {
        it("replaces existing selection", () => {
            const s = state({ mapSelectedFeatureIds: { map1: ["feat1", "feat2"] } });
            const action: DashboardAction = {
                type: "selectMapFeatures",
                mapId: "map1",
                featureIds: ["feat3"],
                selectionMode: "replace",
            };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds.map1).toEqual(["feat3"]);
        });

        it("adds to existing selection", () => {
            const s = state({ mapSelectedFeatureIds: { map1: ["feat1"] } });
            const action: DashboardAction = {
                type: "selectMapFeatures",
                mapId: "map1",
                featureIds: ["feat2"],
                selectionMode: "add",
            };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds.map1).toEqual(["feat1", "feat2"]);
        });

        it("toggles features on and off", () => {
            const s = state({ mapSelectedFeatureIds: { map1: ["feat1", "feat2"] } });
            // Toggle feat1 off, feat3 on
            const action: DashboardAction = {
                type: "selectMapFeatures",
                mapId: "map1",
                featureIds: ["feat1", "feat3"],
                selectionMode: "toggle",
            };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds.map1).toEqual(["feat2", "feat3"]);
        });

        it("removes empty map entries after toggle clears all", () => {
            const s = state({ mapSelectedFeatureIds: { map1: ["feat1"] } });
            const action: DashboardAction = {
                type: "selectMapFeatures",
                mapId: "map1",
                featureIds: ["feat1"],
                selectionMode: "toggle",
            };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds.map1).toBeUndefined();
        });

        it("preserves other maps selections", () => {
            const s = state({
                mapSelectedFeatureIds: {
                    map1: ["feat1"],
                    map2: ["featA"],
                },
            });
            const action: DashboardAction = {
                type: "selectMapFeatures",
                mapId: "map1",
                featureIds: ["feat2"],
                selectionMode: "replace",
            };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds.map2).toEqual(["featA"]);
        });
    });

    describe("clearMapFeatures", () => {
        it("removes map-local selection", () => {
            const s = state({ mapSelectedFeatureIds: { map1: ["feat1"] } });
            const action: DashboardAction = { type: "clearMapFeatures", mapId: "map1" };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds.map1).toBeUndefined();
        });
    });

    describe("resetInteractions clears map selections", () => {
        it("clears mapSelectedFeatureIds", () => {
            const s = state({ mapSelectedFeatureIds: { map1: ["feat1"] } });
            const action: DashboardAction = { type: "resetInteractions" };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds).toEqual({});
        });
    });

    describe("clearFilters clears map selections", () => {
        it("clears mapSelectedFeatureIds", () => {
            const s = state({ mapSelectedFeatureIds: { map1: ["feat1"] } });
            const action: DashboardAction = { type: "clearFilters" };
            const next = dashboardReducer(s, action);
            expect(next.mapSelectedFeatureIds).toEqual({});
        });
    });

    describe("map toolbar popover state", () => {
        it("closes a Layers panel resolved from the component default", () => {
            const resolvedDefault = resolveMapToolbarPopover(undefined, true, false);
            const next = dashboardReducer(state(), { type: "setMapToolbarPopover", mapId: "map1", popover: toggleMapToolbarPopover(resolvedDefault, "layers") });
            expect(next.mapUiState.map1?.toolbarPopover).toBeNull();
        });

        it("the first click closes a default-open Legend", () => {
            const resolvedDefault = resolveMapToolbarPopover(undefined, false, true);
            expect(toggleMapToolbarPopover(resolvedDefault, "legend")).toBeNull();
        });

        it("switches directly from Legend to Layers", () => {
            expect(toggleMapToolbarPopover("legend", "layers")).toBe("layers");
        });

        it("clicking an active toolbar button closes it", () => {
            expect(toggleMapToolbarPopover("search", "search")).toBeNull();
        });

        it("retains null as explicit closed state", () => {
            const next = dashboardReducer(state(), { type: "setMapToolbarPopover", mapId: "map1", popover: null });
            expect(next.mapUiState.map1).toEqual({ toolbarPopover: null });
            expect(resolveMapToolbarPopover(next.mapUiState.map1?.toolbarPopover, true, true)).toBeNull();
        });

        it("resetting layer overrides keeps Layers open", () => {
            const s = state({ mapLayerState: { map1: { opacity: { a: .5 } } }, mapUiState: { map1: { toolbarPopover: "layers" } } });
            const next = dashboardReducer(s, { type: "resetMapLayers", mapId: "map1" });
            expect(next.mapLayerState.map1).toBeUndefined();
            expect(next.mapUiState.map1?.toolbarPopover).toBe("layers");
        });
    });
});
