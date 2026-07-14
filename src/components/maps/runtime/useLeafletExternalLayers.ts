import * as L from "leaflet";
import {
  buildArcGisTileUrl,
  createArcGisDynamicLayer,
  type ArcGisDynamicLeafletLayer,
} from "../../../maps/arcgis/arcGisDynamicLayer";
import { checkHostPolicy } from "../../../maps/arcgis/arcGisHostPolicy";
import type { ResolvedMapLayer } from "../../../maps/model/resolvedMapTypes";
import { externalServiceAccess } from "../../../providers/providerPolicy";
import type { ProviderAccessState } from "../../../providers/providerTypes";
import {
  arcGisDynamicDefinitionSignature,
  arcGisTileDefinitionSignature,
} from "./mapLayerSignatures";

export interface MountedTileLayer {
  signature: string;
  layer: L.TileLayer;
}

export interface MountedDynamicLayer {
  signature: string;
  generation: number;
  layer: ArcGisDynamicLeafletLayer;
}

export interface LeafletExternalLayerRuntime {
  tileLayers: Map<string, MountedTileLayer>;
  dynamicLayers: Map<string, MountedDynamicLayer>;
  generation: { current: number };
  warningSignatures: Set<string>;
}

export function synchronizeLeafletExternalLayer({
  map,
  layer,
  runtime,
  pane,
  visible,
  visibleAtZoom,
  opacity,
  providerAccess,
  webAccessAvailable,
  onRuntimeStateChange,
}: {
  map: L.Map;
  layer: ResolvedMapLayer;
  runtime: LeafletExternalLayerRuntime;
  pane?: string;
  visible: boolean;
  visibleAtZoom: boolean;
  opacity: number;
  providerAccess?: ProviderAccessState;
  webAccessAvailable: boolean;
  onRuntimeStateChange?: (update: {
    loading?: boolean;
    error?: string;
    warning?: string;
  }) => void;
}): boolean {
  if (layer.sourceType === "arcgisTile" && layer.tile) {
    const signature = arcGisTileDefinitionSignature(layer, pane);
    try {
      const access = externalServiceAccess(
        providerAccess,
        layer.tile.url,
        webAccessAvailable,
      );
      if (!access.allowed) {
        const mounted = runtime.tileLayers.get(layer.id);
        runtime.tileLayers.delete(layer.id);
        if (mounted) map.removeLayer(mounted.layer);
        throw new Error(access.reason ?? "ArcGIS tile service access is unavailable.");
      }
      const policy = checkHostPolicy(layer.tile.url);
      if (!policy.allowed) {
        const mounted = runtime.tileLayers.get(layer.id);
        runtime.tileLayers.delete(layer.id);
        if (mounted) map.removeLayer(mounted.layer);
        throw new Error(policy.reason ?? "Tile host is blocked.");
      }
      let mounted = runtime.tileLayers.get(layer.id);
      if (mounted && mounted.signature !== signature) {
        runtime.tileLayers.delete(layer.id);
        map.removeLayer(mounted.layer);
        mounted = undefined;
      }
      if (!mounted) {
        const tile = L.tileLayer(buildArcGisTileUrl(layer.tile.url), {
          maxZoom: layer.tile.maxZoom ?? 19,
          minZoom: layer.tile.minZoom,
          opacity,
          attribution: layer.tile.attribution ?? "",
          pane,
        });
        mounted = { signature, layer: tile };
        runtime.tileLayers.set(layer.id, mounted);
      } else mounted.layer.setOpacity(opacity);
      synchronizeVisibility(map, mounted.layer, visible && visibleAtZoom);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reportWarning(runtime.warningSignatures, `tile:${layer.id}`, `${signature}:${message}`, () =>
        onRuntimeStateChange?.({ warning: `Tile layer error: ${message}` }),
      );
    }
    return true;
  }

  if (layer.sourceType === "arcgisDynamic" && layer.dynamic) {
    const signature = arcGisDynamicDefinitionSignature(layer, pane);
    try {
      const access = externalServiceAccess(
        providerAccess,
        layer.dynamic.url,
        webAccessAvailable,
      );
      if (!access.allowed) {
        const mounted = runtime.dynamicLayers.get(layer.id);
        runtime.dynamicLayers.delete(layer.id);
        if (mounted) map.removeLayer(mounted.layer);
        throw new Error(access.reason ?? "ArcGIS dynamic service access is unavailable.");
      }
      const policy = checkHostPolicy(layer.dynamic.url);
      if (!policy.allowed) {
        const mounted = runtime.dynamicLayers.get(layer.id);
        runtime.dynamicLayers.delete(layer.id);
        if (mounted) map.removeLayer(mounted.layer);
        throw new Error(policy.reason ?? "Dynamic layer host is blocked.");
      }
      let mounted = runtime.dynamicLayers.get(layer.id);
      if (mounted && mounted.signature !== signature) {
        runtime.dynamicLayers.delete(layer.id);
        map.removeLayer(mounted.layer);
        mounted = undefined;
      }
      if (!mounted) {
        const generation = ++runtime.generation.current;
        const dynamic = createArcGisDynamicLayer(
          {
            url: layer.dynamic.url,
            layerIds: layer.dynamic.layerIds,
            layerDefinitions: layer.dynamic.layerDefinitions,
            format: layer.dynamic.format ?? "png",
            transparent: layer.dynamic.transparent ?? true,
            minZoom: layer.dynamic.minZoom,
            maxZoom: layer.dynamic.maxZoom,
            attribution: layer.dynamic.attribution ?? "",
            debounceMs: layer.dynamic.debounceMs ?? 300,
            opacity,
            pane,
          },
          (state) => {
            const current = runtime.dynamicLayers.get(layer.id);
            if (!current || current.generation !== generation) return;
            onRuntimeStateChange?.({
              loading: state.loading,
              ...(state.error ? { error: state.error, warning: state.error } : {}),
            });
          },
        );
        mounted = { signature, generation, layer: dynamic };
        runtime.dynamicLayers.set(layer.id, mounted);
      } else mounted.layer.setOpacity(opacity);
      synchronizeVisibility(map, mounted.layer, visible && visibleAtZoom);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reportWarning(runtime.warningSignatures, `dynamic:${layer.id}`, `${signature}:${message}`, () =>
        onRuntimeStateChange?.({
          error: message,
          warning: `Dynamic layer error: ${message}`,
        }),
      );
    }
    return true;
  }
  return false;
}

function synchronizeVisibility(map: L.Map, layer: L.Layer, visible: boolean): void {
  if (visible && !map.hasLayer(layer)) layer.addTo(map);
  else if (!visible && map.hasLayer(layer)) map.removeLayer(layer);
}

function reportWarning(
  signatures: Set<string>,
  layerKey: string,
  signature: string,
  report: () => void,
): void {
  const entry = `${layerKey}:${signature}`;
  if (signatures.has(entry)) return;
  for (const existing of [...signatures])
    if (existing.startsWith(`${layerKey}:`)) signatures.delete(existing);
  signatures.add(entry);
  report();
}
