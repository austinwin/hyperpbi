import { visitSpecificationComponents } from "../catalog/componentTraversal";
import { closestMatches, type Diagnostic } from "./diagnostics";

type Json = Record<string, unknown>;

const layouts = new Set(["force", "circular", "hierarchical", "hybrid"]);
const orientations = new Set(["horizontal", "vertical"]);
const booleanProperties = ["roam", "draggable", "directed", "showLabels"] as const;
const entityKeys = new Set(["id", "label", "field", "labelField"]);
const relationshipKeys = new Set(["source", "target", "branchLabel"]);
const entityIdPattern = /^[A-Za-z][A-Za-z0-9_-]*$/;

const object = (value: unknown): value is Json =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);

function unknownKeys(
    value: Json,
    allowed: Set<string>,
    path: string,
    componentId: string | undefined,
    diagnostics: Diagnostic[],
): void {
    for (const key of Object.keys(value)) {
        if (allowed.has(key)) continue;
        diagnostics.push({
            code: "UNKNOWN_PROPERTY",
            severity: "error",
            path: `${path}/${key}`,
            componentId,
            message: `networkGraph property “${key}” is not supported at ${path}.`,
            received: key,
            suggestions: closestMatches(key, allowed),
        });
    }
}

function requiredString(
    value: Json,
    property: string,
    path: string,
    componentId: string | undefined,
    diagnostics: Diagnostic[],
): string | undefined {
    const received = value[property];
    if (received === undefined) {
        diagnostics.push({
            code: "MISSING_REQUIRED_PROPERTY",
            severity: "error",
            path: `${path}/${property}`,
            componentId,
            message: `${property} is required.`,
        });
        return undefined;
    }
    if (typeof received !== "string" || !received.trim()) {
        diagnostics.push({
            code: "INVALID_PROPERTY_TYPE",
            severity: "error",
            path: `${path}/${property}`,
            componentId,
            message: `${property} must be a nonblank string.`,
            received,
        });
        return undefined;
    }
    return received.trim();
}

function optionalString(
    value: Json,
    property: string,
    path: string,
    componentId: string | undefined,
    diagnostics: Diagnostic[],
): void {
    const received = value[property];
    if (received !== undefined && (typeof received !== "string" || !received.trim())) {
        diagnostics.push({
            code: "INVALID_PROPERTY_TYPE",
            severity: "error",
            path: `${path}/${property}`,
            componentId,
            message: `${property} must be a nonblank string when supplied.`,
            received,
        });
    }
}

function numeric(
    diagnostics: Diagnostic[],
    component: Json,
    path: string,
    property: string,
    minimum: number,
    maximum: number,
    integer = false,
): void {
    const value = component[property];
    if (value === undefined) return;
    if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum || integer && !Number.isInteger(value)) {
        diagnostics.push({
            code: "INVALID_PROPERTY_TYPE",
            severity: "error",
            path: `${path}/${property}`,
            componentId: typeof component.id === "string" ? component.id : undefined,
            message: `${property} must be ${integer ? "an integer" : "a number"} from ${minimum} through ${maximum}.`,
            received: value,
        });
    }
}

export function validateNetworkGraphComponents(specification: unknown): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    visitSpecificationComponents(specification, visit => {
        if (visit.component.type !== "networkGraph") return;
        const component = visit.component;
        const componentId = typeof component.id === "string" ? component.id : undefined;
        const entityIds = new Set<string>();

        if (component.entities !== undefined && !Array.isArray(component.entities)) {
            diagnostics.push({
                code: "INVALID_PROPERTY_TYPE",
                severity: "error",
                path: `${visit.path}/entities`,
                componentId,
                message: "networkGraph entities must be an array.",
                received: component.entities,
            });
        } else if (Array.isArray(component.entities)) {
            if (component.entities.length < 2) {
                diagnostics.push({
                    code: "INVALID_PROPERTY_TYPE",
                    severity: "error",
                    path: `${visit.path}/entities`,
                    componentId,
                    message: "networkGraph requires at least two entity definitions.",
                    received: component.entities,
                });
            }

            component.entities.forEach((rawEntity, index) => {
                const path = `${visit.path}/entities/${index}`;
                if (!object(rawEntity)) {
                    diagnostics.push({
                        code: "INVALID_PROPERTY_TYPE",
                        severity: "error",
                        path,
                        componentId,
                        message: "Each networkGraph entity must be an object.",
                        received: rawEntity,
                    });
                    return;
                }

                unknownKeys(rawEntity, entityKeys, path, componentId, diagnostics);
                const id = requiredString(rawEntity, "id", path, componentId, diagnostics);
                requiredString(rawEntity, "field", path, componentId, diagnostics);
                optionalString(rawEntity, "label", path, componentId, diagnostics);
                optionalString(rawEntity, "labelField", path, componentId, diagnostics);

                if (!id) return;
                if (!entityIdPattern.test(id)) {
                    diagnostics.push({
                        code: "INVALID_PROPERTY_TYPE",
                        severity: "error",
                        path: `${path}/id`,
                        componentId,
                        message: "Entity id must start with a letter and contain only letters, numbers, underscores, or hyphens.",
                        received: id,
                    });
                }
                if (entityIds.has(id)) {
                    diagnostics.push({
                        code: "INVALID_PROPERTY_TYPE",
                        severity: "error",
                        path: `${path}/id`,
                        componentId,
                        message: `Entity id “${id}” is duplicated.`,
                        received: id,
                    });
                }
                entityIds.add(id);
            });
        }

        if (component.relationships !== undefined && !Array.isArray(component.relationships)) {
            diagnostics.push({
                code: "INVALID_PROPERTY_TYPE",
                severity: "error",
                path: `${visit.path}/relationships`,
                componentId,
                message: "networkGraph relationships must be an array.",
                received: component.relationships,
            });
        } else if (Array.isArray(component.relationships)) {
            if (component.relationships.length < 1) {
                diagnostics.push({
                    code: "INVALID_PROPERTY_TYPE",
                    severity: "error",
                    path: `${visit.path}/relationships`,
                    componentId,
                    message: "networkGraph requires at least one relationship definition.",
                    received: component.relationships,
                });
            }

            component.relationships.forEach((rawRelationship, index) => {
                const path = `${visit.path}/relationships/${index}`;
                if (!object(rawRelationship)) {
                    diagnostics.push({
                        code: "INVALID_PROPERTY_TYPE",
                        severity: "error",
                        path,
                        componentId,
                        message: "Each networkGraph relationship must be an object.",
                        received: rawRelationship,
                    });
                    return;
                }

                unknownKeys(rawRelationship, relationshipKeys, path, componentId, diagnostics);
                const source = requiredString(rawRelationship, "source", path, componentId, diagnostics);
                const target = requiredString(rawRelationship, "target", path, componentId, diagnostics);
                optionalString(rawRelationship, "branchLabel", path, componentId, diagnostics);

                for (const [property, entityId] of [["source", source], ["target", target]] as const) {
                    if (!entityId || !entityIds.size || entityIds.has(entityId)) continue;
                    diagnostics.push({
                        code: "INVALID_ENUM_VALUE",
                        severity: "error",
                        path: `${path}/${property}`,
                        componentId,
                        message: `${property} must reference a declared entity id.`,
                        received: entityId,
                        suggestions: closestMatches(entityId, entityIds),
                    });
                }
            });
        }

        if (component.layout !== undefined && !layouts.has(String(component.layout))) diagnostics.push({
            code: "INVALID_ENUM_VALUE",
            severity: "error",
            path: `${visit.path}/layout`,
            componentId,
            message: "networkGraph layout must be force, circular, hierarchical, or hybrid.",
            received: component.layout,
            suggestions: Array.from(layouts),
        });
        if (component.orientation !== undefined && !orientations.has(String(component.orientation))) diagnostics.push({
            code: "INVALID_ENUM_VALUE",
            severity: "error",
            path: `${visit.path}/orientation`,
            componentId,
            message: "networkGraph orientation must be horizontal or vertical.",
            received: component.orientation,
            suggestions: Array.from(orientations),
        });

        for (const property of booleanProperties) {
            if (component[property] !== undefined && typeof component[property] !== "boolean") diagnostics.push({
                code: "INVALID_PROPERTY_TYPE",
                severity: "error",
                path: `${visit.path}/${property}`,
                componentId,
                message: `${property} must be a boolean.`,
                received: component[property],
            });
        }

        numeric(diagnostics, component, visit.path, "nodeSize", 8, 80);
        numeric(diagnostics, component, visit.path, "repulsion", 20, 5000);
        numeric(diagnostics, component, visit.path, "edgeLength", 20, 600);
        numeric(diagnostics, component, visit.path, "gravity", 0, 1);
        numeric(diagnostics, component, visit.path, "levelGap", 80, 400);
        numeric(diagnostics, component, visit.path, "nodeGap", 24, 180);
        numeric(diagnostics, component, visit.path, "edgeWidth", 0.5, 6);
        numeric(diagnostics, component, visit.path, "edgeOpacity", 0.1, 1);
        numeric(diagnostics, component, visit.path, "edgeCurvature", 0, 0.5);
        numeric(diagnostics, component, visit.path, "arrowSize", 2, 16);
        numeric(diagnostics, component, visit.path, "maxNodes", 2, 5000, true);
    });

    return diagnostics;
}
