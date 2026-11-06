import type { MapComponent } from "../../schema/hyperpbiSchema";
import type { MapLayerDefinition, MapGeometryType } from "../../schema/mapSchema";

export interface MiniUpField { name: string; type: "string" | "number" | "boolean" | "date"; alias?: string; }
export interface MiniUpManifestLayer extends MapLayerDefinition { fields?: MiniUpField[]; geometryType?: MapGeometryType; }
/** A portable export contract, not an assumed MiniUp production API. */
export interface MiniUpMapManifest {
    format: "hyperpbi.map";
    schemaVersion: "1.0";
    id: string;
    name: string;
    version: string;
    sourceUrl?: string;
    view?: MapComponent["view"];
    extent?: [number, number, number, number]; // west, south, east, north
    basemap?: MapComponent["basemap"];
    layers: MiniUpManifestLayer[];
    layerGroups?: MapComponent["layerGroups"];
    bookmarks?: MapComponent["bookmarks"];
    legend?: MapComponent["legend"];
    refresh?: { updatedAt?: string; intervalMinutes?: number };
    interactions?: { selection?: boolean; rectangle?: boolean; lasso?: boolean };
}
export interface MapLayerProvenance {
    provider: "miniup";
    importId: string;
    mapId: string;
    mapName: string;
    mapVersion: string;
    layerId: string;
    sourceUrl?: string;
    geometryType?: MapGeometryType;
    fields?: MiniUpField[];
}
export interface MiniUpMapImport {
    id: string;
    mapId: string;
    name: string;
    version: string;
    mode: "snapshot" | "linked";
    manifestUrl?: string;
    sourceUrl?: string;
    importedAt: string;
    refresh?: MiniUpMapManifest["refresh"];
    /** Last imported configuration enables a three-way merge of local edits. */
    baseline: Pick<MapComponent, "layers" | "layerGroups" | "view" | "basemap" | "bookmarks" | "legend">;
}
export interface PublishedMiniUpMap { name: string; manifestUrl: string; sourceUrl?: string; }
