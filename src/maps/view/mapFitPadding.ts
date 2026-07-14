export const DEFAULT_MAP_FIT_PADDING = 0.08;
export const MAX_MAP_FIT_PADDING = 0.5;

/** Runtime safety boundary. Validation rejects bad authored values; runtime still clamps defensive input. */
export function normalizeFitPadding(value: unknown): number {
    if (value === undefined) return DEFAULT_MAP_FIT_PADDING;
    if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_MAP_FIT_PADDING;
    return Math.max(0, Math.min(MAX_MAP_FIT_PADDING, value));
}
export function validFitPadding(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_MAP_FIT_PADDING;
}
