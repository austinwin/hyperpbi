import { validateMapComponentSchema } from "../../schema/mapSchemaValidation";
import type { PublishedMapManifest, PublishedMapLayer } from "./mapImportTypes";

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const id = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z][\w-]{0,79}$/.test(value);
const sourceTypes = new Set(["geoJson", "arcgisFeature", "arcgisTile", "arcgisDynamic", "xyz"]);
export function publicMapUrl(value: string, base?: string): string {
    const url = new URL(value, base);
    let sensitiveQuery = false; url.searchParams.forEach((_value, key) => { if (/token|key|secret|password|signature|credential|auth/i.test(key)) sensitiveQuery = true; });
    if (url.protocol !== "https:" || url.username || url.password || sensitiveQuery) throw new Error("Use a public, credential-free HTTPS URL. Credentials and signed URLs cannot be saved in a dashboard.");
    return url.href;
}

export function parseMapManifest(input: unknown, manifestUrl?: string): { manifest: PublishedMapManifest; warnings: string[] } {
    if (!object(input) || input.format !== "hyperpbi.map" || input.schemaVersion !== "1.0") throw new Error("Expected a hyperpbi.map manifest with schemaVersion 1.0. Export a portable manifest from the published map; arbitrary website HTML is not imported.");
    if (!id(input.id) || typeof input.name !== "string" || !input.name.trim() || typeof input.version !== "string" || !input.version.trim()) throw new Error("Map manifest requires a stable id, name and version.");
    if (!Array.isArray(input.layers) || !input.layers.length || input.layers.length > 256) throw new Error("Map manifest must contain between 1 and 256 layers.");
    if (JSON.stringify(input).length > 12_000_000) throw new Error("Map manifest exceeds the 12 MB configuration limit. Publish large datasets as remote GeoJSON or FeatureServer layers.");
    const manifest = JSON.parse(JSON.stringify(input)) as PublishedMapManifest;
    const warnings: string[] = [];
    const scan = (value: unknown, path: string): void => {
        if (Array.isArray(value)) { value.forEach((item, index) => scan(item, `${path}/${index}`)); return; }
        if (!object(value)) return;
        for (const [key, item] of Object.entries(value)) {
            if (/^(script|scripts|javascript|credentials|headers|authorization|token|apiKey|password|__proto__|prototype|constructor)$/i.test(key) || /^on[a-z]+$/i.test(key) && typeof item === "string") throw new Error(`Executable code or credentials are not allowed at ${path}/${key}.`);
            if (/^(url|sourceUrl|manifestUrl)$/i.test(key) && typeof item === "string") value[key] = publicMapUrl(item, manifestUrl);
            else scan(item, `${path}/${key}`);
        }
    };
    scan(manifest, "");
    const seen = new Set<string>();
    manifest.layers = manifest.layers.flatMap((raw, index) => {
        if (!object(raw) || !id(raw.id) || seen.has(raw.id)) throw new Error(`Layer ${index + 1} requires a unique stable id.`);
        seen.add(raw.id);
        if (!object(raw.source) || !sourceTypes.has(String(raw.source.type))) { warnings.push(`Layer ${raw.name ?? raw.id}: source ${object(raw.source) ? raw.source.type : "unknown"} is unsupported. Export GeoJSON, FeatureServer or tiles to import it.`); return []; }
        const { fields, geometryType, ...layer } = raw;
        if (fields !== undefined && (!Array.isArray(fields) || fields.some(field => !object(field) || typeof field.name !== "string" || !["string", "number", "boolean", "date"].includes(String(field.type))))) throw new Error(`Layer ${raw.id}: fields must declare name and string, number, boolean or date type.`);
        if (geometryType !== undefined && !["point", "multipoint", "polyline", "polygon", "mixed", "unknown"].includes(String(geometryType))) throw new Error(`Layer ${raw.id}: unsupported geometryType.`);
        if (layer.source.type === "geoJson" && !layer.source.idField) warnings.push(`Layer ${raw.name}: stable feature.id values are required when idField is omitted; row-position fallback cannot survive reordered data.`);
        const diagnostics = validateMapComponentSchema({ type: "map", id: "manifest", layers: [layer] }, "/manifest", "manifest");
        const errors = diagnostics.filter(item => item.severity === "error");
        if (errors.length) throw new Error(`Layer ${raw.name}: ${errors.map(item => item.message).join(" ")}`);
        warnings.push(...diagnostics.filter(item => item.severity === "warning").map(item => `${raw.name}: ${item.message}`));
        return [{ ...layer, fields, geometryType } as PublishedMapLayer];
    });
    if (!manifest.layers.length) throw new Error("No supported layers remain. Export at least one GeoJSON, FeatureServer or tile layer.");
    if (manifest.extent && (!Array.isArray(manifest.extent) || manifest.extent.length !== 4 || manifest.extent.some(value => typeof value !== "number" || !Number.isFinite(value)) || manifest.extent[0] < -180 || manifest.extent[2] > 180 || manifest.extent[1] < -90 || manifest.extent[3] > 90 || manifest.extent[0] > manifest.extent[2] || manifest.extent[1] > manifest.extent[3])) throw new Error("extent must be [west, south, east, north] in WGS84.");
    const diagnostics = validateMapComponentSchema({ ...manifest, layers: manifest.layers.map(({ fields, geometryType, ...layer }) => layer) }, "/manifest", "manifest");
    const errors = diagnostics.filter(item => item.severity === "error");
    if (errors.length) throw new Error(errors.map(item => item.message).join(" "));
    const supported = new Set(["format", "schemaVersion", "id", "name", "version", "sourceUrl", "view", "extent", "basemap", "layers", "layerGroups", "bookmarks", "legend", "refresh", "interactions"]);
    Object.keys(input).filter(key => !supported.has(key)).forEach(key => warnings.push(`Unsupported manifest metadata “${key}” is not applied.`));
    return { manifest, warnings: [...new Set(warnings)] };
}
