import { NormalizedData, NormalizedField } from "../data/normalizeData";
import { buildFieldDataProfile, defaultAggregationFor, FieldDataProfile, FieldPrivacyMode, FieldSemanticRole, inferSemanticRole } from "./fieldSemanticProfile";

export interface FieldAliasEntry {
    alias: string; key: string; displayName: string; queryName?: string; sourceTable?: string; sourceColumn?: string; qualifiedName?: string;
    type: NormalizedField["type"]; kind: "column" | "measure" | "unknown"; format?: string; roles: string[]; semanticRole: FieldSemanticRole;
    dataType?: NormalizedField["dataType"]; queryAggregation?: NormalizedField["queryAggregation"]; isImplicitAggregation?: boolean; origin?: NormalizedField["origin"];
    defaultAggregation: "sum" | "avg" | "min" | "max" | "count" | "distinctCount" | "first"; supportsIdentitySelection: boolean; supportsExternalFilter: boolean; profile?: FieldDataProfile;
}
export interface FieldAliasRegistry { entries: FieldAliasEntry[]; byAlias: Map<string, FieldAliasEntry>; byKey: Map<string, FieldAliasEntry>; errors: string[]; }

const identifier = (value: string): string => {
    const words = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
    const result = words.map((word,index)=>index ? word[0].toUpperCase()+word.slice(1) : word[0].toLowerCase()+word.slice(1)).join("").replace(/^[^A-Za-z]+/, "");
    return result || "field";
};
const stableSuffix = (value: string): string => { let hash = 2166136261; for (let i=0;i<value.length;i+=1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash,16777619); } return (hash>>>0).toString(36).slice(0,6); };
const validAlias = /^[A-Za-z][A-Za-z0-9]*$/;

export function createFieldAliasRegistry(data: NormalizedData, overrides: Record<string,string> = {}, privacyMode: FieldPrivacyMode = "fields"): FieldAliasRegistry {
    const fields = Object.values(data.fields);
    const preferred = new Map(fields.map(field=>[field.key, identifier(field.sourceColumn || field.displayName || field.key)]));
    const counts = (values: string[]) => values.reduce((map,value)=>map.set(value,(map.get(value)??0)+1),new Map<string,number>());
    const firstCounts = counts(Array.from(preferred.values()));
    const qualified = new Map(fields.map(field=>{const base=preferred.get(field.key) as string;return [field.key,firstCounts.get(base)!>1?identifier(`${field.sourceTable || "field"} ${field.sourceColumn || field.displayName}`):base];}));
    const qualifiedCounts = counts(Array.from(qualified.values()));
    const errors: string[] = [];
    const entries = fields.map(field=>{
        const generated = qualifiedCounts.get(qualified.get(field.key) as string)!>1 ? `${qualified.get(field.key)}${stableSuffix(field.queryName || field.qualifiedName || field.key)}` : qualified.get(field.key) as string;
        const override = overrides[field.key];
        if (override && !validAlias.test(override)) errors.push(`Alias override for ${field.key} must match ${validAlias}.`);
        const alias = override && validAlias.test(override) ? override : generated;
        const semanticRole = inferSemanticRole(field); const kind = field.kind ?? (field.type === "measure" ? "measure" : field.type === "schema" ? "unknown" : "column");
        return { alias, key:field.key, displayName:field.displayName, queryName:field.queryName, sourceTable:field.sourceTable, sourceColumn:field.sourceColumn, qualifiedName:field.qualifiedName, type:field.type, kind, dataType:field.dataType, queryAggregation:field.queryAggregation, isImplicitAggregation:field.isImplicitAggregation, origin:field.origin, format:field.format, roles:field.roles, semanticRole, defaultAggregation:defaultAggregationFor(field,semanticRole), supportsIdentitySelection:kind === "column" && field.type !== "schema", supportsExternalFilter:kind === "column" && Boolean(field.sourceTable && field.sourceColumn), profile:buildFieldDataProfile(field,data.rows,privacyMode) } satisfies FieldAliasEntry;
    }).sort((a,b)=>a.alias.localeCompare(b.alias));
    const aliases = counts(entries.map(entry=>entry.alias));
    entries.filter(entry=>aliases.get(entry.alias)!>1).forEach(entry=>errors.push(`Alias “${entry.alias}” is not unique (field ${entry.key}).`));
    return { entries, byAlias:new Map(entries.map(entry=>[entry.alias,entry])), byKey:new Map(entries.map(entry=>[entry.key,entry])), errors };
}

export { validAlias as fieldAliasPattern };
