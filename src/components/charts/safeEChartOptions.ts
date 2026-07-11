import type { EChartsCoreOption } from "echarts/core";

export interface SanitizedEChartOptions { option: EChartsCoreOption; warnings: string[]; }

const blockedKeys = /^(?:__proto__|prototype|constructor|renderItem|onclick|onmouseover|onmouseout|onmousemove|oncontextmenu|href|url|src|backgroundImage)$/i;
const unsafeString = /(?:javascript\s*:|data\s*:|(?:https?|ftp):\/\/|mailto:|\/\/[^\s]|<\/?(?:script|style|iframe|object|embed)|\bon\w+\s*=)/i;
const safeSeries = new Set(["bar", "boxplot", "candlestick", "chord", "custom", "effectScatter", "funnel", "gauge", "graph", "heatmap", "line", "lines", "map", "parallel", "pictorialBar", "pie", "radar", "sankey", "scatter", "sunburst", "themeRiver", "tree", "treemap"]);

function sanitizeNode(value: unknown, path: string, warnings: string[]): unknown {
    if (value === null || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "function") { warnings.push(`${path} removed: functions are not allowed.`); return undefined; }
    if (typeof value === "string") { if (unsafeString.test(value)) { warnings.push(`${path} removed: external URLs or executable markup are not allowed.`); return undefined; } return value.slice(0, 20000); }
    if (Array.isArray(value)) return value.slice(0, 30000).map((item, index) => sanitizeNode(item, `${path}[${index}]`, warnings)).filter(item => item !== undefined);
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

export function mergeSafeBuiltInEChartOptions(base: EChartsCoreOption, input: unknown): SanitizedEChartOptions {
    const sanitized = sanitizeEChartOptions(input);
    const option = mergeNode(base, sanitized.option) as Record<string, unknown>;
    const baseSeries = (base as { series?: unknown }).series;
    const overrideSeries = (sanitized.option as { series?: unknown }).series;
    if (Array.isArray(baseSeries) && Array.isArray(overrideSeries)) {
        option.series = baseSeries.map((series, index) => mergeNode(series, overrideSeries[index]));
    }
    return { option: option as EChartsCoreOption, warnings: sanitized.warnings };
}

const semanticSeriesKeys = new Set(["type", "data", "links", "nodes", "edges", "source", "encode", "transform", "dimensions"]);

function withoutSemanticKeys(value: unknown, path: string, warnings: string[]): unknown {
    if (Array.isArray(value)) return value.map((item, index) => withoutSemanticKeys(item, `${path}[${index}]`, warnings));
    if (!value || typeof value !== "object") return value;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (semanticSeriesKeys.has(key)) { warnings.push(`${path}.${key} ignored: semantic chart data is generated from bound fields.`); continue; }
        result[key] = withoutSemanticKeys(child, `${path}.${key}`, warnings);
    }
    return result;
}

export function mergeSemanticChartOptions(base: EChartsCoreOption, input: unknown): SanitizedEChartOptions {
    const sanitized = sanitizeEChartOptions(input);
    const warnings = [...sanitized.warnings];
    const override = { ...(sanitized.option as Record<string, unknown>) };
    for (const key of ["dataset", "transform"]) {
        if (key in override) { delete override[key]; warnings.push(`options.${key} ignored: semantic chart data is generated from bound fields.`); }
    }
    const axisOverrides: Record<string, unknown> = {};
    for (const axisKey of ["xAxis", "yAxis"]) {
        const axes = override[axisKey];
        const cleanAxis = (axis: unknown, index?: number) => {
            if (!axis || typeof axis !== "object" || Array.isArray(axis)) return axis;
            const record = { ...(axis as Record<string, unknown>) };
            for (const key of ["data", "type"]) if (key in record) { delete record[key]; warnings.push(`options.${axisKey}${index === undefined ? "" : `[${index}]`}.${key} ignored: semantic axes are generated from bound fields.`); }
            return record;
        };
        if (Array.isArray(axes)) axisOverrides[axisKey] = axes.map((axis, index) => cleanAxis(axis, index));
        else if (axes) axisOverrides[axisKey] = cleanAxis(axes);
        delete override[axisKey];
    }
    if (override.radar && typeof override.radar === "object" && !Array.isArray(override.radar)) {
        const radar = { ...(override.radar as Record<string, unknown>) };
        if ("indicator" in radar) { delete radar.indicator; warnings.push("options.radar.indicator ignored: semantic radar indicators are generated from bound fields."); }
        override.radar = radar;
    }
    const baseSeries = Array.isArray((base as { series?: unknown }).series) ? (base as { series: unknown[] }).series : [];
    const rawSeries = Array.isArray(override.series) ? override.series : override.series && typeof override.series === "object" ? [override.series] : [];
    if (rawSeries.length && rawSeries.length !== baseSeries.length) warnings.push("options.series count ignored: semantic chart series are generated from bound fields.");
    delete override.series;
    const option = mergeNode(base, override) as Record<string, unknown>;
    for (const axisKey of ["xAxis", "yAxis"]) {
        const baseAxis=(base as Record<string,unknown>)[axisKey], axisOverride=axisOverrides[axisKey];
        if(axisOverride===undefined)continue;
        if(Array.isArray(baseAxis)){const overrides=Array.isArray(axisOverride)?axisOverride:[axisOverride];option[axisKey]=baseAxis.map((axis,index)=>mergeNode(axis,overrides[index]));}
        else option[axisKey]=mergeNode(baseAxis,Array.isArray(axisOverride)?axisOverride[0]:axisOverride);
    }
    if (baseSeries.length) option.series = baseSeries.map((series, index) => mergeNode(series, withoutSemanticKeys(rawSeries[index], `options.series[${index}]`, warnings)));
    return { option: option as EChartsCoreOption, warnings: Array.from(new Set(warnings)) };
}
