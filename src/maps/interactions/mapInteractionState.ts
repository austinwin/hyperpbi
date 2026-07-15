import type { MapFeatureKey } from "../model/mapFeatureIdentity";

export interface MapFeatureAnchor {
  lat: number;
  lon: number;
  containerX?: number;
  containerY?: number;
}

export interface ActiveMapFeature {
  featureKey: MapFeatureKey;
  layerId: string;
  featureId: string;
  anchor?: MapFeatureAnchor;
}

export interface MapInteractionState {
  selectedFeatureKeys: MapFeatureKey[];
  hoveredFeatureKey?: MapFeatureKey;
  activeFeature?: ActiveMapFeature;
}

export const emptyMapInteractionState = (): MapInteractionState => ({
  selectedFeatureKeys: [],
});

export function activateMapFeature(
  state: MapInteractionState | undefined,
  feature: ActiveMapFeature,
  multiSelect: boolean,
): MapInteractionState {
  const current = state ?? emptyMapInteractionState();
  let selectedFeatureKeys: MapFeatureKey[];
  if (!multiSelect) {
    selectedFeatureKeys = [feature.featureKey];
  } else if (current.selectedFeatureKeys.includes(feature.featureKey)) {
    selectedFeatureKeys = current.selectedFeatureKeys.filter(
      (key) => key !== feature.featureKey,
    );
  } else {
    selectedFeatureKeys = [...current.selectedFeatureKeys, feature.featureKey];
  }
  return { ...current, selectedFeatureKeys, activeFeature: feature };
}

export function reconcileMapInteractionState(
  state: MapInteractionState | undefined,
  availableFeatureKeys: readonly MapFeatureKey[],
): MapInteractionState | undefined {
  if (!state) return state;
  const available = new Set(availableFeatureKeys);
  const selectedFeatureKeys = state.selectedFeatureKeys.filter((key) =>
    available.has(key),
  );
  const activeFeature =
    state.activeFeature && available.has(state.activeFeature.featureKey)
      ? state.activeFeature
      : undefined;
  const hoveredFeatureKey =
    state.hoveredFeatureKey && available.has(state.hoveredFeatureKey)
      ? state.hoveredFeatureKey
      : undefined;
  if (
    selectedFeatureKeys.length === state.selectedFeatureKeys.length &&
    activeFeature === state.activeFeature &&
    hoveredFeatureKey === state.hoveredFeatureKey
  )
    return state;
  return { selectedFeatureKeys, activeFeature, hoveredFeatureKey };
}

