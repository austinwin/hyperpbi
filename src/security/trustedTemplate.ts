import type { NormalizedData } from "../data/normalizeData";
import { renderTemplate, type TemplateContext } from "../render/renderTemplate";

/** Bind values after parsing author markup. Values never participate in HTML parsing. */
export function renderTrustedTemplate(template: string, data: NormalizedData, selected: Record<string, unknown> = {}, title = "", context: TemplateContext = {}): string {
    const values: string[] = [];
    const prefix = `hpbind${crypto.randomUUID().replace(/-/g, "")}x`;
    const protectedMarkup = template.replace(/\{\{\s*[A-Za-z][A-Za-z0-9_.-]{0,100}\s*\}\}/g, token => {
        const index = values.push(renderTemplate(token, data, selected, title, context)) - 1;
        return `${prefix}${index}end`;
    });
    const document = new DOMParser().parseFromString(protectedMarkup, "text/html");
    const pattern = new RegExp(`${prefix}(\\d+)end`, "g");
    const contains = (value: string) => value.includes(prefix);
    const bind = (value: string) => value.replace(pattern, (_, index: string) => values[Number(index)] ?? "");
    const visit = (node: Node): void => {
        if (node.nodeType === 3 && contains(node.textContent ?? "")) {
            if (/^(script|style)$/i.test(node.parentElement?.localName ?? "")) throw new Error("Field templates cannot appear inside script or style. Bind data in text or non-executable attributes.");
            node.textContent = bind(node.textContent ?? "");
        }
        if (node.nodeType === 1) {
            const element = node as Element;
            if (contains(element.localName)) throw new Error("Field templates cannot create element names.");
            for (const attribute of Array.from(element.attributes)) {
                if (contains(attribute.name)) throw new Error("Field templates cannot create attribute names.");
                if (!contains(attribute.value)) continue;
                if (/^on|^(style|srcdoc|srcset|http-equiv|content|is)$/i.test(attribute.name) || /^(script|style)$/i.test(element.localName)) throw new Error(`Field templates cannot supply executable ${attribute.name} attributes.`);
                const value = bind(attribute.value);
                if (/^(href|src|action|formaction|poster|xlink:href|data|codebase)$/i.test(attribute.name)) {
                    const url = new URL(value, "https://hyperpbi.invalid/");
                    if (!["https:", "mailto:", "tel:"].includes(url.protocol) || url.username || url.password) throw new Error(`Field template supplied an unsafe URL in ${attribute.name}.`);
                }
                element.setAttribute(attribute.name, value);
            }
            if (element instanceof HTMLTemplateElement) Array.from(element.content.childNodes).forEach(visit);
        }
        Array.from(node.childNodes).forEach(visit);
    };
    visit(document.documentElement);
    return `<!doctype html>${document.documentElement.outerHTML}`;
}
