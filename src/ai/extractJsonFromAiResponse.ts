export interface ExtractedAiJson { value?: unknown; json?: string; config?: unknown; configJson?: string; repaired?: boolean; error?: string; }

function syntaxRepair(input: string): string {
    return input.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/\u00a0/g, " ").replace(/,\s*([}\]])/g, "$1");
}

function parseCandidate(candidate: string): { value: unknown; repaired: boolean } | undefined {
    try { return { value: JSON.parse(candidate) as unknown, repaired: false }; }
    catch {
        const repaired = syntaxRepair(candidate);
        try { return { value: JSON.parse(repaired) as unknown, repaired: repaired !== candidate }; } catch { return undefined; }
    }
}

function extractCandidates(input: string): string[] {
    const normalized = input.replace(/[\u201c\u201d]/g, '"');
    const candidates: string[] = []; let start = -1; let depth = 0; let quote = false; let escaped = false;
    for (let index = 0; index < normalized.length; index++) {
        const char = normalized[index];
        if (quote) { if (escaped) escaped = false; else if (char === "\\") escaped = true; else if (char === '"') quote = false; continue; }
        if (char === '"') { quote = true; continue; }
        if (char === "{") { if (depth === 0) start = index; depth++; }
        else if (char === "}" && depth > 0) { depth--; if (depth === 0 && start >= 0) candidates.push(normalized.slice(start, index + 1)); }
    }
    return candidates.sort((left, right) => right.length - left.length);
}

function parsePackagedValue(value: unknown): { specification: unknown; config?: unknown } | undefined {
    if (!value || typeof value !== "object" || Array.isArray(value) || !("specification" in value)) return { specification: value };
    const packageValue = value as { specification?: unknown; config?: unknown };
    let specification = packageValue.specification;
    if (typeof specification === "string") specification = parseCandidate(specification)?.value;
    if (specification === undefined) return undefined;
    let config = packageValue.config;
    if (typeof config === "string") config = parseCandidate(config)?.value;
    return { specification, config };
}

export function extractJsonFromAiResponse(input: string): ExtractedAiJson {
    if (!input.trim()) return { error: "The AI response is empty." };
    for (const candidate of extractCandidates(input)) {
        const parsed = parseCandidate(candidate); if (!parsed) continue;
        const packaged = parsePackagedValue(parsed.value); if (!packaged) continue;
        return { value: packaged.specification, json: JSON.stringify(packaged.specification, null, 2), config: packaged.config, configJson: packaged.config === undefined ? undefined : JSON.stringify(packaged.config, null, 2), repaired: parsed.repaired };
    }
    return { error: "A JSON-like object was detected, but it could not be parsed after safe quote and trailing-comma repair." };
}
