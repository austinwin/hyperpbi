import { samplePreviewValue } from "../data/samplePreviewRows";
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

const serialized = (value: Primitive): string => value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString() : String(value);
const exposed = (value: Primitive): Primitive => samplePreviewValue(value instanceof Date ? serialized(value) : value);
const cache = new WeakMap<DataRow[], WeakMap<NormalizedField, Map<FieldPrivacyMode, FieldDataProfile>>>();

export function buildFieldDataProfile(field: NormalizedField, rows: DataRow[], privacyMode: FieldPrivacyMode): FieldDataProfile | undefined {
    if (privacyMode === "types" || privacyMode === "restricted" || privacyMode === "fields") return undefined;
    let byField = cache.get(rows);
    if (!byField) cache.set(rows, byField = new WeakMap());
    let byPrivacy = byField.get(field);
    if (!byPrivacy) byField.set(field, byPrivacy = new Map());
    const cached = byPrivacy.get(privacyMode);
    if (cached) return cached;

    const unique = new Set<string>();
    const samples: Primitive[] = [];
    const isDate = field.type === "date" || field.dataType === "date" || field.dataType === "datetime";
    let nullCount = 0, minimum = Infinity, maximum = -Infinity, dateMin = Infinity, dateMax = -Infinity;
    for (const row of rows) {
        const value = row[field.key];
        if (value == null) { nullCount++; continue; }
        const key = serialized(value);
        if (!unique.has(key)) {
            unique.add(key);
            if (samples.length < 12) samples.push(value);
        }
        if (typeof value === "number" && Number.isFinite(value)) {
            minimum = Math.min(minimum, value);
            maximum = Math.max(maximum, value);
        }
        if (isDate) {
            const time = value instanceof Date ? value.getTime() : Date.parse(String(value));
            if (Number.isFinite(time)) {
                dateMin = Math.min(dateMin, time);
                dateMax = Math.max(dateMax, time);
            }
        }
    }
    const profile: FieldDataProfile = { distinctCount: unique.size, nullCount };
    if (minimum !== Infinity) { profile.minimum = minimum; profile.maximum = maximum; }
    if (dateMin !== Infinity) {
        profile.dateMinimum = new Date(dateMin).toISOString();
        profile.dateMaximum = new Date(dateMax).toISOString();
    }
    if (privacyMode === "samples") profile.exampleValues = samples.slice(0, 3).map(exposed);
    if (privacyMode === "masked") profile.exampleValues = samples.slice(0, 3).map(value => typeof value === "number" ? value : "•••");
    if (unique.size <= 12 && (privacyMode === "samples" || privacyMode === "summary")) profile.distinctValues = samples.map(exposed);
    byPrivacy.set(privacyMode, profile);
    return profile;
}

export function defaultAggregationFor(field: NormalizedField, semanticRole = inferSemanticRole(field)): "sum" | "avg" | "min" | "max" | "count" | "distinctCount" | "first" {
    if (field.queryAggregation) return field.queryAggregation;
    if (["measure", "currency", "duration"].includes(semanticRole)) return "sum";
    if (semanticRole === "percentage") return "avg";
    if (semanticRole === "identifier") return "distinctCount";
    return field.kind === "measure" ? "sum" : "first";
}
