// ── Map Feature Value Resolver ────────────────────────────────────────
// Unified module for resolving feature attribute values across
// Power BI, service, and joined sources.

import type { ResolvedMapFeature } from "./resolvedMapTypes";
import { featureAttribute, type MapAttributeSource } from "../attributes/mapFeatureAttributes";

export type FeatureFieldSource = MapAttributeSource;

/**
 * Resolve a single field value from exactly the declared namespace.
 * Returns undefined if the field is not present there; no cross-namespace fallback occurs.
 */
export function resolvedFeatureValue(
    feature: ResolvedMapFeature,
    field: string,
    source: FeatureFieldSource
): unknown {
    return featureAttribute(feature, field, source);
}

/**
 * Returns merged attributes with canonical precedence:
 *   serviceAttributes → powerBiAttributes → joinedAttributes (overlays)
 *
 * The result is a flat record where later overlays win for same-named fields.
 */
export function mergedFeatureAttributes(
    feature: ResolvedMapFeature
): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    // Base layer: service attributes
    for (const [key, value] of Object.entries(feature.serviceAttributes)) {
        merged[key] = value;
    }

    // Overlay: Power BI attributes
    for (const [key, value] of Object.entries(feature.powerBiAttributes)) {
        merged[key] = value;
    }

    // Top overlay: joined/computed attributes
    for (const [key, value] of Object.entries(feature.joinedAttributes)) {
        merged[key] = value;
    }

    return merged;
}

const INTERNAL_IDENTITY_PATTERN = /(?:^|[\[{,])\s*"?identityIndex"?\s*:/i;
const DISPLAY_ID_KEYS = /(^id$|_id$|id$|^name$|_name$|name$|^title$|^label$|^code$|_code$)/i;
const NON_DISPLAY_FIELDS = /^(latitude|longitude|lat|lon|lng|x|y|geometry|shape|__.*)$/i;

function displayablePrimitive(value: unknown): string | undefined {
    if (value instanceof Date) return value.toLocaleDateString();
    if (!["string", "number", "boolean"].includes(typeof value)) return undefined;
    const text = String(value).trim();
    if (!text || INTERNAL_IDENTITY_PATTERN.test(text)) return undefined;
    return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/**
 * Returns a human-readable attribute for default details/tooltip labels.
 * Runtime row keys and Power BI selection identities remain internal even when
 * no popup fields were authored.
 */
export function mapFeatureDisplayValue(feature: ResolvedMapFeature): string | undefined {
    const entries = Object.entries(mergedFeatureAttributes(feature)).filter(
        ([key]) => !NON_DISPLAY_FIELDS.test(key),
    );
    for (const [, value] of entries.filter(([key]) => DISPLAY_ID_KEYS.test(key))) {
        const display = displayablePrimitive(value);
        if (display) return display;
    }
    for (const [, value] of entries) {
        const display = displayablePrimitive(value);
        if (display) return display;
    }
    if (feature.serviceObjectId !== undefined) return String(feature.serviceObjectId);
    return undefined;
}

/**
 * Format a resolved value for display, respecting field metadata when available.
 */
export function formatFeatureValue(
    rawValue: unknown,
    format?: string,
    display?: "text" | "badge" | "number" | "date"
): string {
    if (rawValue === null || rawValue === undefined) return "—";

    if (Array.isArray(rawValue)) {
        return rawValue.map(value => formatFeatureValue(value)).join(", ");
    }

    if (rawValue instanceof Date) {
        return display === "date" || format === "date"
            ? rawValue.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
            : rawValue.toISOString();
    }

    if (typeof rawValue === "object") {
        try {
            return JSON.stringify(rawValue);
        } catch {
            return "—";
        }
    }

    const effectiveDisplay = display ?? (
        ["integer", "decimal2", "decimal4", "percent", "currency"].includes(format ?? "")
            ? "number"
            : format === "date" ? "date" : "text"
    );

    switch (effectiveDisplay) {
        case "number": {
            const num = Number(rawValue);
            if (isNaN(num)) return String(rawValue);
            if (format === "integer") return Math.round(num).toLocaleString();
            if (format === "decimal2") return num.toFixed(2);
            if (format === "decimal4") return num.toFixed(4);
            if (format === "percent") return `${(num * 100).toFixed(1)}%`;
            if (format === "currency") return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            return num.toLocaleString();
        }
        case "date": {
            const date = rawValue instanceof Date ? rawValue : new Date(String(rawValue));
            if (isNaN(date.getTime())) return String(rawValue);
            return date.toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric",
            });
        }
        case "badge":
        case "text":
        default:
            return String(rawValue);
    }
}

/**
 * Extract the numeric domain from features for a given field and source.
 * Returns [min, max] or null if no valid numeric values exist.
 */
export function featureNumericDomain(
    features: readonly ResolvedMapFeature[],
    field: string,
    source: FeatureFieldSource
): [number, number] | null {
    let min = Infinity;
    let max = -Infinity;
    let hasValues = false;

    for (const feature of features) {
        const raw = resolvedFeatureValue(feature, field, source);
        if (raw === null || raw === undefined) continue;
        const num = Number(raw);
        if (isNaN(num) || !isFinite(num)) continue;

        if (num < min) min = num;
        if (num > max) max = num;
        hasValues = true;
    }

    return hasValues ? [min, max] : null;
}

/**
 * Get distinct values for a field from a set of features.
 */
export function featureDistinctValues(
    features: readonly ResolvedMapFeature[],
    field: string,
    source: FeatureFieldSource
): unknown[] {
    const seen = new Set<string>();
    const values: unknown[] = [];

    for (const feature of features) {
        const raw = resolvedFeatureValue(feature, field, source);
        const key = String(raw ?? "__null__");
        if (!seen.has(key)) {
            seen.add(key);
            values.push(raw);
        }
    }

    return values;
}
