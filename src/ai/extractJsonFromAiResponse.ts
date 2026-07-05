export function extractJsonFromAiResponse(input: string): { value?: unknown; json?: string; error?: string } {
    const candidates: string[] = []; let start = -1; let depth = 0; let quote = false; let escaped = false;
    for (let index = 0; index < input.length; index++) { const char = input[index]; if (quote) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quote = false; continue; } if (char === '"') { quote = true; continue; } if (char === "{") { if (depth === 0) start = index; depth++; } else if (char === "}" && depth > 0) { depth--; if (depth === 0 && start >= 0) candidates.push(input.slice(start, index + 1)); } }
    const parsed = candidates.sort((a,b)=>b.length-a.length).map(json => { try { return { json, value: JSON.parse(json) as unknown }; } catch { return undefined; } }).find(Boolean);
    return parsed ?? { error: "No valid JSON object was found in the AI response." };
}
