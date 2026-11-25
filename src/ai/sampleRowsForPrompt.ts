import type { NormalizedData, Primitive } from "../data/normalizeData";
import { samplePreviewValue } from "../data/samplePreviewRows";
import type { PromptPrivacyMode } from "./aiPromptSettings";

const masked = (value: Primitive): Primitive => value == null ? value : typeof value === "number" ? 0 : value instanceof Date ? "[DATE]" : typeof value === "boolean" ? value : "[MASKED]";

export function sampleRowsForPrompt(data: NormalizedData, mode: PromptPrivacyMode, count = 10, selected: string[] = []): unknown {
    if (mode === "fields" || mode === "types") return [];
    const keys = selected.length ? selected : Object.keys(data.fields);
    if (mode === "samples" || mode === "masked") {
        const transform = mode === "masked" ? masked : samplePreviewValue;
        return data.rows.slice(0, Math.min(50, Math.max(0, count))).map(row => Object.fromEntries(keys.map(key => [key, transform(row[key])])));
    }
    return keys.map(field => {
        const dates = data.fields[field]?.type === "date";
        let min = Infinity, max = -Infinity, sum = 0, count = 0, dateMin = Infinity, dateMax = -Infinity;
        const examples = new Set<string>();
        for (const row of data.rows) {
            const value = row[field];
            if (value == null) continue;
            if (typeof value === "number" && Number.isFinite(value)) {
                min = Math.min(min, value);
                max = Math.max(max, value);
                sum += value;
                count++;
            }
            if (dates) {
                const time = value instanceof Date ? value.getTime() : Date.parse(String(value));
                if (Number.isFinite(time)) {
                    dateMin = Math.min(dateMin, time);
                    dateMax = Math.max(dateMax, time);
                }
            }
            if (examples.size < 20) examples.add(String(samplePreviewValue(value)));
        }
        if (count) return { field, type: "number", min, max, avg: sum / count };
        if (dateMin !== Infinity) return { field, type: "date", min: new Date(dateMin).toISOString(), max: new Date(dateMax).toISOString() };
        return { field, type: "text", distinctValues: Array.from(examples) };
    });
}
