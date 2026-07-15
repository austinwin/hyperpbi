import type { ResolvedMapFeature, ResolvedMapLayer } from "./resolvedMapTypes";
import { resolveMapLayerCapabilities } from "./mapLayerCapabilities";

/** Canonical runtime identity. The length-prefix encoding avoids delimiter collisions. */
export type MapFeatureKey = string;

function segment(value: string): string {
  return `${value.length}:${value}`;
}

export function createMapFeatureKey(
  mapId: string,
  layerId: string,
  sourceIdentity: string,
  featureId: string,
): MapFeatureKey {
  return `hp-feature|${segment(mapId)}|${segment(layerId)}|${segment(sourceIdentity)}|${segment(featureId)}`;
}

export function mapLayerSourceIdentity(layer: ResolvedMapLayer): string {
  if (layer.sourceIdentity) return layer.sourceIdentity;
  if (layer.sourceType === "powerbi")
    return `powerbi:${layer.datasetName ?? "powerbi"}`;
  if (layer.sourceType === "arcgisFeature")
    return `arcgis-feature:${layer.diagnostics.sourceUrl ?? layer.id}`;
  if (layer.sourceType === "arcgisDynamic")
    return `arcgis-dynamic:${layer.dynamic?.url ?? layer.id}`;
  return `arcgis-tile:${layer.tile?.url ?? layer.id}`;
}

export function resolvedMapFeatureKey(
  mapId: string,
  layer: ResolvedMapLayer,
  feature: ResolvedMapFeature,
): MapFeatureKey {
  return (
    feature.featureKey ??
    createMapFeatureKey(
      mapId,
      layer.id,
      feature.sourceIdentity ?? mapLayerSourceIdentity(layer),
      feature.id,
    )
  );
}

/** Adds canonical identity at the map boundary while keeping legacy feature.id intact. */
export function withCanonicalMapFeatureKeys(
  mapId: string,
  layers: readonly ResolvedMapLayer[],
): ResolvedMapLayer[] {
  return layers.map((layer) => {
    const sourceIdentity = mapLayerSourceIdentity(layer);
    const capabilities = resolveMapLayerCapabilities(layer.sourceType);
    let changed =
      layer.sourceIdentity !== sourceIdentity || layer.capabilities !== capabilities;
    const features = layer.features.map((feature) => {
      const featureKey = createMapFeatureKey(
        mapId,
        layer.id,
        feature.sourceIdentity ?? sourceIdentity,
        feature.id,
      );
      if (
        feature.featureKey === featureKey &&
        feature.sourceIdentity === (feature.sourceIdentity ?? sourceIdentity)
      )
        return feature;
      changed = true;
      return {
        ...feature,
        featureKey,
        sourceIdentity: feature.sourceIdentity ?? sourceIdentity,
      };
    });
    return changed ? { ...layer, sourceIdentity, capabilities, features } : layer;
  });
}
