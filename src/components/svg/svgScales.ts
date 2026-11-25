import type { SvgPrimitive, SvgScaleDefinition } from "./svgTypes";

export function compileSvgScale(scale: SvgScaleDefinition, automatic: Iterable<unknown> = []): (value: unknown) => SvgPrimitive {
    const range = scale.range;
    if (!range.length) return () => null;
    const domain = scale.domain === "auto" ? automatic : scale.domain;
    const type = scale.type ?? (scale.domain === "auto" || scale.domain.every(item => typeof item === "number") ? "linear" : "ordinal");
    if (type === "ordinal") {
        const categories = new Map<string, number>();
        let position = 0;
        for (const raw of domain) {
            const index = scale.domain === "auto" ? categories.size : position++;
            if (index >= range.length - 1) break;
            const key = String(raw);
            if (!categories.has(key)) categories.set(key, index);
        }
        return value => range[categories.get(String(value)) ?? range.length - 1] ?? null;
    }
    if (type === "threshold") {
        const thresholds: number[] = [];
        const cap = range.length - 1;
        for (const raw of domain) {
            const value = Number(raw);
            if (!Number.isFinite(value)) continue;
            if (scale.domain !== "auto") {
                if (thresholds.length === cap) break;
                thresholds.push(value);
            } else if (cap && (thresholds.length < cap || value < thresholds[thresholds.length - 1])) {
                thresholds.push(value);
                thresholds.sort((a, b) => a - b);
                if (thresholds.length > cap) thresholds.pop();
            }
        }
        return value => {
            const number = Number(value);
            if (!Number.isFinite(number)) return null;
            let index = 0;
            while (index < thresholds.length && number >= thresholds[index]) index++;
            return range[index] ?? null;
        };
    }
    let min = Infinity, max = -Infinity;
    for (const value of domain) {
        const number = Number(value);
        if (!Number.isFinite(number)) continue;
        min = Math.min(min, number);
        max = Math.max(max, number);
    }
    const start = Number(range[0]), end = Number(range[range.length - 1]);
    return value => {
        const number = Number(value);
        if (!Number.isFinite(number) || min === Infinity || !Number.isFinite(start) || !Number.isFinite(end)) return null;
        let t = max === min ? 1 : (number - min) / (max - min);
        if (scale.clamp) t = Math.max(0, Math.min(1, t));
        return start + (end - start) * t;
    };
}

export function resolveSvgScale(value: unknown, scale: SvgScaleDefinition, domainValues: unknown[] = []): SvgPrimitive {
    return compileSvgScale(scale, domainValues)(value);
}
