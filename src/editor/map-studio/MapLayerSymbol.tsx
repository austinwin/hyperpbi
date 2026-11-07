import type { MapLayerDefinition, MapGeometryType } from "../../schema/mapSchema";

export function MapLayerSymbol({ layer, geometryTypes = [] }: { layer: MapLayerDefinition; geometryTypes?: MapGeometryType[] }) {
  const renderer = layer.renderer;
  const symbol = renderer && "symbol" in renderer ? renderer.symbol : undefined;
  const type = renderer?.type;
  const shape = symbol?.shape ?? (type === "line" || geometryTypes.includes("polyline") ? "line" : type === "polygon" || geometryTypes.includes("polygon") ? "fill" : "circle");
  const color = symbol?.fillColor ?? symbol?.color ?? (renderer && "color" in renderer ? renderer.color : undefined) ?? "#2563eb";
  const outline = symbol?.outlineColor ?? color;
  const raster = ["xyz", "arcgisTile", "arcgisDynamic"].includes(layer.source.type);
  return <svg class="hp-map-layer-symbol" viewBox="0 0 24 24" aria-hidden="true">
    {raster ? <><rect x="4" y="4" width="16" height="16" rx="2" fill="#94a3b8" opacity=".2"/><path d="M4 16l5-5 4 4 4-7 3 8" fill="none" stroke="#64748b" stroke-width="1.5"/></> :
      shape === "line" ? <path d="M3 17l6-9 6 7 6-9" fill="none" stroke={color} stroke-width="2.5"/> :
      shape === "fill" ? <path d="M4 6l12-2 5 12-10 5-8-7z" fill={color} fill-opacity={symbol?.fillOpacity ?? .35} stroke={outline} stroke-width="1.5"/> :
      <circle cx="12" cy="12" r="6" fill={color} stroke={outline} fill-opacity={symbol?.fillOpacity ?? .8} stroke-width="1.5"/>}
  </svg>;
}
