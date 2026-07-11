import type { SvgPrimitive, SvgScaleDefinition } from "./svgTypes";

const finiteNumbers = (values: unknown[]): number[] => values.map(Number).filter(Number.isFinite);
export function resolveSvgScale(value: unknown, scale: SvgScaleDefinition, domainValues: unknown[] = []): SvgPrimitive {
    const range = scale.range; if (!range.length) return null;
    const type = scale.type ?? (scale.domain === "auto" || (Array.isArray(scale.domain) && scale.domain.every(item => typeof item === "number")) ? "linear" : "ordinal");
    if (type === "ordinal") { const domain = scale.domain === "auto" ? Array.from(new Set(domainValues.map(String))) : scale.domain.map(String); const index = domain.indexOf(String(value)); return range[index < 0 ? range.length - 1 : Math.min(index, range.length - 1)] ?? null; }
    if (type === "threshold") { const thresholds = scale.domain === "auto" ? finiteNumbers(domainValues).sort((a, b) => a - b) : finiteNumbers(scale.domain); const number = Number(value); if (!Number.isFinite(number)) return null; let index = 0; while (index < thresholds.length && number >= thresholds[index]) index++; return range[Math.min(index, range.length - 1)] ?? null; }
    const domain = scale.domain === "auto" ? finiteNumbers(domainValues) : finiteNumbers(scale.domain); const number = Number(value); if (!Number.isFinite(number) || domain.length === 0) return null; const min = Math.min(...domain), max = Math.max(...domain), start = Number(range[0]), end = Number(range[range.length - 1]); if (!Number.isFinite(start) || !Number.isFinite(end)) return null; let t = max === min ? 1 : (number - min) / (max - min); if (scale.clamp) t = Math.max(0, Math.min(1, t)); return start + (end - start) * t;
}
