import powerbi from "powerbi-visuals-api";
import { NormalizedField } from "./normalizeData";

function slug(value: string): string {
    const clean = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
    return clean || "field";
}

export function fieldType(source: powerbi.DataViewMetadataColumn): NormalizedField["type"] {
    const roles = source.roles ?? {};
    if (roles.mapLatitude) return "latitude";
    if (roles.mapLongitude) return "longitude";
    if (roles.mapGeometry) return "geometry";
    if (roles.schema) return "schema";
    if (roles.date || source.type?.dateTime) return "date";
    if (roles.measure || roles.mapSize || source.isMeasure) return "measure";
    return "dimension";
}

export function buildFieldDictionary(columns: powerbi.DataViewMetadataColumn[]): { fields: Record<string, NormalizedField>; keys: string[] } {
    const fields: Record<string, NormalizedField> = {};
    const keys: string[] = [];
    const counts = new Map<string, number>();
    for (const source of columns) {
        const base = slug(source.displayName || source.queryName || "field");
        const occurrence = (counts.get(base) ?? 0) + 1;
        counts.set(base, occurrence);
        const key = occurrence === 1 ? base : `${base}_${occurrence}`;
        keys.push(key);
        fields[key] = {
            key,
            displayName: source.displayName || key,
            queryName: source.queryName,
            type: fieldType(source),
            format: source.format,
            roles: Object.keys(source.roles ?? {}).filter(role => source.roles?.[role])
        };
    }
    return { fields, keys };
}
