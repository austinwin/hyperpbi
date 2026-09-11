import { visitSpecificationComponents } from "../catalog/componentTraversal";
import { closestMatches, type Diagnostic } from "./diagnostics";
import { MERMAID_SOURCE_MAX_LENGTH } from "./mermaidDiagramSchema";

type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const themes = new Set(["auto", "default", "neutral", "dark", "forest", "base"]);
const fits = new Set(["contain", "width", "none"]);
const bindingKeys = new Set(["nodeId", "field", "value", "label", "interaction"]);
const interactionKeys = new Set(["enabled", "trigger", "internalMode", "internalScope", "externalMode", "field", "fieldSource", "operator", "value", "selectionMode", "multiSelect", "showSelector", "clearOnSecondClick", "target", "targets"]);

export function validateMermaidDiagramComponents(specification: unknown): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    visitSpecificationComponents(specification, visit => {
        if (visit.component.type !== "mermaidDiagram") return;
        const component = visit.component;
        const componentId = typeof component.id === "string" ? component.id : undefined;
        const sourcePath = `${visit.path}/source`;
        if (typeof component.source !== "string" || !component.source.trim()) diagnostics.push({ code: "MISSING_REQUIRED_PROPERTY", severity: "error", path: sourcePath, componentId, message: "mermaidDiagram source must be a nonblank string.", received: component.source });
        else if (component.source.length > MERMAID_SOURCE_MAX_LENGTH) diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: sourcePath, componentId, message: `Mermaid source cannot exceed ${MERMAID_SOURCE_MAX_LENGTH.toLocaleString()} characters.`, received: component.source.length });
        for (const [property, values] of [["theme", themes], ["fit", fits]] as const) if (component[property] !== undefined && !values.has(String(component[property]))) diagnostics.push({ code: "INVALID_ENUM_VALUE", severity: "error", path: `${visit.path}/${property}`, componentId, message: `mermaidDiagram ${property} is not supported.`, received: component[property], suggestions: closestMatches(String(component[property]), values) });
        for (const property of ["panZoom", "frameless"] as const) if (component[property] !== undefined && typeof component[property] !== "boolean") diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${visit.path}/${property}`, componentId, message: `${property} must be a boolean.`, received: component[property] });
        if (component.nodeBindings !== undefined && !Array.isArray(component.nodeBindings)) diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${visit.path}/nodeBindings`, componentId, message: "nodeBindings must be an array.", received: component.nodeBindings });
        else if (Array.isArray(component.nodeBindings)) {
            const ids = new Set<string>();
            component.nodeBindings.forEach((raw, index) => {
                const path = `${visit.path}/nodeBindings/${index}`;
                if (!object(raw)) { diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path, componentId, message: "Each Mermaid node binding must be an object.", received: raw }); return; }
                for (const key of Object.keys(raw)) if (!bindingKeys.has(key)) diagnostics.push({ code: "UNKNOWN_PROPERTY", severity: "error", path: `${path}/${key}`, componentId, message: `Mermaid node binding property “${key}” is not supported.`, received: key, suggestions: closestMatches(key, bindingKeys) });
                for (const property of ["nodeId", "field"] as const) if (typeof raw[property] !== "string" || !raw[property].trim()) diagnostics.push({ code: "MISSING_REQUIRED_PROPERTY", severity: "error", path: `${path}/${property}`, componentId, message: `${property} must be a nonblank string.`, received: raw[property] });
                if (typeof raw.nodeId === "string") { if (!/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(raw.nodeId)) diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${path}/nodeId`, componentId, message: "Mermaid nodeId must start with a letter and contain only letters, digits, _ or -.", received: raw.nodeId }); if (ids.has(raw.nodeId)) diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${path}/nodeId`, componentId, message: `Mermaid nodeId “${raw.nodeId}” is duplicated.`, received: raw.nodeId }); ids.add(raw.nodeId); }
                if (raw.label !== undefined && (typeof raw.label !== "string" || !raw.label.trim())) diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${path}/label`, componentId, message: "Binding label must be a nonblank string.", received: raw.label });
                if (raw.value !== undefined && raw.value !== null && !["string", "number", "boolean"].includes(typeof raw.value)) diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: `${path}/value`, componentId, message: "Binding value must be a primitive.", received: raw.value });
                if (raw.interaction !== undefined && !object(raw.interaction)) diagnostics.push({ code: "INVALID_INTERACTION", severity: "error", path: `${path}/interaction`, componentId, message: "Binding interaction must be an object.", received: raw.interaction });
                else if (object(raw.interaction)) {
                    for (const key of Object.keys(raw.interaction)) if (!interactionKeys.has(key)) diagnostics.push({ code: "INVALID_INTERACTION", severity: "error", path: `${path}/interaction/${key}`, componentId, message: `Binding interaction property “${key}” is not supported.`, received: key, suggestions: closestMatches(key, interactionKeys) });
                    const enums: Record<string, string[]> = { trigger: ["auto", "click", "change"], internalMode: ["none", "highlight", "filter"], internalScope: ["self", "others", "all"], externalMode: ["none", "auto", "selection", "filter"], selectionMode: ["replace", "toggle", "add"], fieldSource: ["powerbi", "service", "joined"], operator: ["=", "!=", ">", ">=", "<", "<=", "contains", "in", "between"] };
                    for (const [property, values] of Object.entries(enums)) if (raw.interaction[property] !== undefined && !values.includes(String(raw.interaction[property]))) diagnostics.push({ code: "INVALID_ENUM_VALUE", severity: "error", path: `${path}/interaction/${property}`, componentId, message: `Binding interaction ${property} is not supported.`, received: raw.interaction[property], suggestions: closestMatches(String(raw.interaction[property]), values) });
                    for (const property of ["enabled", "multiSelect", "showSelector", "clearOnSecondClick"] as const) if (raw.interaction[property] !== undefined && typeof raw.interaction[property] !== "boolean") diagnostics.push({ code: "INVALID_INTERACTION", severity: "error", path: `${path}/interaction/${property}`, componentId, message: `Binding interaction ${property} must be a boolean.`, received: raw.interaction[property] });
                }
            });
        }
    });
    return diagnostics;
}
