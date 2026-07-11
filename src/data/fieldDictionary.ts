import powerbi from "powerbi-visuals-api";
import { NormalizedField } from "./normalizeData";

export function slugFieldIdentifier(value: string): string {
    const clean = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
    return clean || "field";
}

export interface ParsedQueryName {
    sourceTable?: string;
    sourceColumn?: string;
    qualifiedName?: string;
}

function cleanIdentifier(value: string): string {
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed.slice(1, -1).trim();
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'").trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1).replace(/""/g, '"').trim();
    return trimmed;
}

function splitQualifiedName(value: string): string[] {
    const parts: string[] = []; let current = ""; let quote = ""; let bracketDepth = 0;
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (quote) {
            current += character;
            if (character === quote) {
                if (value[index + 1] === quote) { current += value[index + 1]; index += 1; }
                else quote = "";
            }
            continue;
        }
        if (character === "'" || character === '"') { quote = character; current += character; continue; }
        if (character === "[") bracketDepth += 1;
        if (character === "]") bracketDepth = Math.max(0, bracketDepth - 1);
        if (character === "." && bracketDepth === 0) { if (current.trim()) parts.push(current.trim()); current = ""; continue; }
        current += character;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
}

/** Parses common Power BI query names without evaluating or guessing executable syntax. */
export function parseQueryName(queryName?: string): ParsedQueryName {
    const value = queryName?.trim(); if (!value) return {};
    const bracket = value.match(/^(.+?)(?:\s*\.\s*)?\[\s*([^\]]+)\s*\](.*)$/);
    if (bracket) {
        const sourceTable = cleanIdentifier(bracket[1]);
        const suffix = bracket[3].replace(/^\s*\.\s*/, "").trim();
        const sourceColumn = [cleanIdentifier(bracket[2]), suffix].filter(Boolean).join(".");
        if (sourceTable && sourceColumn) return { sourceTable, sourceColumn, qualifiedName: `${sourceTable}.${sourceColumn}` };
    }
    const parts = splitQualifiedName(value).map(cleanIdentifier).filter(Boolean);
    if (parts.length >= 2) {
        const sourceTable = parts[0]; const sourceColumn = parts.slice(1).join(".");
        return { sourceTable, sourceColumn, qualifiedName: `${sourceTable}.${sourceColumn}` };
    }
    return {};
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
        const parsed = parseQueryName(source.queryName);
        const base = parsed.sourceTable && parsed.sourceColumn
            ? `${slugFieldIdentifier(parsed.sourceTable)}_${slugFieldIdentifier(parsed.sourceColumn)}`
            : slugFieldIdentifier(source.queryName || source.displayName || "field");
        const occurrence = (counts.get(base) ?? 0) + 1;
        counts.set(base, occurrence);
        const key = occurrence === 1 ? base : `${base}_${occurrence}`;
        keys.push(key);
        const normalizedType=fieldType(source);
        fields[key] = {
            key,
            displayName: source.displayName || key,
            queryName: source.queryName,
            sourceTable: parsed.sourceTable,
            sourceColumn: parsed.sourceColumn,
            qualifiedName: parsed.qualifiedName,
            type: normalizedType,
            format: source.format,
            roles: Object.keys(source.roles ?? {}).filter(role => source.roles?.[role]),
            kind: source.isMeasure || normalizedType === "measure" ? "measure" : normalizedType === "schema" ? "unknown" : "column",
            dataType: source.type?.dateTime ? "datetime" : source.type?.numeric ? "number" : source.type?.bool ? "boolean" : source.type?.text ? "text" : "unknown"
        };
    }
    return { fields, keys };
}
