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
]);

function kebab(value: string): string { return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`); }
function safeDeclaration(property: string, value: string, mode: "scoped" | "trusted" = "scoped"): boolean { return (mode === "trusted" || property.startsWith("--") || allowedProperties.has(property)) && !/url\s*\(|expression\s*\(|behavior\s*:|javascript\s*:/i.test(value) && !(property === "position" && /fixed/i.test(value)) && !(property === "z-index" && Math.abs(Number(value)) > 100); }
export function sanitizeStyleObject(input: Record<string, string | number> | undefined, mode: "scoped" | "trusted" = "scoped"): Record<string, string | number> {
    if (!input) return {};
    return Object.fromEntries(Object.entries(input).map(([property, value]) => [kebab(property), value] as const).filter(([property, value]) => safeDeclaration(property, String(value), mode)));
}

export interface SanitizedCss { css: string; warnings: string[]; }

export function sanitizeCss(input: string, scopeSelector: string, options: { mode?: "scoped" | "trusted" } = {}): SanitizedCss {
    const warnings: string[] = [];
    if (!input.trim()) return { css: "", warnings };
    let ast: csstree.CssNode;
    try { ast = csstree.parse(input); } catch (error) { return { css: "", warnings: [`CSS parse error: ${error instanceof Error ? error.message : String(error)}`] }; }
    csstree.walk(ast, {
        enter(node: csstree.CssNode, item: csstree.ListItem<csstree.CssNode>, list: csstree.List<csstree.CssNode>) {
            if (node.type === "Atrule" && ["import", "font-face", "namespace", "document", "page"].includes(node.name.toLowerCase())) {
                list?.remove(item); warnings.push(`Blocked @${node.name} rule.`); return;
            }
            if (node.type !== "Declaration") return;
            const property = node.property.toLowerCase();
            const value = csstree.generate(node.value);
            const unsafe = !safeDeclaration(property, value, options.mode);
            if (unsafe) { list?.remove(item); warnings.push(`Blocked CSS declaration: ${property}.`); }
        }
    });
    scopeCssAst(ast, scopeSelector);
    return { css: csstree.generate(ast), warnings: Array.from(new Set(warnings)) };
}
