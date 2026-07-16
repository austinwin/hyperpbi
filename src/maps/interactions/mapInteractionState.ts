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
  /** Identify results are temporary details and never join the selected feature set. */
  kind?: "feature" | "identify";
}

export interface MapInteractionState {
  selectedFeatureKeys: MapFeatureKey[];
  /** Retains the interaction metadata needed to activate the last remaining selection. */
  selectedFeaturesByKey?: Partial<Record<MapFeatureKey, ActiveMapFeature>>;
  hoveredFeatureKey?: MapFeatureKey;
  activeFeature?: ActiveMapFeature;
}

export const emptyMapInteractionState = (): MapInteractionState => ({
  selectedFeatureKeys: [],
  selectedFeaturesByKey: {},
});

export function activateMapFeature(
  state: MapInteractionState | undefined,
  feature: ActiveMapFeature,
  multiSelect: boolean,
): MapInteractionState {
  const current = state ?? emptyMapInteractionState();
  const selectedFeaturesByKey: Partial<
    Record<MapFeatureKey, ActiveMapFeature>
  > = { ...current.selectedFeaturesByKey };
  if (
    current.activeFeature &&
    current.selectedFeatureKeys.includes(current.activeFeature.featureKey)
  )
    selectedFeaturesByKey[current.activeFeature.featureKey] =
      current.activeFeature;
  let selectedFeatureKeys: MapFeatureKey[];
  let activeFeature: ActiveMapFeature | undefined = feature;
  if (!multiSelect) {
    selectedFeatureKeys = [feature.featureKey];
    for (const key of Object.keys(selectedFeaturesByKey))
      if (key !== feature.featureKey) delete selectedFeaturesByKey[key];
    selectedFeaturesByKey[feature.featureKey] = feature;
  } else if (current.selectedFeatureKeys.includes(feature.featureKey)) {
    selectedFeatureKeys = current.selectedFeatureKeys.filter(
      (key) => key !== feature.featureKey,
    );
    delete selectedFeaturesByKey[feature.featureKey];
    if (current.activeFeature?.featureKey === feature.featureKey) {
      const nextActiveKey = selectedFeatureKeys.at(-1);
      activeFeature = nextActiveKey
        ? selectedFeaturesByKey[nextActiveKey]
        : undefined;
    } else {
      activeFeature = current.activeFeature;
    }
  } else {
    selectedFeatureKeys = [...current.selectedFeatureKeys, feature.featureKey];
    selectedFeaturesByKey[feature.featureKey] = feature;
  }
  return {
    ...current,
    selectedFeatureKeys,
    selectedFeaturesByKey,
    activeFeature,
  };
}

export function showMapIdentifiedFeature(
  state: MapInteractionState | undefined,
  feature: ActiveMapFeature,
): MapInteractionState {
  const current = state ?? emptyMapInteractionState();
  return {
    ...current,
    activeFeature: { ...feature, kind: "identify" },
  };
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
  const selectedFeatureKeySet = new Set(selectedFeatureKeys);
  const selectedFeaturesByKey = Object.fromEntries(
    Object.entries(state.selectedFeaturesByKey ?? {}).filter(([key]) =>
      selectedFeatureKeySet.has(key),
    ),
  );
  const activeFeature =
    state.activeFeature?.kind === "identify" ||
    (state.activeFeature && available.has(state.activeFeature.featureKey))
      ? state.activeFeature
      : undefined;
  const hoveredFeatureKey =
    state.hoveredFeatureKey && available.has(state.hoveredFeatureKey)
      ? state.hoveredFeatureKey
      : undefined;
  if (
    selectedFeatureKeys.length === state.selectedFeatureKeys.length &&
    Object.keys(selectedFeaturesByKey).length ===
      Object.keys(state.selectedFeaturesByKey ?? {}).length &&
    activeFeature === state.activeFeature &&
    hoveredFeatureKey === state.hoveredFeatureKey
  )
    return state;
  return {
    selectedFeatureKeys,
    selectedFeaturesByKey,
    activeFeature,
    hoveredFeatureKey,
  };
}

