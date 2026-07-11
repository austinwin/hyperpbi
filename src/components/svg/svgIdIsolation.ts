import type { SvgElementDefinition } from "./svgTypes";

export const safeSvgIdentifier = (value: string): string => {
    const safe = value.normalize("NFKD").replace(/[^A-Za-z0-9_.:-]+/g, "-").replace(/^-+|-+$/g, "");
    return /^[A-Za-z_]/.test(safe) ? safe.slice(0, 128) : `id-${safe || "svg"}`;
};
export const createSvgNamespace = (instanceId: string, componentId: string, repeatKey?: string | number): string => ["hp", instanceId, componentId, repeatKey === undefined ? undefined : `r-${repeatKey}`].filter(value => value !== undefined).map(value => safeSvgIdentifier(String(value))).join("-");

export function collectSvgLocalIds(elements: SvgElementDefinition[]): string[] {
    const ids: string[] = [];
    const visit = (items: SvgElementDefinition[]) => items.forEach(item => { if (item.id) ids.push(item.id); if (item.children) visit(item.children); if (item.repeat?.children) visit(item.repeat.children); });
    visit(elements); return ids;
}
export function createSvgIdMap(elements: SvgElementDefinition[], namespace: string): Map<string, string> {
    const map = new Map<string, string>();
    for (const id of collectSvgLocalIds(elements)) { if (map.has(id)) throw new Error(`Duplicate local SVG ID “${id}”.`); map.set(id, `${namespace}-${safeSvgIdentifier(id)}`); }
    return map;
}
export function rewriteSvgLocalReference(value: string, ids: Map<string, string>): string {
    const trimmed = value.trim();
    const urlMatch = /^url\(#([A-Za-z_][\w:.-]*)\)$/.exec(trimmed);
    const fragmentMatch = /^#([A-Za-z_][\w:.-]*)$/.exec(trimmed);
    const local = urlMatch?.[1] ?? fragmentMatch?.[1];
    if (!local) { if (/url\s*\(|^(?:https?:|data:|blob:|javascript:|\/\/)/i.test(trimmed)) throw new Error("External SVG references are not allowed."); return value; }
    const resolved = ids.get(local); if (!resolved) throw new Error(`Unknown local SVG reference “#${local}”.`);
    return urlMatch ? `url(#${resolved})` : `#${resolved}`;
}
export function rewriteSvgCssReferences(css: string, ids: Map<string, string>): string {
    return css.replace(/url\(\s*#([A-Za-z_][\w:.-]*)\s*\)/g, (_match, id: string) => `url(#${ids.get(id) ?? `__hp_unknown_${safeSvgIdentifier(id)}`})`);
}
