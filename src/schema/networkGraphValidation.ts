import type { Diagnostic } from "./diagnostics";
import { visitSpecificationComponents } from "../catalog/componentTraversal";

const layouts = new Set(["force", "circular", "hierarchical", "hybrid"]);
const orientations = new Set(["horizontal", "vertical"]);
const booleanProperties = ["roam", "draggable", "directed", "showLabels", "showEdgeLabels"] as const;
const fieldProperties = [
    "sourceField", "targetField", "sourceLabelField", "targetLabelField",
    "sourceCategoryField", "targetCategoryField", "edgeLabelField", "edgeWeightField",
] as const;

function numeric(
    diagnostics: Diagnostic[],
    component: Record<string, unknown>,
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

        for (const property of fieldProperties) {
            const value = component[property];
            if (value !== undefined && (typeof value !== "string" || !value.trim())) diagnostics.push({
                code: "INVALID_PROPERTY_TYPE",
                severity: "error",
                path: `${visit.path}/${property}`,
                componentId,
                message: `${property} must be a nonblank field name.`,
                received: value,
            });
        }

        if (component.layout !== undefined && !layouts.has(String(component.layout))) diagnostics.push({
            code: "INVALID_ENUM_VALUE",
            severity: "error",
            path: `${visit.path}/layout`,
            componentId,
            message: `networkGraph layout must be force, circular, hierarchical, or hybrid.`,
            received: component.layout,
            suggestions: Array.from(layouts),
        });
        if (component.orientation !== undefined && !orientations.has(String(component.orientation))) diagnostics.push({
            code: "INVALID_ENUM_VALUE",
            severity: "error",
            path: `${visit.path}/orientation`,
            componentId,
            message: `networkGraph orientation must be horizontal or vertical.`,
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
        numeric(diagnostics, component, visit.path, "edgeCurveness", 0, 0.5);
        numeric(diagnostics, component, visit.path, "arrowSize", 2, 16);
        numeric(diagnostics, component, visit.path, "maxNodes", 2, 5000, true);
    });
    return diagnostics;
}
