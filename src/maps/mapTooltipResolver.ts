import { NormalizedField, NormalizedMapData, NormalizedMapFeature } from "../data/normalizeData";

export interface MapTooltipItem { label: string; value: string; }

export function resolveMapTooltip(feature: NormalizedMapFeature, map: NormalizedMapData, fields: Record<string, NormalizedField>): MapTooltipItem[] {
    if (!map.bindings.tooltip.length) return [{ label: "Feature", value: feature.id }];
    return map.bindings.tooltip.map(key => ({ label: fields[key]?.displayName ?? key, value: String(feature.row[key] ?? "—") }));
}

export function createTooltipNode(items: MapTooltipItem[]): HTMLElement {
    const node = document.createElement("div"); node.className = "hp-map-tooltip";
    for (const item of items) { const line = document.createElement("div"); const label = document.createElement("strong"); label.textContent = `${item.label}: `; line.append(label, document.createTextNode(item.value)); node.appendChild(line); }
    return node;
}
