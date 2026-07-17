import type { Diagnostic } from "./diagnostics";

type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const nonblank = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function issue(diagnostics: Diagnostic[], path: string, componentId: string | undefined, message: string, received?: unknown, code: Diagnostic["code"] = "INVALID_PROPERTY_TYPE"): void {
    diagnostics.push({ code, severity: "error", path, componentId, message, received });
}

function unknownKeys(value: Json, allowed: readonly string[], path: string, componentId: string | undefined, diagnostics: Diagnostic[]): void {
    const keys = new Set(allowed);
    for (const key of Object.keys(value)) if (!keys.has(key)) issue(diagnostics, `${path}/${key}`, componentId, `Property “${key}” is not supported here.`, key, "UNKNOWN_PROPERTY");
}

function numericArray(value: unknown, path: string, componentId: string | undefined, diagnostics: Diagnostic[], expectedLength?: number): void {
    if (!Array.isArray(value) || value.some(item => typeof item !== "number" || !Number.isFinite(item) || item < 0)) {
        issue(diagnostics, path, componentId, "Expected an array of finite nonnegative numbers.", value);
        return;
    }
    if (expectedLength !== undefined && value.length !== expectedLength) issue(diagnostics, path, componentId, `Expected ${expectedLength} pane values to match children.`, value);
}

const interactionKeys = ["enabled", "trigger", "internalMode", "internalScope", "externalMode", "field", "fieldSource", "operator", "value", "selectionMode", "multiSelect", "showSelector", "clearOnSecondClick", "target", "targets"] as const;
function validateInteraction(value: unknown, path: string, componentId: string | undefined, diagnostics: Diagnostic[]): void {
    if (!object(value)) { issue(diagnostics, path, componentId, "Interaction must be an object.", value, "INVALID_INTERACTION"); return; }
    unknownKeys(value, interactionKeys, path, componentId, diagnostics);
    for (const property of ["enabled", "multiSelect", "showSelector", "clearOnSecondClick"])
        if (value[property] !== undefined && typeof value[property] !== "boolean") issue(diagnostics, `${path}/${property}`, componentId, `${property} must be a boolean.`, value[property], "INVALID_INTERACTION");
    const enums: Record<string, string[]> = {
        trigger: ["auto", "click", "change"], internalMode: ["none", "highlight", "filter"], internalScope: ["self", "others", "all"],
        externalMode: ["none", "auto", "selection", "filter"], fieldSource: ["powerbi", "service", "joined"],
        operator: ["=", "!=", ">", ">=", "<", "<=", "contains", "in", "between"], selectionMode: ["replace", "toggle", "add"],
    };
    for (const [property, values] of Object.entries(enums)) if (value[property] !== undefined && !values.includes(String(value[property]))) issue(diagnostics, `${path}/${property}`, componentId, `${property} has an unsupported value.`, value[property], "INVALID_ENUM_VALUE");
    for (const property of ["field", "target"]) if (value[property] !== undefined && !nonblank(value[property])) issue(diagnostics, `${path}/${property}`, componentId, `${property} must be a nonblank string.`, value[property], "INVALID_INTERACTION");
    if (value.targets !== undefined && (!Array.isArray(value.targets) || value.targets.some(target => !nonblank(target)))) issue(diagnostics, `${path}/targets`, componentId, "targets must contain nonblank component IDs.", value.targets, "INVALID_INTERACTION");
}

export function validateApplicationComponentSchema(
    component: Json,
    path: string,
    componentId: string | undefined,
    datasetNames: ReadonlySet<string>,
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    if (component.order !== undefined && (!Number.isInteger(component.order) || !Number.isFinite(component.order))) issue(diagnostics, `${path}/order`, componentId, "Order must be a finite integer.", component.order);
    if (component.heightMode !== undefined && !["auto", "fixed", "fill", "aspectRatio"].includes(String(component.heightMode))) issue(diagnostics, `${path}/heightMode`, componentId, "Height mode must be auto, fixed, fill, or aspectRatio.", component.heightMode, "INVALID_ENUM_VALUE");
    if (component.minHeight !== undefined && (typeof component.minHeight !== "number" || !Number.isFinite(component.minHeight) || component.minHeight < 0)) issue(diagnostics, `${path}/minHeight`, componentId, "Minimum height must be a finite nonnegative number.", component.minHeight);
    if (component.aspectRatio !== undefined && (typeof component.aspectRatio !== "number" || !Number.isFinite(component.aspectRatio) || component.aspectRatio <= 0)) issue(diagnostics, `${path}/aspectRatio`, componentId, "Aspect ratio must be a finite positive number.", component.aspectRatio);

    if (component.responsive !== undefined) {
        if (!object(component.responsive)) issue(diagnostics, `${path}/responsive`, componentId, "Responsive overrides must be an object.", component.responsive);
        else {
            unknownKeys(component.responsive, ["xs", "sm", "md", "lg", "xl"], `${path}/responsive`, componentId, diagnostics);
            for (const [breakpoint, raw] of Object.entries(component.responsive)) {
                const rulePath = `${path}/responsive/${breakpoint}`;
                if (!object(raw)) { issue(diagnostics, rulePath, componentId, "A responsive breakpoint must be an object.", raw); continue; }
                unknownKeys(raw, ["span", "order", "visible", "hidden", "direction", "stack", "columns"], rulePath, componentId, diagnostics);
                if (raw.span !== undefined && (!Number.isInteger(raw.span) || Number(raw.span) < 1 || Number(raw.span) > 12)) issue(diagnostics, `${rulePath}/span`, componentId, "Responsive span must be an integer from 1 through 12.", raw.span);
                if (raw.order !== undefined && !Number.isInteger(raw.order)) issue(diagnostics, `${rulePath}/order`, componentId, "Responsive order must be an integer.", raw.order);
                for (const property of ["visible", "hidden", "stack"]) if (raw[property] !== undefined && typeof raw[property] !== "boolean") issue(diagnostics, `${rulePath}/${property}`, componentId, `${property} must be a boolean.`, raw[property]);
                if (raw.visible !== undefined && raw.hidden !== undefined) issue(diagnostics, rulePath, componentId, "Use either visible or hidden at one breakpoint, not both.", raw);
                if (raw.direction !== undefined && !["row", "column"].includes(String(raw.direction))) issue(diagnostics, `${rulePath}/direction`, componentId, "Direction must be row or column.", raw.direction, "INVALID_ENUM_VALUE");
                if (raw.columns !== undefined && (!Number.isInteger(raw.columns) || Number(raw.columns) < 1 || Number(raw.columns) > 24)) issue(diagnostics, `${rulePath}/columns`, componentId, "Responsive columns must be an integer from 1 through 24.", raw.columns);
            }
        }
    }

    if (component.type === "split") {
        const childCount = Array.isArray(component.children) ? component.children.length : 0;
        if (component.resizable === true && childCount < 2) issue(diagnostics, `${path}/children`, componentId, "A resizable split requires at least two children.", component.children);
        for (const property of ["sizes", "minSizes", "maxSizes"]) if (component[property] !== undefined) numericArray(component[property], `${path}/${property}`, componentId, diagnostics, childCount);
        if (Array.isArray(component.sizes) && component.sizes.some(value => typeof value === "number" && value <= 0)) issue(diagnostics, `${path}/sizes`, componentId, "Initial pane sizes must be positive.", component.sizes);
        for (const property of ["minSizes", "maxSizes"]) if (Array.isArray(component[property]) && component[property].some(value => typeof value === "number" && value > 100)) issue(diagnostics, `${path}/${property}`, componentId, "Pane constraints cannot exceed 100 percent.", component[property]);
        if (Array.isArray(component.maxSizes) && component.maxSizes.some(value => typeof value === "number" && value <= 0)) issue(diagnostics, `${path}/maxSizes`, componentId, "Maximum pane sizes must be positive.", component.maxSizes);
        if (Array.isArray(component.minSizes) && component.minSizes.reduce((sum, value) => sum + Number(value), 0) > 100) issue(diagnostics, `${path}/minSizes`, componentId, "Minimum pane sizes cannot total more than 100 percent.", component.minSizes);
        if (Array.isArray(component.maxSizes) && component.maxSizes.reduce((sum, value) => sum + Number(value), 0) < 100) issue(diagnostics, `${path}/maxSizes`, componentId, "Maximum pane sizes must total at least 100 percent.", component.maxSizes);
        if (Array.isArray(component.minSizes) && Array.isArray(component.maxSizes)) {
            const maximums = component.maxSizes as unknown[];
            component.minSizes.forEach((minimum, index) => { if (typeof minimum === "number" && typeof maximums[index] === "number" && minimum > maximums[index]) issue(diagnostics, `${path}/minSizes/${index}`, componentId, "Pane minimum cannot exceed its maximum.", minimum); });
        }
        if (component.resizable !== undefined && typeof component.resizable !== "boolean") issue(diagnostics, `${path}/resizable`, componentId, "Resizable must be a boolean.", component.resizable);
        if (component.persist !== undefined && !["none", "session", "local"].includes(String(component.persist))) issue(diagnostics, `${path}/persist`, componentId, "Split persistence must be none, session, or local.", component.persist, "INVALID_ENUM_VALUE");
        if (component.storageKey !== undefined && !nonblank(component.storageKey)) issue(diagnostics, `${path}/storageKey`, componentId, "Split storageKey must be a nonblank string.", component.storageKey);
    }

    if (component.type === "table" && component.export !== undefined) {
        if (!object(component.export)) issue(diagnostics, `${path}/export`, componentId, "Table export must be an object.", component.export);
        else {
            unknownKeys(component.export, ["enabled", "formats", "scope", "fileName"], `${path}/export`, componentId, diagnostics);
            if (component.export.enabled !== undefined && typeof component.export.enabled !== "boolean") issue(diagnostics, `${path}/export/enabled`, componentId, "Export enabled must be a boolean.", component.export.enabled);
            if (component.export.formats !== undefined && (!Array.isArray(component.export.formats) || component.export.formats.some(item => !["csv", "xlsx"].includes(String(item))))) issue(diagnostics, `${path}/export/formats`, componentId, "Export formats may contain csv and xlsx only.", component.export.formats);
            if (component.export.scope !== undefined && !["filtered", "selected", "selectedOrFiltered"].includes(String(component.export.scope))) issue(diagnostics, `${path}/export/scope`, componentId, "Export scope must be filtered, selected, or selectedOrFiltered.", component.export.scope, "INVALID_ENUM_VALUE");
            if (component.export.fileName !== undefined && !nonblank(component.export.fileName)) issue(diagnostics, `${path}/export/fileName`, componentId, "Export fileName must be nonblank.", component.export.fileName);
        }
    }
    if (component.type === "table" && component.virtualization !== undefined) {
        if (!object(component.virtualization)) issue(diagnostics, `${path}/virtualization`, componentId, "Table virtualization must be an object.", component.virtualization);
        else {
            unknownKeys(component.virtualization, ["enabled", "threshold", "rowHeight", "overscan"], `${path}/virtualization`, componentId, diagnostics);
            if (component.virtualization.enabled !== undefined && typeof component.virtualization.enabled !== "boolean") issue(diagnostics, `${path}/virtualization/enabled`, componentId, "Virtualization enabled must be a boolean.", component.virtualization.enabled);
            for (const property of ["threshold", "rowHeight", "overscan"]) if (component.virtualization[property] !== undefined && (!Number.isInteger(component.virtualization[property]) || Number(component.virtualization[property]) < 1)) issue(diagnostics, `${path}/virtualization/${property}`, componentId, `${property} must be a positive integer.`, component.virtualization[property]);
            if (typeof component.virtualization.rowHeight === "number" && (component.virtualization.rowHeight < 22 || component.virtualization.rowHeight > 80)) issue(diagnostics, `${path}/virtualization/rowHeight`, componentId, "rowHeight must be from 22 through 80 pixels.", component.virtualization.rowHeight);
            if (typeof component.virtualization.threshold === "number" && component.virtualization.threshold > 5000) issue(diagnostics, `${path}/virtualization/threshold`, componentId, "threshold cannot exceed the 5,000-row non-virtual DOM safety limit.", component.virtualization.threshold);
            if (typeof component.virtualization.overscan === "number" && component.virtualization.overscan > 100) issue(diagnostics, `${path}/virtualization/overscan`, componentId, "overscan cannot exceed 100 rows.", component.virtualization.overscan);
        }
    }

    if (component.events !== undefined) {
        if (!object(component.events)) issue(diagnostics, `${path}/events`, componentId, "Chart events must be an object.", component.events);
        else {
            unknownKeys(component.events, ["zoom", "rangeSelect", "brush"], `${path}/events`, componentId, diagnostics);
            for (const [eventName, raw] of Object.entries(component.events)) {
                const eventPath = `${path}/events/${eventName}`;
                if (!object(raw)) { issue(diagnostics, eventPath, componentId, "Chart event configuration must be an object.", raw); continue; }
                unknownKeys(raw, ["enabled", "interaction", "targets", "field"], eventPath, componentId, diagnostics);
                if (raw.enabled !== undefined && typeof raw.enabled !== "boolean") issue(diagnostics, `${eventPath}/enabled`, componentId, "Chart event enabled must be a boolean.", raw.enabled);
                if (raw.targets !== undefined && (!Array.isArray(raw.targets) || raw.targets.some(item => !nonblank(item)))) issue(diagnostics, `${eventPath}/targets`, componentId, "Chart event targets must be component IDs.", raw.targets);
                if (raw.field !== undefined && !nonblank(raw.field)) issue(diagnostics, `${eventPath}/field`, componentId, "Chart event field must be nonblank.", raw.field);
                if (raw.interaction !== undefined) validateInteraction(raw.interaction, `${eventPath}/interaction`, componentId, diagnostics);
            }
        }
    }

    if (component.drill !== undefined) {
        if (!object(component.drill)) issue(diagnostics, `${path}/drill`, componentId, "Chart drill must be an object.", component.drill);
        else {
            unknownKeys(component.drill, ["levels", "initialLevel", "trigger", "showBreadcrumbs"], `${path}/drill`, componentId, diagnostics);
            if (!Array.isArray(component.drill.levels) || component.drill.levels.length < 2) issue(diagnostics, `${path}/drill/levels`, componentId, "Chart drill requires at least two preloaded dataset levels.", component.drill.levels);
            else {
                const ids = new Set<string>();
                component.drill.levels.forEach((raw, index) => {
                    const levelPath = `${path}/drill/levels/${index}`;
                    if (!object(raw)) { issue(diagnostics, levelPath, componentId, "Drill level must be an object.", raw); return; }
                    unknownKeys(raw, ["id", "label", "dataset", "category", "measure", "x", "y", "pointSize", "parentField"], levelPath, componentId, diagnostics);
                    if (!nonblank(raw.id) || !/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(raw.id)) issue(diagnostics, `${levelPath}/id`, componentId, "Drill level ID must be stable and identifier-safe.", raw.id);
                    else if (ids.has(raw.id)) issue(diagnostics, `${levelPath}/id`, componentId, `Duplicate drill level ID “${raw.id}”.`, raw.id, "DUPLICATE_COMPONENT_ID"); else ids.add(raw.id);
                    if (!nonblank(raw.dataset)) issue(diagnostics, `${levelPath}/dataset`, componentId, "Drill level dataset is required.", raw.dataset, "MISSING_REQUIRED_PROPERTY");
                    else if (!datasetNames.has(raw.dataset)) issue(diagnostics, `${levelPath}/dataset`, componentId, `Drill dataset “${raw.dataset}” is not defined or powerbi.`, raw.dataset, "UNKNOWN_DATASET");
                    if (raw.label !== undefined && typeof raw.label !== "string") issue(diagnostics, `${levelPath}/label`, componentId, "Drill level label must be a string.", raw.label);
                    for (const property of ["category", "measure", "x", "y", "pointSize", "parentField"]) if (raw[property] !== undefined && !nonblank(raw[property])) issue(diagnostics, `${levelPath}/${property}`, componentId, `${property} must be a nonblank field name.`, raw[property]);
                });
                if (component.drill.initialLevel !== undefined && !ids.has(String(component.drill.initialLevel))) issue(diagnostics, `${path}/drill/initialLevel`, componentId, "initialLevel must reference one of the drill level IDs.", component.drill.initialLevel);
            }
            if (component.drill.trigger !== undefined && !["click", "doubleClick"].includes(String(component.drill.trigger))) issue(diagnostics, `${path}/drill/trigger`, componentId, "Drill trigger must be click or doubleClick.", component.drill.trigger, "INVALID_ENUM_VALUE");
            if (component.drill.showBreadcrumbs !== undefined && typeof component.drill.showBreadcrumbs !== "boolean") issue(diagnostics, `${path}/drill/showBreadcrumbs`, componentId, "showBreadcrumbs must be a boolean.", component.drill.showBreadcrumbs);
        }
    }
    return diagnostics;
}
