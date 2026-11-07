export type MapStudioCommand = "search" | "selection" | "fit" | "bookmarks" | "legend" | "clear" | "close" | `fitLayer:${string}`;
import type { MapGeometryType } from "../../schema/mapSchema";
import type { MapToolbarPopover } from "../../render/stateStore";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../model/resolvedMapTypes";
export interface MapLayerStatus { loading: boolean; error?: string; warnings: string[]; featureCount: number; geometryTypes?: MapGeometryType[]; canFit?: boolean; }
export type MapLayerStatuses = Record<string, MapLayerStatus>;
export interface MapCommandChannel {
    send(mapId: string, command: MapStudioCommand): void;
    subscribe(listener: (mapId: string, command: MapStudioCommand) => void): () => void;
    publishStatus(mapId: string, status: MapLayerStatuses): void;
    subscribeStatus(listener: (mapId: string, status: MapLayerStatuses) => void): () => void;
    publishFeature(mapId: string, feature: ResolvedMapFeature | undefined): void;
    subscribeFeature(listener: (mapId: string, feature: ResolvedMapFeature | undefined) => void): () => void;
    publishLayers(mapId: string, layers: readonly ResolvedMapLayer[]): void;
    requestLayer(mapId: string, layerId: string): void;
    subscribeLayer(listener: (mapId: string, layer: ResolvedMapLayer | undefined) => void): () => void;
    publishTool(mapId: string, tool: MapToolbarPopover): void;
    subscribeTool(listener: (mapId: string, tool: MapToolbarPopover) => void): () => void;
}
/** One channel per Studio instance, never a global window event or report bridge. */
export function createMapCommandChannel(): MapCommandChannel {
    const listeners = new Set<(mapId: string, command: MapStudioCommand) => void>();
    const statuses = new Map<string, MapLayerStatuses>();
    const statusListeners = new Set<(mapId: string, status: MapLayerStatuses) => void>();
    const features = new Map<string, ResolvedMapFeature | undefined>();
    const featureListeners = new Set<(mapId: string, feature: ResolvedMapFeature | undefined) => void>();
    // Share existing runtime references for the active editor; never fetch or resolve a second map.
    const layersByMap = new Map<string, readonly ResolvedMapLayer[]>(), requestedLayers = new Map<string, string>();
    const layerListeners = new Set<(mapId: string, layer: ResolvedMapLayer | undefined) => void>();
    const notifyLayer = (id: string) => layerListeners.forEach(listener => listener(id, layersByMap.get(id)?.find(layer => layer.id === requestedLayers.get(id))));
    const activeTools = new Map<string, MapToolbarPopover>();
    const toolListeners = new Set<(mapId: string, tool: MapToolbarPopover) => void>();
    return {
        send: (id, command) => listeners.forEach(listener => listener(id, command)),
        subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
        publishStatus: (id, status) => { if (JSON.stringify(statuses.get(id)) === JSON.stringify(status)) return; statuses.set(id, status); statusListeners.forEach(listener => listener(id, status)); },
        subscribeStatus: listener => { statusListeners.add(listener); statuses.forEach((status, id) => listener(id, status)); return () => { statusListeners.delete(listener); }; },
        publishFeature: (id, feature) => { if (features.has(id) && features.get(id) === feature) return; features.set(id, feature); featureListeners.forEach(listener => listener(id, feature)); },
        subscribeFeature: listener => { featureListeners.add(listener); features.forEach((feature, id) => listener(id, feature)); return () => { featureListeners.delete(listener); }; },
        publishLayers: (id, layers) => { layersByMap.set(id, layers); notifyLayer(id); },
        requestLayer: (id, layerId) => { requestedLayers.set(id, layerId); notifyLayer(id); },
        subscribeLayer: listener => { layerListeners.add(listener); requestedLayers.forEach((_, id) => listener(id, layersByMap.get(id)?.find(layer => layer.id === requestedLayers.get(id)))); return () => { layerListeners.delete(listener); }; },
        publishTool: (id, tool) => { if (activeTools.has(id) && activeTools.get(id) === tool) return; activeTools.set(id, tool); toolListeners.forEach(listener => listener(id, tool)); },
        subscribeTool: listener => { toolListeners.add(listener); activeTools.forEach((tool, id) => listener(id, tool)); return () => { toolListeners.delete(listener); }; },
    };
}
