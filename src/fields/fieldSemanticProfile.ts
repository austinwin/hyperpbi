import { DataRow, NormalizedField, Primitive } from "../data/normalizeData";

export type FieldSemanticRole = "identifier" | "category" | "status" | "date" | "datetime" | "measure" | "currency" | "percentage" | "duration" | "latitude" | "longitude" | "geometry" | "url" | "label" | "unknown";
export type FieldPrivacyMode = "samples" | "masked" | "summary" | "fields" | "types" | "restricted";

export interface FieldDataProfile {
    distinctCount?: number;
    nullCount?: number;
    minimum?: number;
    maximum?: number;
    dateMinimum?: string;
    dateMaximum?: string;
    exampleValues?: Primitive[];
    distinctValues?: Primitive[];
}

const lowerMetadata = (field: NormalizedField): string => [field.displayName, field.sourceColumn, field.queryName, field.format, ...field.roles].filter(Boolean).join(" ").toLowerCase();

export function inferSemanticRole(field: NormalizedField): FieldSemanticRole {
    const metadata = lowerMetadata(field);
    if (field.type === "latitude") return "latitude";
    if (field.type === "longitude") return "longitude";
    if (field.type === "geometry") return "geometry";
    if (field.type === "date") return /time|timestamp|datetime/.test(metadata) ? "datetime" : "date";
    if (/https?:|\burl\b|website|hyperlink/.test(metadata)) return "url";
    if (/%|percent|percentage|ratio|rate/.test(metadata)) return "percentage";
    if (/currency|revenue|amount|cost|price|budget|\$|usd|eur|gbp/.test(metadata)) return "currency";
    if (/duration|elapsed|days? open|hours?|minutes?/.test(metadata)) return "duration";
    if (field.type === "measure" || field.kind === "measure") return "measure";
    if (/\b(status|state|stage|priority|severity)\b/.test(metadata)) return "status";
    if (/\b(id|identifier|number|code|key)\b/.test(metadata)) return "identifier";
    if (/\b(name|title|label|description)\b/.test(metadata)) return "label";
    if (field.type === "dimension") return "category";
    return "unknown";
}

const serialized = (value: Primitive): string => value instanceof Date ? value.toISOString() : String(value);
const exposed = (value: Primitive): Primitive => value instanceof Date ? value.toISOString() : value;

export function buildFieldDataProfile(field: NormalizedField, rows: DataRow[], privacyMode: FieldPrivacyMode): FieldDataProfile | undefined {
    if (privacyMode === "types" || privacyMode === "restricted" || privacyMode === "fields") return undefined;
    const values = rows.map(row => row[field.key]);
    const present = values.filter((value): value is Primitive => value !== null && value !== undefined);
    const unique = Array.from(new Map(present.map(value => [serialized(value), value])).values());
    const profile: FieldDataProfile = { distinctCount: unique.length, nullCount: values.length - present.length };
    const numeric = present.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (numeric.length) { profile.minimum = Math.min(...numeric); profile.maximum = Math.max(...numeric); }
    if (field.type === "date" || field.dataType === "date" || field.dataType === "datetime") {
        const dates = present.map(value => value instanceof Date ? value : new Date(String(value))).filter(value => !Number.isNaN(value.getTime())).sort((a,b)=>a.getTime()-b.getTime());
        if (dates.length) { profile.dateMinimum = dates[0].toISOString(); profile.dateMaximum = dates[dates.length - 1].toISOString(); }
    }
    if (privacyMode === "samples") profile.exampleValues = unique.slice(0, 3).map(exposed);
    if (privacyMode === "masked") profile.exampleValues = unique.slice(0, 3).map(value => typeof value === "number" ? value : "•••");
    if (unique.length <= 12 && ["samples", "summary"].includes(privacyMode)) profile.distinctValues = unique.slice(0, 12).map(exposed);
    return profile;
}

export function defaultAggregationFor(field: NormalizedField, semanticRole = inferSemanticRole(field)): "sum" | "avg" | "count" | "distinctCount" | "first" {
    if (["measure", "currency", "duration"].includes(semanticRole)) return "sum";
    if (semanticRole === "percentage") return "avg";
    if (semanticRole === "identifier") return "distinctCount";
    return field.kind === "measure" || field.type === "measure" ? "sum" : "first";
}
