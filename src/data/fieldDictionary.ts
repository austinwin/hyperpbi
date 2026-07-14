import powerbi from "powerbi-visuals-api";
import { NormalizedField } from "./normalizeData";
import { QueryAggregation } from "./fieldMetadata";

export function slugFieldIdentifier(value: string): string {
    const clean = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
    return clean || "field";
}

export interface ParsedQueryName {
    sourceTable?: string;
    sourceColumn?: string;
    qualifiedName?: string;
    wrapperName?: string;
    queryAggregation?: QueryAggregation;
    isImplicitAggregation?: boolean;
}

function cleanIdentifier(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("[")) {
        if (!trimmed.endsWith("]")) return undefined;
        const inner = trimmed.slice(1, -1).replace(/]]/g, "]").trim();
        return inner || undefined;
    }
    const quote = trimmed[0];
    if (quote === "'" || quote === '"') {
        if (trimmed[trimmed.length - 1] !== quote) return undefined;
        let result = "";
        for (let index = 1; index < trimmed.length - 1; index += 1) {
            const character = trimmed[index];
            if (character === "\\" && trimmed[index + 1] === quote) { result += quote; index += 1; continue; }
            if (character === quote) {
                if (trimmed[index + 1] === quote) { result += quote; index += 1; continue; }
                return undefined;
            }
            result += character;
        }
        return result.trim() || undefined;
    }
    if (/[\[\]()]/.test(trimmed) || /["']/.test(trimmed)) return undefined;
    return trimmed;
}

function scanStructure(value: string): { dots: number[]; brackets: Array<{ start: number; end: number }>; valid: boolean } {
    const dots: number[] = []; const brackets: Array<{ start: number; end: number }> = []; let quote = ""; let bracketStart = -1;
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (quote) {
            if (character === "\\" && value[index + 1] === quote) { index += 1; continue; }
            if (character === quote) {
                if (value[index + 1] === quote) index += 1;
                else quote = "";
            }
            continue;
        }
        if (character === "'" || character === '"') { if (bracketStart >= 0) return { dots, brackets, valid: false }; quote = character; continue; }
        if (character === "[") { if (bracketStart >= 0) return { dots, brackets, valid: false }; bracketStart = index; continue; }
        if (character === "]") { if (bracketStart < 0) return { dots, brackets, valid: false }; if (value[index + 1] === "]") { index += 1; continue; } brackets.push({ start: bracketStart, end: index }); bracketStart = -1; continue; }
        if (character === "." && bracketStart < 0) dots.push(index);
    }
    return { dots, brackets, valid: !quote && bracketStart < 0 };
}

const aggregationNames: Record<string, QueryAggregation> = {
    sum: "sum", average: "avg", avg: "avg", min: "min", max: "max",
    count: "count", distinctcount: "distinctCount", first: "first"
};

function outerCall(value: string): { name: string; inner: string; balanced: boolean } | undefined {
    let index = 0; while (/\s/.test(value[index] ?? "")) index += 1;
    const start = index; while (/[A-Za-z]/.test(value[index] ?? "")) index += 1;
    if (index === start) return undefined;
    const name = value.slice(start, index); while (/\s/.test(value[index] ?? "")) index += 1;
    if (value[index] !== "(") return undefined;
    const open = index; let depth = 0; let quote = ""; let bracketDepth = 0;
    for (; index < value.length; index += 1) {
        const character = value[index];
        if (quote) {
            if (character === "\\" && value[index + 1] === quote) { index += 1; continue; }
            if (character === quote) { if (value[index + 1] === quote) index += 1; else quote = ""; }
            continue;
        }
        if (character === "'" || character === '"') { quote = character; continue; }
        if (character === "[") { bracketDepth += 1; continue; }
        if (character === "]") { if (!bracketDepth) return { name, inner: "", balanced: false }; if (value[index + 1] === "]") index += 1; else bracketDepth -= 1; continue; }
        if (bracketDepth) continue;
        if (character === "(") depth += 1;
        if (character === ")") {
            depth -= 1;
            if (depth < 0) return { name, inner: "", balanced: false };
            if (depth === 0) return { name, inner: value.slice(open + 1, index), balanced: !quote && bracketDepth === 0 && value.slice(index + 1).trim() === "" };
        }
    }
    return { name, inner: "", balanced: false };
}

function parseQualifiedColumn(value: string): Pick<ParsedQueryName, "sourceTable" | "sourceColumn" | "qualifiedName"> {
    const trimmed = value.trim();
    if (!trimmed || /[()]/.test(trimmed)) return {};
    const structure = scanStructure(trimmed); if (!structure.valid) return {};
    let tableText = ""; let columnText = "";
    if (structure.brackets.length === 1 && structure.brackets[0].end === trimmed.length - 1) {
        const bracket = structure.brackets[0];
        const prefix = trimmed.slice(0, bracket.start).trim().replace(/\.\s*$/, "").trim();
        if (structure.dots.some(dot => dot < bracket.start) && !/^.+\.\s*$/.test(trimmed.slice(0, bracket.start))) return {};
        tableText = prefix; columnText = trimmed.slice(bracket.start, bracket.end + 1);
    } else if (structure.brackets.length === 0 && structure.dots.length === 1) {
        tableText = trimmed.slice(0, structure.dots[0]); columnText = trimmed.slice(structure.dots[0] + 1);
    } else return {};
    const bareColumn = columnText.trim();
    if (!/^[\["']/.test(bareColumn) && /\s/.test(bareColumn) && bareColumn.split(/\s+/).slice(1).some(part => /^[a-z]/.test(part))) return {};
    const sourceTable = cleanIdentifier(tableText); const sourceColumn = cleanIdentifier(columnText);
    if (!sourceTable || !sourceColumn) return {};
    return { sourceTable, sourceColumn, qualifiedName: `${sourceTable}.${sourceColumn}` };
}

/** Parses common Power BI query names without evaluating or guessing executable syntax. */
export function parseQueryName(queryName?: string): ParsedQueryName {
    const value = queryName?.trim(); if (!value) return {};
    const call = outerCall(value);
    if (call) {
        const queryAggregation = aggregationNames[call.name.toLowerCase()];
        if (!call.balanced || !queryAggregation) return {};
        const parsed = parseQualifiedColumn(call.inner); if (!parsed.qualifiedName) return {};
        return { ...parsed, wrapperName: call.name, queryAggregation, isImplicitAggregation: true };
    }
    if (/[()]/.test(value)) return {};
    return parseQualifiedColumn(value);
}

export function fieldType(source: powerbi.DataViewMetadataColumn, parsed: ParsedQueryName = parseQueryName(source.queryName)): NormalizedField["type"] {
    const roles = source.roles ?? {};
    if (roles.schema) return "schema";
    if (roles.date || source.type?.dateTime) return "date";
    if (source.type?.numeric) {
        const name = (parsed.sourceColumn || source.displayName || "").trim().toLowerCase();
        if (name === "latitude" || name === "lat") return "latitude";
        if (name === "longitude" || name === "lon" || name === "lng") return "longitude";
    }
    if (roles.measure || roles.mapSize || source.isMeasure) return "measure";
    return "dimension";
}

export function buildFieldDictionary(columns: powerbi.DataViewMetadataColumn[]): { fields: Record<string, NormalizedField>; keys: string[] } {
    const fields: Record<string, NormalizedField> = {};
    const keys: string[] = [];
    const used = new Set<string>();
    for (const source of columns) {
        const parsed = parseQueryName(source.queryName);
        const base = parsed.sourceTable && parsed.sourceColumn
            ? `${slugFieldIdentifier(parsed.sourceTable)}_${slugFieldIdentifier(parsed.sourceColumn)}`
            : slugFieldIdentifier(source.queryName || source.displayName || "field");
        let key = base;
        if (used.has(key) && parsed.queryAggregation) key = `${base}_${parsed.queryAggregation.toLowerCase()}`;
        const aggregationKey = key; let suffix = 2; while (used.has(key)) { key = `${aggregationKey}_${suffix}`; suffix += 1; }
        used.add(key);
        keys.push(key);
        const normalizedType=fieldType(source, parsed);
        const kind: NormalizedField["kind"] = source.isMeasure === true ? "measure" : normalizedType === "schema" ? "unknown" : "column";
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
            kind,
            dataType: source.type?.dateTime ? "datetime" : source.type?.numeric ? "number" : source.type?.bool ? "boolean" : source.type?.text ? "text" : "unknown",
            queryAggregation: source.isMeasure === true ? undefined : parsed.queryAggregation,
            isImplicitAggregation: source.isMeasure === true ? false : parsed.isImplicitAggregation,
            origin: source.isMeasure === true ? "powerbi-measure" : kind === "column" ? "powerbi-column" : undefined
        };
    }
    return { fields, keys };
}
