import DOMPurify from "dompurify";
import type { SvgBindingContext } from "../components/svg/svgBindings";
import { renderSvgTemplate } from "../components/svg/svgBindings";
import { safeSvgIdentifier } from "../components/svg/svgIdIsolation";
import { SVG_ELEMENT_TYPES, SVG_LIMITS } from "../components/svg/svgTypes";

export interface SanitizedSvg { svg: string; warnings: string[]; elementCount: number; animatedElementCount: number; pathCount: number; }
const elementNames = ["svg", ...SVG_ELEMENT_TYPES];
const elements = new Set<string>(elementNames.map(name => name.toLowerCase()));
const attributes = new Set(["id", "class", "viewbox", "width", "height", "preserveaspectratio", "role", "aria-label", "aria-labelledby", "aria-describedby", "focusable", "tabindex", "opacity", "transform", "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "vector-effect", "paint-order", "clip-path", "mask", "filter", "marker-start", "marker-mid", "marker-end", "visibility", "pointer-events", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "dx", "dy", "d", "points", "pathlength", "text-anchor", "dominant-baseline", "font-family", "font-size", "font-weight", "font-style", "letter-spacing", "fx", "fy", "offset", "stop-color", "stop-opacity", "gradientunits", "gradienttransform", "spreadmethod", "markerwidth", "markerheight", "refx", "refy", "orient", "markerunits", "xmlns"]);
const referenceAttributes = new Set(["fill", "stroke", "clip-path", "mask", "filter", "marker-start", "marker-mid", "marker-end", "aria-labelledby", "aria-describedby"]);
const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
export function resolveSvgMarkupTemplates(markup: string, context: SvgBindingContext): string {
    if (/<\s*\/?\s*\{\{|\{\{[^}]+\}\}\s*=/.test(markup)) throw new Error("SVG templates cannot create element or attribute names.");
    if (/\bd\s*=\s*["'][^"']*\{\{/i.test(markup)) throw new Error("Raw SVG path data cannot be injected from fields.");
    return markup.replace(/\{\{\s*([A-Za-z_$][\w$.-]*)\s*\}\}/g, match => escapeXml(renderSvgTemplate(match, context)));
}

export function sanitizeSvg(input: string, namespace: string): SanitizedSvg {
    const warnings: string[] = []; let elementCount = 0, animatedElementCount = 0, pathCount = 0;
    if (input.length > 250_000) return { svg: "", warnings: ["Raw SVG exceeded the 250,000 character limit."], elementCount, animatedElementCount, pathCount };
    const namespacedInput = /^\s*<svg\b[^>]*\bxmlns\s*=/.test(input) ? input : input.replace(/^\s*<svg\b/i, `<svg xmlns="http://www.w3.org/2000/svg"`);
    const parser = new DOMParser(), document = parser.parseFromString(namespacedInput, "image/svg+xml"), parseError = document.querySelector("parsererror"), root = document.documentElement;
    if (parseError || root.localName.toLowerCase() !== "svg") return { svg: "", warnings: ["Raw SVG could not be parsed as a single SVG document."], elementCount, animatedElementCount, pathCount };
    const ids = new Map<string, string>();
    const visit = (element: Element, depth: number): void => {
        const tag = element.localName.toLowerCase();
        if (!elements.has(tag)) { warnings.push(`Blocked SVG element: ${tag}.`); element.remove(); return; }
        elementCount++; if (tag === "path") { pathCount++; const d = element.getAttribute("d"); if (d && d.length > SVG_LIMITS.maxPathLength) { warnings.push("Blocked SVG path exceeding the path length limit."); element.removeAttribute("d"); } }
        if (depth > SVG_LIMITS.maxDepth) { warnings.push(`Blocked SVG content deeper than ${SVG_LIMITS.maxDepth} levels.`); element.remove(); return; }
        for (const attribute of Array.from(element.attributes)) {
            const name = attribute.name.toLowerCase(), value = attribute.value.trim();
            if (name.startsWith("on") || name === "style" || name === "href" || name === "xlink:href" || name === "src" || name === "srcset" || name === "formaction" || !attributes.has(name)) { warnings.push(`Blocked SVG attribute: ${attribute.name}.`); element.removeAttribute(attribute.name); continue; }
            if (name === "xmlns" && value === "http://www.w3.org/2000/svg") continue;
            if (/javascript\s*:|data\s*:|blob\s*:|https?\s*:|\/\//i.test(value)) { warnings.push(`Blocked external SVG value on ${attribute.name}.`); element.removeAttribute(attribute.name); continue; }
            if (name === "id") { if (!/^[A-Za-z_][A-Za-z0-9_.:-]{0,127}$/.test(value) || ids.has(value)) { warnings.push(`Blocked invalid or duplicate SVG ID: ${value}.`); element.removeAttribute(attribute.name); } else ids.set(value, `${namespace}-${safeSvgIdentifier(value)}`); }
            if (name === "class" && !/^[A-Za-z0-9_ -]*$/.test(value)) { warnings.push("Blocked unsafe SVG class value."); element.removeAttribute(attribute.name); }
        }
        Array.from(element.children).forEach(child => visit(child, depth + 1));
    };
    visit(root, 0);
    if (elementCount > SVG_LIMITS.maxElementsPerComponent) return { svg: "", warnings: [...warnings, `Raw SVG exceeded ${SVG_LIMITS.maxElementsPerComponent} elements.`], elementCount, animatedElementCount, pathCount };
    for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
        const originalId = element.getAttribute("id"); if (originalId && ids.has(originalId)) element.setAttribute("id", ids.get(originalId)!);
        for (const attributeName of referenceAttributes) {
            const value = element.getAttribute(attributeName); if (!value) continue;
            const url = /^url\(#([A-Za-z_][\w:.-]*)\)$/.exec(value), fragment = /^#([A-Za-z_][\w:.-]*)$/.exec(value), tokens = /^(?:[A-Za-z_][\w:.-]*\s*)+$/.test(value) ? value.trim().split(/\s+/) : [];
            if (url) { const id = ids.get(url[1]); if (id) element.setAttribute(attributeName, `url(#${id})`); else { warnings.push(`Blocked unknown SVG reference #${url[1]}.`); element.removeAttribute(attributeName); } }
            else if (fragment && attributeName.startsWith("aria-")) { const id = ids.get(fragment[1]); if (id) element.setAttribute(attributeName, `#${id}`); else element.removeAttribute(attributeName); }
            else if (tokens.length && attributeName.startsWith("aria-")) { const resolved = tokens.map(token => ids.get(token)).filter(Boolean); resolved.length ? element.setAttribute(attributeName, resolved.join(" ")) : element.removeAttribute(attributeName); }
            else if (/url\s*\(/.test(value)) { warnings.push(`Blocked malformed SVG reference on ${attributeName}.`); element.removeAttribute(attributeName); }
        }
    }
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const serialized = new XMLSerializer().serializeToString(root);
    const svg = DOMPurify.sanitize(serialized, { USE_PROFILES: { svg: true, svgFilters: false }, ADD_TAGS: elementNames, ADD_ATTR: Array.from(attributes), FORBID_TAGS: ["script", "foreignObject", "iframe", "object", "embed", "image", "use", "audio", "video", "canvas", "style", "a", "switch", "set", "discard"], FORBID_ATTR: ["style", "href", "xlink:href", "src", "srcset"], ALLOW_DATA_ATTR: false, RETURN_TRUSTED_TYPE: false }) as string;
    if (svg !== serialized) warnings.push("Final SVG sanitization removed unsafe content.");
    return { svg, warnings: Array.from(new Set(warnings)), elementCount, animatedElementCount, pathCount };
}
