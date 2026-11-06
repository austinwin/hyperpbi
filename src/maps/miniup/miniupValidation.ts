import type { Diagnostic } from "../../schema/diagnostics";

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function validateMiniUpMetadata(component: Record<string, unknown>, path: string, componentId?: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const error = (at: string, message: string) => diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: at, componentId, message });
    if (component.imports !== undefined) {
        if (!Array.isArray(component.imports) || component.imports.length > 256) error(`${path}/imports`, "imports must be an array of at most 256 MiniUp references.");
        else {
            const ids = new Set<string>();
            component.imports.forEach((item: unknown, index: number) => {
                const at = `${path}/imports/${index}`;
                if (!record(item) || typeof item.id !== "string" || ids.has(item.id) || typeof item.mapId !== "string" || typeof item.name !== "string" || typeof item.version !== "string" || !["snapshot", "linked"].includes(String(item.mode)) || !record(item.baseline) || !Array.isArray(item.baseline.layers)) { error(at, "MiniUp references require unique id, mapId, name, version, mode and a baseline with layers."); return; }
                ids.add(item.id);
                if (item.mode === "linked" && typeof item.manifestUrl !== "string") error(`${at}/manifestUrl`, "Linked MiniUp references require a public manifest URL.");
                for (const key of ["manifestUrl", "sourceUrl"]) if (item[key] !== undefined && !publicUrl(item[key])) error(`${at}/${key}`, "MiniUp references must use public credential-free HTTPS URLs.");
            });
        }
    }
    if (Array.isArray(component.layers)) component.layers.forEach((layer: unknown, index: number) => {
        if (!record(layer) || layer.provenance === undefined) return;
        const origin = layer.provenance;
        if (!record(origin) || origin.provider !== "miniup" || ["importId", "mapId", "mapName", "mapVersion", "layerId"].some(key => typeof origin[key] !== "string")) error(`${path}/layers/${index}/provenance`, "MiniUp provenance requires provider, importId, mapId, mapName, mapVersion and original layerId.");
        else if (origin.sourceUrl !== undefined && !publicUrl(origin.sourceUrl)) error(`${path}/layers/${index}/provenance/sourceUrl`, "Layer origin must be a public credential-free HTTPS URL.");
    });
    return diagnostics;
}
function publicUrl(value: unknown): boolean {
    if (typeof value !== "string") return false;
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !Array.from(url.searchParams.keys()).some(key => /token|key|secret|password|signature|credential|auth/i.test(key)); } catch { return false; }
}
