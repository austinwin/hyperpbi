import { visitSpecificationComponents } from "../catalog/componentTraversal";
import { isScene3dColor, isScene3dKey, scene3dKinds, scene3dLimits } from "./scene3dSchema";
import type { Diagnostic } from "./diagnostics";

type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0 && value.length <= 160;
const inRange = (value: unknown, min: number, max: number) => typeof value === "number" && value >= min && value <= max;
const objectKeys = new Set(["id", "kind", "label", "dataKey", "flowKey", "position", "size", "rotation", "color", "metalness", "roughness", "opacity", "visible", "selectable", "model"]);

export function validateScene3dComponents(specification: unknown): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    let sceneCount = 0;
    visitSpecificationComponents(specification, ({ component, path }) => {
        if (component.type !== "scene3d") return;
        const componentId = typeof component.id === "string" ? component.id : undefined;
        const error = (property: string, message: string, code: Diagnostic["code"] = "INVALID_PROPERTY_TYPE") => {
            diagnostics.push({ code, severity: "error", path: `${path}/${property}`, componentId, message });
        };
        if (++sceneCount > scene3dLimits.scenes) {
            error("type", `A dashboard can contain up to ${scene3dLimits.scenes} 3D scenes.`);
            return;
        }
        for (const key of ["objectIdField", "statusField", "colorField", "visibleField", "levelField", "flowField"]) {
            if (component[key] !== undefined && !text(component[key])) error(key, "Choose a field name.");
        }
        for (const key of ["hideUnmatched", "showLabels", "showObjectList", "shadows", "grid", "frameless"]) {
            if (component[key] !== undefined && typeof component[key] !== "boolean") error(key, "Expected a Boolean.");
        }
        for (const [key, values] of [["view", ["isometric", "top"]], ["theme", ["auto", "light", "dark"]]] as const) {
            if (component[key] !== undefined && !(values as readonly unknown[]).includes(component[key])) error(key, `Choose ${values.join(", ")}.`, "INVALID_ENUM_VALUE");
        }
        if (component.height !== undefined && !inRange(component.height, 180, 1200)) error("height", "Height must be from 180 to 1200 pixels.");
        const tooltip = (value: unknown) => text(value) || object(value) && text(value.field) &&
            (value.label === undefined || text(value.label)) && Object.keys(value).every(key => key === "field" || key === "label");
        if (component.tooltipFields !== undefined &&
            (!Array.isArray(component.tooltipFields) || component.tooltipFields.length > scene3dLimits.tooltipFields || !component.tooltipFields.every(tooltip))) {
            error("tooltipFields", `Choose up to ${scene3dLimits.tooltipFields} fields with optional display labels.`);
        }
        if (component.statusColors !== undefined) {
            if (!Array.isArray(component.statusColors) || component.statusColors.length > scene3dLimits.statusColors) {
                error("statusColors", `Use up to ${scene3dLimits.statusColors} status colors.`);
            } else {
                const values = new Set<unknown>();
                component.statusColors.forEach((rule, index) => {
                    if (!object(rule) || Object.keys(rule).length !== 2 || !isScene3dKey(rule.value) || !isScene3dColor(rule.color) || values.has(rule.value)) {
                        error(`statusColors/${index}`, "Each status color needs a unique primitive value and a six-digit hex color.");
                    } else values.add(rule.value);
                });
            }
        }
        if (!Array.isArray(component.objects) || component.objects.length > scene3dLimits.objects) {
            error("objects", `Use an array of up to ${scene3dLimits.objects} objects.`);
            return;
        }
        const ids = new Set<unknown>();
        let models = 0;
        component.objects.forEach((item, index) => {
            const base = `objects/${index}`;
            if (!object(item)) { error(base, "Expected a scene object."); return; }
            for (const key of Object.keys(item)) {
                if (!objectKeys.has(key)) error(`${base}/${key.replaceAll("~", "~0").replaceAll("/", "~1")}`, "Unsupported scene object property.", "UNKNOWN_PROPERTY");
            }
            if (typeof item.id !== "string" || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(item.id) || ids.has(item.id)) {
                error(`${base}/id`, "Use a unique object id starting with a letter, with up to 64 letters, digits, underscores or hyphens.");
            }
            ids.add(item.id);
            if (!(scene3dKinds as readonly unknown[]).includes(item.kind)) error(`${base}/kind`, `Choose ${scene3dKinds.join(", ")}.`, "INVALID_ENUM_VALUE");
            if (item.label !== undefined && !text(item.label)) error(`${base}/label`, "Use a nonblank label of up to 160 characters.");
            if (item.dataKey !== undefined && (!isScene3dKey(item.dataKey) || !text(component.objectIdField))) error(`${base}/dataKey`, "Bind a string, number, or Boolean to the scene's object key field.");
            if (item.flowKey !== undefined && (item.kind !== "pipe" || !isScene3dKey(item.flowKey) || !text(component.objectIdField))) {
                error(`${base}/flowKey`, "A pipe flow key must be a string, number, or Boolean matched against the scene's object key field.");
            }
            for (const [key, min, max] of [["position", -100, 100], ["size", 0.02, 100], ["rotation", -360, 360]] as const) {
                const value = item[key];
                if (value !== undefined && (!Array.isArray(value) || value.length !== 3 || !value.every(part => inRange(part, min, max)))) {
                    error(`${base}/${key}`, `Use three numbers from ${min} to ${max}.`);
                }
            }
            for (const [key, min] of [["metalness", 0], ["roughness", 0], ["opacity", 0.1]] as const) {
                if (item[key] !== undefined && !inRange(item[key], min, 1)) error(`${base}/${key}`, `Use a number from ${min} to 1.`);
            }
            for (const key of ["visible", "selectable"]) {
                if (item[key] !== undefined && typeof item[key] !== "boolean") error(`${base}/${key}`, "Expected a Boolean.");
            }
            if (item.color !== undefined && !isScene3dColor(item.color)) error(`${base}/color`, "Use a six-digit hex color such as #168b79.");
            if (item.kind === "model") {
                if (++models > scene3dLimits.models) error(`${base}/kind`, `Use up to ${scene3dLimits.models} models per scene.`);
                const model = item.model;
                if (!object(model) || Object.keys(model).length !== 2 || !["glb", "gltf"].includes(String(model.format)) ||
                    typeof model.data !== "string" || model.data.length < 4 || model.data.length > scene3dLimits.modelBytes / 3 * 4 ||
                    model.data.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(model.data)) {
                    error(`${base}/model`, "Import a self-contained GLB or glTF file of up to 768 KiB.");
                }
            } else if (item.model !== undefined) error(`${base}/model`, "Model data requires the model object kind.");
        });
    });
    return diagnostics;
}
