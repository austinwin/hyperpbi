import type { ResolvedMapLayer } from "../../../maps/model/resolvedMapTypes";

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableSerialize(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function arcGisTileDefinitionSignature(
  layer: ResolvedMapLayer,
  pane: string | undefined,
): string {
  return stableSerialize({
    sourceType: layer.sourceType,
    url: layer.tile?.url,
    attribution: layer.tile?.attribution ?? "",
    minZoom: layer.tile?.minZoom,
    maxZoom: layer.tile?.maxZoom ?? 19,
    subdomains: layer.tile?.subdomains,
    pane,
  });
}

export function arcGisDynamicDefinitionSignature(
  layer: ResolvedMapLayer,
  pane: string | undefined,
): string {
  return stableSerialize({
    sourceType: layer.sourceType,
    url: layer.dynamic?.url,
    layerIds: layer.dynamic?.layerIds ?? [],
    layerDefinitions: layer.dynamic?.layerDefinitions ?? {},
    format: layer.dynamic?.format ?? "png",
    transparent: layer.dynamic?.transparent ?? true,
    minZoom: layer.dynamic?.minZoom,
    maxZoom: layer.dynamic?.maxZoom,
    attribution: layer.dynamic?.attribution ?? "",
    debounceMs: layer.dynamic?.debounceMs ?? 300,
    pane,
  });
}
