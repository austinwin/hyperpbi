// ── Map Join Normalizer ──────────────────────────────────────────────
// Normalizes join keys for matching Power BI data to ArcGIS service features.

import type { MapJoinNormalization } from "../../schema/mapSchema";

export function normalizeJoinKey(value: unknown, normalizations: MapJoinNormalization[]): string | null {
    if (value === null || value === undefined) return null;

    let str = String(value).trim();

    if (str.length === 0) return null;

    for (const norm of normalizations) {
        switch (norm) {
            case "trim":
                str = str.trim();
                break;
            case "upper":
                str = str.toUpperCase();
                break;
            case "lower":
                str = str.toLowerCase();
                break;
            case "removeNonAlphanumeric":
                str = str.replace(/[^A-Za-z0-9]/g, "");
                break;
            case "numberString":
                // Convert to number and back to string to normalize "0012" vs "12"
                const num = Number(str);
                if (!isNaN(num)) {
                    str = String(num);
                }
                break;
        }
    }

    if (str.length === 0) return null;
    return str;
}

export function normalizeJoinKeyBatch(
    values: unknown[],
    normalizations: MapJoinNormalization[]
): Map<string, unknown[]> {
    const result = new Map<string, unknown[]>();

    for (const value of values) {
        const normalized = normalizeJoinKey(value, normalizations);
        if (normalized === null) continue;

        const existing = result.get(normalized) ?? [];
        existing.push(value);
        result.set(normalized, existing);
    }

    return result;
}
