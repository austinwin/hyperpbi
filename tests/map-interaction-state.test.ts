import { describe, expect, it } from "vitest";
import {
  activateMapFeature,
  emptyMapInteractionState,
  reconcileMapInteractionState,
} from "../src/maps/interactions/mapInteractionState";
import { dashboardReducer, initialDashboardState } from "../src/render/stateStore";

const feature = (featureKey: string) => ({
  featureKey,
  layerId: "layer",
  featureId: featureKey,
});

describe("map interaction state", () => {
  it("keeps a normally re-clicked feature selected and active", () => {
    const first = activateMapFeature(emptyMapInteractionState(), feature("a"), false);
    const second = activateMapFeature(first, feature("a"), false);
    expect(second.selectedFeatureKeys).toEqual(["a"]);
    expect(second.activeFeature?.featureKey).toBe("a");
  });

  it("modifier-deselects the active feature and activates the most recent remaining selection", () => {
    let state = activateMapFeature(undefined, feature("a"), false);
    state = activateMapFeature(state, feature("b"), true);
    expect(state.selectedFeatureKeys).toEqual(["a", "b"]);
    state = activateMapFeature(state, feature("b"), true);
    expect(state.selectedFeatureKeys).toEqual(["a"]);
    expect(state.activeFeature?.featureKey).toBe("a");
  });

  it("modifier-deselecting the only active feature closes details", () => {
    const selected = activateMapFeature(undefined, feature("a"), false);
    const deselected = activateMapFeature(selected, feature("a"), true);
    expect(deselected.selectedFeatureKeys).toEqual([]);
    expect(deselected.activeFeature).toBeUndefined();
  });

  it("reconciles refreshes without closing a retained active feature", () => {
    const selected = activateMapFeature(undefined, feature("a"), false);
    expect(reconcileMapInteractionState(selected, ["a"])?.activeFeature).toBe(
      selected.activeFeature,
    );
    expect(reconcileMapInteractionState(selected, ["b"])?.activeFeature).toBeUndefined();
  });

  it("closes details without clearing selection by default", () => {
    const activated = dashboardReducer(initialDashboardState(), {
      type: "activateMapFeature",
      mapId: "map",
      feature: feature("a"),
    });
    const closed = dashboardReducer(activated, {
      type: "closeMapFeatureDetails",
      mapId: "map",
    });
    expect(closed.mapInteractionState.map.selectedFeatureKeys).toEqual(["a"]);
    expect(closed.mapInteractionState.map.activeFeature).toBeUndefined();
  });
});

