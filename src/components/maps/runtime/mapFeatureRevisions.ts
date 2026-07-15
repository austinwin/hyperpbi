import type {
  ResolvedMapFeature,
  ResolvedMapLayer,
  ResolvedMapRenderer,
} from "../../../maps/model/resolvedMapTypes";
import { featureStyle } from "../../../maps/renderers/mapFeatureSymbol";
import type { LeafletFeatureStyle } from "../../../maps/renderers/mapFeatureSymbol";

export interface ResolvedMapFeatureRevision {
  structuralRevision: string;
  visualRevision: string;
  contentRevision: string;
}

export function stableMapRevision(value: unknown): string {
  return JSON.stringify(value, (_key, next) => {
    if (next instanceof Map)
      return [...next.entries()].sort(([left], [right]) =>
        String(left).localeCompare(String(right)),
      );
    if (next instanceof Set) return [...next.values()].sort();
    return next;
  });
}

function pointImplementation(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
): "circle" | "icon" | "path" {
  const isPoint =
    (feature.geometryType === "point" && feature.lat !== null && feature.lon !== null) ||
    feature.geometry?.type === "Point";
  if (!isPoint) return "path";
  const shape = featureStyle(feature, renderer).shape;
  return shape === "square" || shape === "diamond" || shape === "triangle"
    ? "icon"
    : "circle";
}

export function resolveMapFeatureRevision(
  feature: ResolvedMapFeature,
  layer: Pick<
    ResolvedMapLayer,
    "renderer" | "popup" | "tooltip" | "labels" | "opacity"
  >,
  options: {
    pane?: string;
    clusterParent?: boolean;
    selected?: boolean;
    effectiveOpacity?: number;
    visualStyle?: LeafletFeatureStyle;
  } = {},
): ResolvedMapFeatureRevision {
  return {
    structuralRevision: stableMapRevision({
      geometryType: feature.geometryType,
      geometry: feature.geometry,
      lat: feature.lat,
      lon: feature.lon,
      implementation: pointImplementation(feature, layer.renderer),
      pane: options.pane,
      clusterParent: options.clusterParent ?? false,
    }),
    visualRevision: stableMapRevision({
      style: options.visualStyle ?? featureStyle(feature, layer.renderer),
      selected: options.selected ?? feature.selected,
      opacity: options.effectiveOpacity ?? layer.opacity,
    }),
    contentRevision: stableMapRevision({
      popup: layer.popup,
      tooltip: layer.tooltip,
      labels: layer.labels,
      labelValue: feature.labelValue,
      serviceAttributes: feature.serviceAttributes,
      powerBiAttributes: feature.powerBiAttributes,
      joinedAttributes: feature.joinedAttributes,
    }),
  };
}

export function resolvedLayerStructuralRevision(
  layers: readonly ResolvedMapLayer[],
  legacyCluster: boolean,
): string {
  return stableMapRevision({
    legacyCluster,
    layers: layers.map((layer) => ({
      id: layer.id,
      sourceType: layer.sourceType,
      tile: layer.tile,
      dynamic: layer.dynamic,
      cluster:
        layer.renderer.type === "cluster"
          ? {
              radius: layer.renderer.clusterRadius,
              disableAtZoom: layer.renderer.disableAtZoom,
              showCoverageOnHover: layer.renderer.showCoverageOnHover,
            }
          : undefined,
      features: layer.features.map((feature) => ({
        key: feature.featureKey ?? feature.id,
        revision: resolveMapFeatureRevision(feature, layer, {
          clusterParent: layer.renderer.type === "cluster" || legacyCluster,
        }).structuralRevision,
      })),
    })),
  });
}
