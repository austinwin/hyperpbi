export type MapStudioCommand = "search" | "selection" | "fit" | "bookmarks" | "legend" | "clear" | "close";
export interface MapLayerStatus { loading: boolean; error?: string; warnings: string[]; featureCount: number; }
export type MapLayerStatuses = Record<string, MapLayerStatus>;
export interface MapCommandChannel {
    send(mapId: string, command: MapStudioCommand): void;
    subscribe(listener: (mapId: string, command: MapStudioCommand) => void): () => void;
    publishStatus(mapId: string, status: MapLayerStatuses): void;
    subscribeStatus(listener: (mapId: string, status: MapLayerStatuses) => void): () => void;
}
/** One channel per Studio instance, never a global window event or report bridge. */
export function createMapCommandChannel(): MapCommandChannel {
    const listeners = new Set<(mapId: string, command: MapStudioCommand) => void>();
    const statuses = new Map<string, MapLayerStatuses>();
    const statusListeners = new Set<(mapId: string, status: MapLayerStatuses) => void>();
    return {
        send: (id, command) => listeners.forEach(listener => listener(id, command)),
        subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
        publishStatus: (id, status) => { if (JSON.stringify(statuses.get(id)) === JSON.stringify(status)) return; statuses.set(id, status); statusListeners.forEach(listener => listener(id, status)); },
        subscribeStatus: listener => { statusListeners.add(listener); statuses.forEach((status, id) => listener(id, status)); return () => { statusListeners.delete(listener); }; },
    };
}
