import type { EChartsCoreOption } from "echarts/core";

export interface SanitizedEChartOptions { option: EChartsCoreOption; warnings: string[]; }

const blockedKeys = /^(?:__proto__|prototype|constructor|formatter|renderItem|onclick|onmouseover|onmouseout|onmousemove|oncontextmenu|href|url|src|backgroundImage)$/i;
const unsafeString = /(?:javascript\s*:|data\s*:|(?:https?|ftp):\/\/|mailto:|\/\/[^\s]|<\/?(?:script|style|iframe|object|embed)|\bon\w+\s*=)/i;
const safeSeries = new Set(["bar", "line", "pie", "scatter", "gauge", "heatmap", "radar", "treemap", "sunburst", "sankey", "funnel", "boxplot", "graph"]);

function sanitizeNode(value: unknown, path: string, warnings: string[]): unknown {
    if (value === null || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "function") { warnings.push(`${path} removed: functions are not allowed.`); return undefined; }
    if (typeof value === "string") { if (unsafeString.test(value)) { warnings.push(`${path} removed: external URLs or executable markup are not allowed.`); return undefined; } return value.slice(0, 20000); }
    if (Array.isArray(value)) return value.slice(0, 5000).map((item, index) => sanitizeNode(item, `${path}[${index}]`, warnings)).filter(item => item !== undefined);
    if (typeof value !== "object") return undefined;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const childPath = `${path}.${key}`;
        if (blockedKeys.test(key) || /^on[A-Z_]/.test(key)) { warnings.push(`${childPath} removed: callbacks and URL-bearing properties are not allowed.`); continue; }
        if (key === "type" && path.includes("series") && typeof child === "string" && !safeSeries.has(child)) { warnings.push(`${childPath} removed: unsupported series type ${child}.`); continue; }
        const safe = sanitizeNode(child, childPath, warnings); if (safe !== undefined) result[key] = safe;
    }
    return result;
}

export function sanitizeEChartOptions(input: unknown): SanitizedEChartOptions {
    const warnings: string[] = []; const option = sanitizeNode(input, "options", warnings);
    return { option: (option && typeof option === "object" ? option : {}) as EChartsCoreOption, warnings: Array.from(new Set(warnings)) };
}

function mergeNode(base: unknown, override: unknown): unknown {
    if (Array.isArray(override)) return override;
    if (!override || typeof override !== "object") return override === undefined ? base : override;
    const source = base && typeof base === "object" && !Array.isArray(base) ? base as Record<string, unknown> : {};
    return Object.fromEntries(Array.from(new Set([...Object.keys(source), ...Object.keys(override as Record<string, unknown>)])).map(key => [key, mergeNode(source[key], (override as Record<string, unknown>)[key])]));
}

export function mergeSafeEChartOptions(base: EChartsCoreOption, input: unknown): SanitizedEChartOptions {
    const sanitized = sanitizeEChartOptions(input); return { option: mergeNode(base, sanitized.option) as EChartsCoreOption, warnings: sanitized.warnings };
}
