const DEFAULT_MINIMUM = 5;

export function normalizePaneSizes(
    values: readonly number[] | undefined,
    count: number,
    minimums?: readonly number[],
    maximums?: readonly number[],
): number[] {
    if (count <= 0) return [];
    const usable = values?.length === count && values.every(value => Number.isFinite(value) && value > 0)
        ? values.map(Number)
        : Array.from({ length: count }, () => 1);
    const total = usable.reduce((sum, value) => sum + value, 0);
    const normalized = usable.map(value => value / total * 100);
    const implicitMinimum = minimums === undefined && count * DEFAULT_MINIMUM <= 100 ? DEFAULT_MINIMUM : 0;
    const lower = normalized.map((_value, index) => Math.max(0, minimums?.[index] ?? implicitMinimum));
    const upper = normalized.map((_value, index) => Math.max(lower[index], maximums?.[index] ?? 100));
    if (lower.reduce((sum, value) => sum + value, 0) > 100 || upper.reduce((sum, value) => sum + value, 0) < 100) return normalized;
    const constrained = normalized.map((value, index) => Math.max(lower[index], Math.min(upper[index], value)));
    for (let iteration = 0; iteration < count + 1; iteration++) {
        const delta = 100 - constrained.reduce((sum, value) => sum + value, 0);
        if (Math.abs(delta) < 0.000001) break;
        const candidates = constrained.map((_value, index) => index).filter(index => delta > 0 ? constrained[index] < upper[index] : constrained[index] > lower[index]);
        if (!candidates.length) break;
        const share = delta / candidates.length;
        for (const index of candidates) constrained[index] = Math.max(lower[index], Math.min(upper[index], constrained[index] + share));
    }
    return constrained;
}

export interface AdjacentPaneBounds { minimum: number; maximum: number; }
export function adjacentPaneBounds(
    sizes: readonly number[],
    handleIndex: number,
    minimums?: readonly number[],
    maximums?: readonly number[],
): AdjacentPaneBounds {
    if (handleIndex < 0 || handleIndex >= sizes.length - 1) return { minimum: 0, maximum: 0 };
    const combined = sizes[handleIndex] + sizes[handleIndex + 1];
    const implicitMinimum = minimums === undefined && sizes.length * DEFAULT_MINIMUM <= 100 ? DEFAULT_MINIMUM : 0;
    const leftMin = Math.max(0, minimums?.[handleIndex] ?? implicitMinimum);
    const rightMin = Math.max(0, minimums?.[handleIndex + 1] ?? implicitMinimum);
    const leftMax = Math.min(combined - rightMin, maximums?.[handleIndex] ?? 100);
    const rightMax = Math.min(combined - leftMin, maximums?.[handleIndex + 1] ?? 100);
    const minimum = Math.max(leftMin, combined - rightMax);
    const maximum = Math.min(leftMax, combined - rightMin);
    return minimum <= maximum ? { minimum, maximum } : { minimum: sizes[handleIndex], maximum: sizes[handleIndex] };
}

export function resizeAdjacentPanes(
    sizes: readonly number[],
    handleIndex: number,
    deltaPercent: number,
    minimums?: readonly number[],
    maximums?: readonly number[],
): number[] {
    if (handleIndex < 0 || handleIndex >= sizes.length - 1 || !Number.isFinite(deltaPercent)) return [...sizes];
    const next = [...sizes];
    const combined = next[handleIndex] + next[handleIndex + 1];
    const bounds = adjacentPaneBounds(sizes, handleIndex, minimums, maximums);
    const left = Math.max(bounds.minimum, Math.min(bounds.maximum, next[handleIndex] + deltaPercent));
    next[handleIndex] = left;
    next[handleIndex + 1] = combined - left;
    return next;
}

export function validPersistedPaneSizes(value: unknown, count: number, minimums?: readonly number[], maximums?: readonly number[]): number[] | undefined {
    if (!Array.isArray(value) || value.length !== count || value.some(item => typeof item !== "number" || !Number.isFinite(item) || item <= 0)) return undefined;
    return normalizePaneSizes(value, count, minimums, maximums);
}
