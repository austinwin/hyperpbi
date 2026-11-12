import * as csstree from "css-tree";
import { fitSvgViewport, parseSvgDocument, svgNamespace } from "./svgMarkupDocument";

export const SVG_IMAGE_LIMITS = { characters: 1_000_000, elements: 5_000, depth: 64 } as const;
const animationElements = new Set(["animate", "animateMotion", "animateTransform", "animateColor", "set", "discard"]);
const embeddedImage = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z\d+/=\s]+$/i;

function staticCss(input: string, context: "stylesheet" | "declarationList"): string {
    try {
        const ast = csstree.parse(input, { context });
        csstree.walk(ast, {
            enter(node: csstree.CssNode, item: csstree.ListItem<csstree.CssNode>, list: csstree.List<csstree.CssNode>) {
                if (node.type === "Atrule" && /^(?:-webkit-)?keyframes$/i.test(csstree.ident.decode(node.name)) ||
                    node.type === "Declaration" && /^(?:-webkit-)?(?:animation|transition)(?:-|$)/i.test(csstree.ident.decode(node.property)) ||
                    node.type === "Raw") list?.remove(item);
            },
        });
        return csstree.generate(ast);
    } catch {
        return "";
    }
}

/** The resulting URL is exclusively for an img element, where SVG uses secure image processing. */
export function compileSvgImage(input: string, reducedMotion: boolean): { src: string; title?: string } | { error: string } {
    if (input.length > SVG_IMAGE_LIMITS.characters) return { error: "The SVG exceeds the 1,000,000 character image limit." };
    if (/<!DOCTYPE\b/i.test(input)) return { error: "SVG document type declarations are unsupported." };
    const root = parseSvgDocument(input);
    if (!root || root.localName !== "svg" || root.namespaceURI !== svgNamespace) return { error: "The SVG could not be parsed as a single SVG document." };
    if (!fitSvgViewport(root)) return { error: "The SVG needs a valid viewBox or positive width and height in pixels." };

    let count = 0;
    const visit = (element: Element, depth: number): boolean => {
        if (++count > SVG_IMAGE_LIMITS.elements || depth > SVG_IMAGE_LIMITS.depth) return false;
        const tag = element.localName;
        if (element.namespaceURI !== svgNamespace || tag === "script" || tag === "foreignObject" ||
            reducedMotion && animationElements.has(tag)) {
            element.remove();
            return true;
        }
        for (const attribute of Array.from(element.attributes)) {
            const name = attribute.localName.toLowerCase();
            if (name.startsWith("on") || name === "src" || name === "srcset" || attribute.name === "xml:base") {
                element.removeAttributeNode(attribute);
            } else if (name === "href") {
                const value = attribute.value.trim();
                const local = tag !== "a" && /^#[^\s]+$/.test(value);
                const raster = (tag === "image" || tag === "feImage") && embeddedImage.test(value);
                if (!local && !raster) element.removeAttributeNode(attribute);
            } else if (reducedMotion && name === "style") {
                attribute.value = staticCss(attribute.value, "declarationList");
            }
        }
        if (reducedMotion && tag === "style") element.textContent = staticCss(element.textContent ?? "", "stylesheet");
        return Array.from(element.children).every(child => visit(child, depth + 1));
    };
    if (!visit(root, 0)) return { error: "The SVG exceeds the image limit of 5,000 elements or 64 nesting levels." };

    const markup = new XMLSerializer().serializeToString(root);
    const title = Array.from(root.children).find(element => element.localName === "title")?.textContent?.trim();
    return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`, title };
}
