import * as csstree from "css-tree";
import { scopeCssAst } from "./scopeCss";

const allowedProperties = new Set([
    "display", "grid-template-columns", "grid-template-rows", "grid-column", "grid-row", "align-items", "align-content", "justify-content", "justify-items",
    "flex", "flex-grow", "flex-shrink", "flex-basis", "flex-direction", "flex-wrap", "gap", "row-gap", "column-gap",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "border", "border-width", "border-style", "border-color", "border-radius", "background", "background-color", "color", "font-family", "font-size", "font-weight",
    "font-style", "line-height", "letter-spacing", "text-align", "text-transform", "text-decoration", "white-space", "word-break",
    "width", "min-width", "max-width", "height", "min-height", "max-height", "overflow", "overflow-x", "overflow-y", "position", "top", "right", "bottom", "left",
    "box-shadow", "opacity", "cursor", "object-fit", "object-position", "visibility", "transform", "transform-origin", "transition", "z-index",
    "outline", "outline-color", "outline-style", "outline-width", "outline-offset", "content",
    "border-collapse", "border-spacing", "border-top", "border-right", "border-bottom", "border-left", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "border-top-style", "border-right-style", "border-bottom-style", "border-left-style", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
    "vertical-align", "pointer-events", "user-select", "appearance", "filter", "backdrop-filter", "inset", "inset-inline", "inset-block", "inset-inline-start", "inset-inline-end", "inset-block-start", "inset-block-end",
    "place-items", "place-content", "place-self", "grid-template-areas", "grid-area", "grid-column-start", "grid-column-end", "grid-row-start", "grid-row-end", "grid-auto-columns", "grid-auto-rows", "grid-auto-flow",
    "flex-flow", "align-self", "justify-self", "order", "aspect-ratio", "isolation", "text-overflow", "text-indent", "text-shadow", "text-wrap", "overflow-wrap", "hyphens",
    "list-style", "list-style-type", "list-style-position", "list-style-image", "table-layout", "caption-side", "empty-cells", "columns", "column-count", "column-width", "column-rule", "break-before", "break-after", "break-inside",
    "clip-path", "mask", "mix-blend-mode", "background-image", "background-size", "background-position", "background-repeat", "background-clip", "background-origin", "box-sizing", "float", "clear"
    ,"animation", "animation-name", "animation-duration", "animation-delay", "animation-timing-function", "animation-iteration-count", "animation-direction", "animation-fill-mode", "animation-play-state"
    ,"fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "vector-effect", "paint-order", "shape-rendering", "text-rendering", "color-interpolation", "color-interpolation-filters"
]);

function kebab(value: string): string { return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`); }
const timeMs = (value: string): number | undefined => { const match = /^\s*(-?\d*\.?\d+)\s*(ms|s)\s*$/.exec(value); return match ? Number(match[1]) * (match[2] === "s" ? 1000 : 1) : undefined; };
const safeEasing = (value: string) => /^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\(\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*\)|steps\(\s*\d+\s*(,\s*(start|end|jump-start|jump-end|jump-none|jump-both))?\s*\))$/.test(value.trim());
function safeDeclaration(property: string, value: string, mode: "scoped" | "trusted" = "scoped", allowLocalSvgReferences = false): boolean {
    const urls = Array.from(value.matchAll(/url\(\s*([^)]*)\s*\)/gi), match => match[1].trim().replace(/^['"]|['"]$/g, ""));
    if (urls.some(url => !allowLocalSvgReferences || !/^#[A-Za-z_][\w:.-]*$/.test(url) || /^#__hp_unknown_/i.test(url))) return false;
    if (!((mode === "trusted" || property.startsWith("--") || allowedProperties.has(property))) || /expression\s*\(|behavior\s*:|javascript\s*:/i.test(value) || (property === "position" && /fixed/i.test(value)) || (property === "z-index" && Math.abs(Number(value)) > 100)) return false;
    if (property === "animation-duration") return value.split(",").every(item => { const ms = timeMs(item); return ms !== undefined && ms >= 100 && ms <= 60_000; });
    if (property === "animation-delay") return value.split(",").every(item => { const ms = timeMs(item); return ms !== undefined && ms >= 0 && ms <= 30_000; });
    if (property === "animation-iteration-count") return value.split(",").every(item => Number.isInteger(Number(item)) && Number(item) >= 1 && Number(item) <= 100);
    if (property === "animation-timing-function") return value.split(/,(?![^()]*\))/).every(safeEasing);
    if (property === "animation") return value.split(/,(?![^()]*\))/).every(item => { if (/\binfinite\b/i.test(item)) return false; const times = item.match(/-?\d*\.?\d+(?:ms|s)\b/gi) ?? []; if (!times.length) return false; const duration = timeMs(times[0]!), delay = times[1] ? timeMs(times[1]) : 0; const iterations = item.match(/(?:^|\s)(\d+)(?:\s|$)/)?.[1]; return duration !== undefined && duration >= 100 && duration <= 60_000 && delay !== undefined && delay >= 0 && delay <= 30_000 && (!iterations || Number(iterations) >= 1 && Number(iterations) <= 100); });
    return true;
}
export function sanitizeStyleObject(input: Record<string, string | number> | undefined, mode: "scoped" | "trusted" = "scoped"): Record<string, string | number> {
    if (!input) return {};
    return Object.fromEntries(Object.entries(input).map(([property, value]) => [kebab(property), value] as const).filter(([property, value]) => safeDeclaration(property, String(value), mode)));
}

export interface SanitizedCss { css: string; warnings: string[]; }

function scopeKeyframes(input: string, namespace: string): string {
    const names = new Map<string, string>();
    let output = input.replace(/@(\-webkit-)?keyframes\s+([A-Za-z_][\w-]*)/gi, (match, prefix: string | undefined, name: string) => { const scoped = `${namespace}-${name}`.replace(/[^A-Za-z0-9_-]/g, "-"); names.set(name, scoped); return `@${prefix ?? ""}keyframes ${scoped}`; });
    output = output.replace(/(animation-name\s*:\s*)([^;}]+)/gi, (_match, lead: string, value: string) => `${lead}${value.split(",").map(item => names.get(item.trim()) ?? item.trim()).join(", ")}`);
    output = output.replace(/(animation\s*:\s*)([^;}]+)/gi, (_match, lead: string, value: string) => `${lead}${Array.from(names).reduce((result, [name, scoped]) => result.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), scoped), value)}`);
    return output;
}

export function sanitizeCss(input: string, scopeSelector: string, options: { mode?: "scoped" | "trusted"; keyframeNamespace?: string; allowLocalSvgReferences?: boolean } = {}): SanitizedCss {
    const warnings: string[] = [];
    if (!input.trim()) return { css: "", warnings };
    let ast: csstree.CssNode;
    try { ast = csstree.parse(options.keyframeNamespace ? scopeKeyframes(input, options.keyframeNamespace) : input); } catch (error) { return { css: "", warnings: [`CSS parse error: ${error instanceof Error ? error.message : String(error)}`] }; }
    csstree.walk(ast, {
        enter(node: csstree.CssNode, item: csstree.ListItem<csstree.CssNode>, list: csstree.List<csstree.CssNode>) {
            if (node.type === "Atrule" && ["import", "font-face", "namespace", "document", "page"].includes(node.name.toLowerCase())) {
                list?.remove(item); warnings.push(`Blocked @${node.name} rule.`); return;
            }
            if (node.type !== "Declaration") return;
            const property = node.property.toLowerCase();
            const value = csstree.generate(node.value);
            const unsafe = !safeDeclaration(property, value, options.mode, options.allowLocalSvgReferences);
            if (unsafe) { list?.remove(item); warnings.push(`Blocked CSS declaration: ${property}.`); }
        }
    });
    scopeCssAst(ast, scopeSelector);
    return { css: csstree.generate(ast), warnings: Array.from(new Set(warnings)) };
}
