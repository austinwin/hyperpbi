import type { Diagnostic } from "./diagnostics";

export function validateRemotePopup(popup: Record<string, unknown>, path: string, componentId?: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const error = (property: string, message: string) => diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${path}/${property}`, componentId, message });
    if (!["none", "default", "custom", "remote"].includes(String(popup.mode))) error("mode", "popup.mode must be none, default, custom or remote.");
    if (popup.mode === "remote" && (!popup.remote || typeof popup.remote !== "object" || Array.isArray(popup.remote))) error("remote", "Remote popup needs a remote request object.");
    if (popup.remote !== undefined && popup.mode !== "remote") error("remote", "remote settings require popup.mode remote.");
    if (popup.remote && typeof popup.remote === "object" && !Array.isArray(popup.remote)) {
        const request = popup.remote as Record<string, unknown>;
        const allowed = new Set(["endpoint", "timeoutMs", "cacheTtlSeconds", "fallback", "fallbackMessage", "width", "maxHeight"]);
        for (const key of Object.keys(request)) if (!allowed.has(key)) error(`remote/${key}`, `Unsupported remote request property: ${key}. GET is the only supported method; credentials and headers are not accepted.`);
        if (typeof request.endpoint !== "string" || request.endpoint.length > 2048) error("remote/endpoint", "Endpoint must be an HTTPS URL of at most 2048 characters.");
        else {
            try {
                if (!/^https:\/\/[^/?#{}]+(?:[/?]|$)/i.test(request.endpoint)) throw new Error();
                const url = new URL(request.endpoint.replace(/\{\{\s*(service|powerbi|joined)\.[^{}]+\s*\}\}/g, "value"));
                if (url.protocol !== "https:" || url.username || url.password || url.hash || request.endpoint.includes("\\")) throw new Error();
                const remainder = request.endpoint.replace(/\{\{\s*(service|powerbi|joined)\.[^{}]+\s*\}\}/g, "value");
                if (/[{}]/.test(remainder)) throw new Error();
            } catch { error("remote/endpoint", "Endpoint needs a literal credential-free HTTPS origin and qualified feature bindings in its path or query."); }
        }
        for (const [key, min, max] of [["timeoutMs", 1000, 15000], ["cacheTtlSeconds", 0, 3600], ["width", 280, 1000], ["maxHeight", 200, 1000]] as const) {
            const value = request[key];
            if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)) error(`remote/${key}`, `${key} must be between ${min} and ${max}.`);
        }
        if (request.fallback !== undefined && !["attributes", "message"].includes(String(request.fallback))) error("remote/fallback", "fallback must be attributes or message.");
        if (request.fallbackMessage !== undefined && (typeof request.fallbackMessage !== "string" || request.fallbackMessage.length > 500)) error("remote/fallbackMessage", "Fallback message must be at most 500 characters.");
    }
    return diagnostics;
}
