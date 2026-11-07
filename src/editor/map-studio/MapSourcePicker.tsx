import { Icon } from "../../components/icons/Icon";
import type { IconName } from "../../schema/uiSchema";
import type { MapLayerSourceType } from "../../schema/mapSchema";

const sources: { type: MapLayerSourceType; label: string; hint: string; icon: IconName; wms?: boolean }[] = [
  { type: "powerbi", label: "Power BI data", hint: "Map report coordinates or geometry", icon: "table" },
  { type: "geoJson", label: "GeoJSON URL or inline data", hint: "Features from a URL or pasted GeoJSON", icon: "external" },
  { type: "arcgisFeature", label: "ArcGIS FeatureServer", hint: "Style, select and join service features", icon: "layers" },
  { type: "arcgisDynamic", label: "ArcGIS map service", hint: "Server images with click identify", icon: "map" },
  { type: "arcgisTile", label: "ArcGIS tile service", hint: "Cached map tiles", icon: "grid" },
  { type: "xyz", label: "XYZ tiles", hint: "A tile URL with {z}, {x} and {y}", icon: "grid" },
  { type: "xyz", wms: true, label: "WMS raster service", hint: "OGC map images and sublayers", icon: "image" },
];
export function MapSourcePicker({ onAdd, onImport, onGroup }: { onAdd: (type: MapLayerSourceType, wms?: boolean) => void; onImport: () => void; onGroup: () => void }) {
  return <div class="hp-map-source-choices"><p>Choose where your map data comes from.</p>{sources.map(source => <button key={source.label} type="button" onClick={() => onAdd(source.type, source.wms)}><Icon name={source.icon} size="sm" decorative /><span><strong>{source.label}</strong><small>{source.hint}</small></span><Icon name="chevron-right" size="xs" decorative /></button>)}
    <button type="button" onClick={onImport}><Icon name="download" size="sm" decorative /><span><strong>Import published map definition</strong><small>Reuse a portable map and its sources</small></span><Icon name="chevron-right" size="xs" decorative /></button>
    <button type="button" onClick={onGroup}><Icon name="folder" size="sm" decorative /><span><strong>New layer group</strong><small>Organize layers with shared visibility</small></span></button>
    <details><summary>Connection help</summary><p>External sources must allow CORS and be permitted by Power BI WebAccess and the configured provider policy. Use a public HTTPS endpoint. ArcGIS feature URLs should end in FeatureServer/0 (or another layer ID).</p></details>
  </div>;
}
