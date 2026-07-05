import { sanitizeCss, SanitizedCss } from "../../security/sanitizeCss";
export function scopeComponentCss(css: string, componentId: string): SanitizedCss { return sanitizeCss(css, `[data-hp-id="${componentId.replace(/[^A-Za-z0-9_-]/g, "_")}"]`); }
