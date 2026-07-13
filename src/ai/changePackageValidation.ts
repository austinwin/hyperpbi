import type { AiChangePackage } from "./changePackage";

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const operations = new Set(["replaceDashboard", "replace", "insertBefore", "insertAfter", "appendChild", "appendRoot", "remove"]);

export function validateAiChangePackage(value: unknown): { valid: boolean; package?: AiChangePackage; errors: string[] } {
    const errors: string[] = [];
    if (!object(value)) return { valid: false, errors: ["Change package must be one object."] };
    const operation = String(value.operation ?? "");
    const operationProperties: Record<string, string[]> = {
        replaceDashboard: ["specification"],
        replace: ["targetId", "component"],
        insertBefore: ["targetId", "component"],
        insertAfter: ["targetId", "component"],
        appendChild: ["targetId", "containerPath", "component"],
        appendRoot: ["containerPath", "component"],
        remove: ["targetId"],
    };
    const allowed = new Set(["kind", "version", "operation", ...(operationProperties[operation] ?? [])]);
    for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`Unknown change-package property “${key}” for ${operation || "unknown operation"}.`);
    if (value.kind !== "hyperpbi-change") errors.push("Change package must use kind \"hyperpbi-change\".");
    if (value.version !== "1.0") errors.push("Change package version must be 1.0.");
    if (!operations.has(operation)) errors.push("Change package operation is not supported.");
    if (operation === "replaceDashboard") {
        if (!object(value.specification)) errors.push("replaceDashboard requires specification.");
    } else if (operations.has(operation)) {
        if (!["appendRoot"].includes(operation) && (typeof value.targetId !== "string" || !value.targetId.trim())) errors.push(`${operation} requires targetId.`);
        if (!['remove'].includes(operation) && !object(value.component)) errors.push(`${operation} requires one component.`);
        if (operation === "replace" && object(value.component) && value.component.id !== value.targetId) errors.push("replace requires component.id to equal targetId.");
        if (["appendChild", "appendRoot"].includes(operation) && (typeof value.containerPath !== "string" || !value.containerPath.trim())) errors.push(`${operation} requires containerPath.`);
        if (typeof value.containerPath === "string" && (value.containerPath.startsWith("/") || value.containerPath.split("/").some(part => !part || part === "." || part === ".."))) errors.push(`${operation} containerPath must be a safe relative path.`);
        if (operation === "appendRoot" && typeof value.containerPath === "string" && !["components", "toolbar", "leftPanel", "rightPanel"].includes(value.containerPath)) errors.push(`Root container “${value.containerPath}” is not supported.`);
    }
    return { valid: errors.length === 0, package: errors.length ? undefined : value as unknown as AiChangePackage, errors };
}
