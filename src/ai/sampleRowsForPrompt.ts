import { DataRow, NormalizedData, Primitive } from "../data/normalizeData";
import { PromptPrivacyMode } from "./aiPromptSettings";

const masked = (value: Primitive): Primitive => value === null || value === undefined ? value : typeof value === "number" ? 0 : value instanceof Date ? "[DATE]" : typeof value === "boolean" ? value : "[MASKED]";
export function sampleRowsForPrompt(data: NormalizedData, mode: PromptPrivacyMode, count = 10, selected: string[] = []): unknown {
    const keys = selected.length ? selected : Object.keys(data.fields); const rows = data.rows.slice(0, Math.min(50, Math.max(0, count))).map(row => Object.fromEntries(keys.map(key => [key, mode === "masked" ? masked(row[key]) : row[key]])));
    if (mode === "samples" || mode === "masked") return rows;
    if (mode === "fields" || mode === "types") return [];
    return keys.map(key => { const values = data.rows.map(row => row[key]).filter(value => value !== null && value !== undefined); const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)); const dates = values.map(value => value instanceof Date ? value : new Date(String(value))).filter(value => !Number.isNaN(value.getTime())); if (numbers.length) return { field:key, type:"number", min:Math.min(...numbers), max:Math.max(...numbers), avg:numbers.reduce((a,b)=>a+b,0)/numbers.length }; if (data.fields[key]?.type === "date" && dates.length) return { field:key, type:"date", min:new Date(Math.min(...dates.map(value=>value.getTime()))).toISOString(), max:new Date(Math.max(...dates.map(value=>value.getTime()))).toISOString() }; return { field:key, type:"text", distinctValues:Array.from(new Set(values.map(String))).slice(0,20) }; });
}
