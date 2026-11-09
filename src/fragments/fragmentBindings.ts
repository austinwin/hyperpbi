import type { DynamicContext } from "./fragmentTypes";

const binding = /\{\{\s*(context|state)\.([^{}]+?)\s*\}\}/g;

export function fragmentBindingFields(template: string, scope: "context" | "state"): string[] {
    return [...template.matchAll(binding)].filter(match => match[1] === scope).map(match => match[2].trim());
}

export function replaceFragmentContextField(template: string, field: string, replacement: string): string {
    return template.replace(binding, (token, scope: string, raw: string) =>
        scope === "context" && raw.trim() === field ? `{{context.${replacement}}}` : token);
}

export function fragmentEndpoint(template: string, context: DynamicContext = {}, state: DynamicContext = {}, validateOnly = false): URL {
    if (!/^https:\/\/[^/?#{}]+(?:[/?]|$)/i.test(template) || /[\\#\u0000-\u0020]/.test(template.replace(binding, "value"))) {
        throw new Error("Dynamic endpoint needs a literal HTTPS origin and bindings in its path or query values.");
    }
    const queryIndex = template.indexOf("?");
    if (queryIndex >= 0 && template.slice(queryIndex + 1).split("&").some(parameter => /[{}]/.test(parameter.split("=", 1)[0]))) {
        throw new Error("Dynamic query bindings must be in parameter values.");
    }
    const resolved = template.replace(binding, (_token, scope: "context" | "state", raw: string) => {
        const field = raw.trim();
        if (!field) throw new Error("Dynamic URL bindings need a field name.");
        if (validateOnly) return "value";
        const values = scope === "context" ? context : state;
        const value = Object.hasOwn(values, field) ? values[field] : undefined;
        if (value == null && scope === "state") return "";
        if (value == null) throw new Error(`Missing dynamic value: ${scope}.${field}.`);
        if (typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value))) {
            throw new Error(`Dynamic URL binding ${scope}.${field} must be a scalar value.`);
        }
        if (value === "." || value === "..") throw new Error("Dot path bindings are not allowed.");
        return encodeURIComponent(String(value));
    });
    if (/[{}]/.test(resolved)) throw new Error("Use bindings such as {{context.asset_id}} or {{state.priority}}.");
    if (resolved.length > 8192) throw new Error("The resolved dynamic endpoint is too long.");
    const url = new URL(resolved);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Dynamic endpoint requires credential-free HTTPS.");
    return url;
}
