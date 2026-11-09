import { fragmentBindingFields, fragmentEndpoint } from "../fragments/fragmentBindings";
import type { Diagnostic } from "./diagnostics";

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function dynamicContentValidation(path: string, componentId?: string) {
    const diagnostics: Diagnostic[] = [];
    const error = (property: string, message: string) => diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${path}/${property}`, componentId, message });
    const bounded = (property: string, value: unknown, min: number, max: number) => {
        if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max)) error(property, `Use a whole number from ${min} through ${max}.`);
    };
    const request = (value: unknown) => {
        if (!object(value)) { error("request", "Dynamic content requires a request object."); return; }
        for (const key of Object.keys(value)) if (!["endpoint", "timeoutMs", "cacheTtlSeconds", "fallbackMessage"].includes(key)) error(`request/${key}`, `Unsupported request property “${key}”. Dynamic content uses anonymous GET requests.`);
        if (typeof value.endpoint !== "string" || value.endpoint.length > 2048) error("request/endpoint", "Use an HTTPS endpoint of at most 2048 characters.");
        else try { fragmentEndpoint(value.endpoint, {}, {}, true); } catch (reason) { error("request/endpoint", (reason as Error).message); }
        bounded("request/timeoutMs", value.timeoutMs, 1000, 15000);
        bounded("request/cacheTtlSeconds", value.cacheTtlSeconds, 0, 3600);
        if (value.fallbackMessage !== undefined && (typeof value.fallbackMessage !== "string" || value.fallbackMessage.length > 500)) error("request/fallbackMessage", "Use a fallback message of at most 500 characters.");
    };
    return { diagnostics, error, bounded, request };
}

export function validateDynamicContent(component: Record<string, unknown>, path: string, componentId?: string): Diagnostic[] {
    const { diagnostics, error, request } = dynamicContentValidation(path, componentId);
    request(component.request);
    const trigger = component.trigger;
    if (trigger !== undefined) {
        if (!object(trigger)) error("trigger", "Use a trigger with a source component ID and event.");
        else {
            for (const key of Object.keys(trigger)) if (!["source", "event", "refresh"].includes(key)) error(`trigger/${key}`, `Unsupported trigger property “${key}”.`);
            if (typeof trigger.source !== "string" || !trigger.source || trigger.source === componentId) error("trigger/source", "Use the ID of another component as the event source.");
            if (trigger.event !== "click" && trigger.event !== "change" && trigger.event !== "select") error("trigger/event", "Use click, change, or select.");
            if (trigger.refresh !== undefined && typeof trigger.refresh !== "boolean") error("trigger/refresh", "Refresh must be true or false.");
        }
    }
    if (component.loadOnMount !== undefined && typeof component.loadOnMount !== "boolean") error("loadOnMount", "Load on mount must be true or false.");
    if (component.emptyText !== undefined && typeof component.emptyText !== "string") error("emptyText", "Waiting text must be a string.");
    if (object(component.request) && typeof component.request.endpoint === "string" && fragmentBindingFields(component.request.endpoint, "context").length && (!trigger || component.loadOnMount)) {
        error("request/endpoint", "Context bindings require a trigger and must wait for its first event.");
    }
    return diagnostics;
}
