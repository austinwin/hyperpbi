import DOMPurify from "dompurify";

export interface HtmlSanitizerOptions { allowInlineSvg?: boolean; allowSafeImages?: boolean; }
export interface SanitizedHtml { html: string; warnings: string[]; }

const forbiddenTags = ["script", "iframe", "object", "embed", "link", "meta", "form", "input", "button", "select", "textarea", "style", "base"];

export function sanitizeHtml(input: string, options: HtmlSanitizerOptions = {}): SanitizedHtml {
    const before = input;
    const html = DOMPurify.sanitize(input, {
        USE_PROFILES: { html: true, svg: options.allowInlineSvg === true, svgFilters: false },
        FORBID_TAGS: options.allowInlineSvg ? forbiddenTags : [...forbiddenTags, "svg", "math"],
        FORBID_ATTR: ["style", "srcset", "formaction", "xlink:href"],
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: true,
        ALLOWED_URI_REGEXP: options.allowSafeImages ? /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i : /^(?:mailto:|#|\/|\.\/|\.\.\/)/i
    });
    const warnings: string[] = [];
    if (html !== before) warnings.push("Unsafe HTML elements or attributes were removed.");
    return { html, warnings };
}
