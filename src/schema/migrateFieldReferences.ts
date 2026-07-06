import { NormalizedField } from "../data/normalizeData";
import { slugFieldIdentifier } from "../data/fieldDictionary";

const fieldProperties = new Set(["field", "category", "measure", "x", "y", "size", "distinctBy", "sortBy", "valueFromRow", "splitField", "dateField", "titleField", "categoryField", "statusField", "descriptionField"]);
const templateProperties = new Set(["html", "template"]);

export function legacyFieldKeyMap(fields: Record<string, NormalizedField>): Map<string, string> {
    const result = new Map<string, string>(); const counts = new Map<string, number>();
    for (const field of Object.values(fields)) {
        const base = slugFieldIdentifier(field.displayName || field.queryName || "field"); const occurrence = (counts.get(base) ?? 0) + 1; counts.set(base, occurrence);
        const legacyKey = occurrence === 1 ? base : `${base}_${occurrence}`;
        if (legacyKey !== field.key) result.set(legacyKey, field.key);
    }
    return result;
}

function migrateTemplate(value: string, aliases: Map<string, string>): string {
    return value.replace(/{{\s*(row|selected|sum|avg|min|max|distinctCount|field)\.([A-Za-z0-9_]+)(?=\.|\s*}})/g, (_match, namespace: string, key: string) => `{{${namespace}.${aliases.get(key) ?? key}`);
}

/** Keeps saved pre-qualified dashboards usable when the source column order is unchanged. */
export function migrateFieldReferences<T>(value: T, fields: Record<string, NormalizedField>): T {
    const aliases = legacyFieldKeyMap(fields); if (!aliases.size || !value || typeof value !== "object") return value;
    const visit = (node: unknown): void => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) { node.forEach(visit); return; }
        for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
            if (fieldProperties.has(key) && typeof child === "string" && aliases.has(child)) (node as Record<string, unknown>)[key] = aliases.get(child);
            else if ((key === "columns" || key === "rows") && Array.isArray(child)) (node as Record<string, unknown>)[key] = child.map(column => typeof column === "string" ? aliases.get(column) ?? column : column);
            else if (templateProperties.has(key) && typeof child === "string") (node as Record<string, unknown>)[key] = migrateTemplate(child, aliases);
            visit((node as Record<string, unknown>)[key]);
        }
    };
    visit(value); return value;
}

