import { visitSpecificationComponents } from "../catalog/componentTraversal";
import { isScene3dColor, isScene3dKey, scene3dAnimationKinds, scene3dKinds, scene3dLimits } from "./scene3dSchema";
import type { Diagnostic } from "./diagnostics";

type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0 && value.length <= 160;
const inRange = (value: unknown, min: number, max: number) => typeof value === "number" && value >= min && value <= max;
const objectKeys = new Set(["id", "kind", "label", "dataKey", "flowKey", "position", "size", "rotation", "color", "metalness", "roughness", "opacity", "visible", "selectable", "model", "animations"]);

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
        const binding = component.sceneBinding;
        if (binding !== undefined) {
            if (!object(binding) || binding.mode !== "data") error("sceneBinding", 'Scene binding must use mode "data".');
            else {
                for (const key of ["keyField", "sceneField", "selectedKeyState"]) {
                    if (!text(binding[key])) error(`sceneBinding/${key}`, "Enter a nonblank binding name.");
                }
                if (binding.dataset !== undefined && !text(binding.dataset)) error("sceneBinding/dataset", "Choose a logical dataset.");
                for (const key of Object.keys(binding)) if (!["mode", "dataset", "keyField", "sceneField", "selectedKeyState"].includes(key)) {
                    error("sceneBinding", "Unsupported scene binding property.", "UNKNOWN_PROPERTY");
                }
            }
        }
        if (component.height !== undefined && !inRange(component.height, 180, 1200)) error("height", "Height must be from 180 to 1200 pixels.");
        if (component.frameless !== undefined && typeof component.frameless !== "boolean") error("frameless", "Expected a Boolean.");
        validateScene3dDefinition(component, error, object(binding) && binding.mode === "data");
    });
    return diagnostics;
}

const fieldKeys = ["objectIdField", "statusField", "colorField", "visibleField", "levelField", "flowField"];
const booleanKeys = ["hideUnmatched", "showLabels", "showObjectList", "shadows", "grid"];
export const scene3dDefinitionKeys = new Set(["objects", "tooltipFields", "statusColors", "view", "theme", ...fieldKeys, ...booleanKeys]);

export function validateScene3dDefinition(
    component: Json,
    error: (property: string, message: string, code?: Diagnostic["code"]) => void,
    objectsOptional = false,
) {
    for (const key of fieldKeys) {
        if (component[key] !== undefined && !text(component[key])) error(key, "Choose a field name.");
    }
    for (const key of booleanKeys) {
        if (component[key] !== undefined && typeof component[key] !== "boolean") error(key, "Expected a Boolean.");
    }
    for (const [key, values] of [["view", ["isometric", "top"]], ["theme", ["auto", "light", "dark"]]] as const) {
        if (component[key] !== undefined && !(values as readonly unknown[]).includes(component[key])) error(key, `Choose ${values.join(", ")}.`, "INVALID_ENUM_VALUE");
    }
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
    if (objectsOptional && component.objects === undefined) return;
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
        if (item.animations !== undefined) {
            if (!Array.isArray(item.animations) || item.animations.length > scene3dLimits.animationsPerObject) {
                error(`${base}/animations`, `Use up to ${scene3dLimits.animationsPerObject} animations per object.`);
            } else item.animations.forEach((animation, motionIndex) => {
                const motionPath = `${base}/animations/${motionIndex}`;
                if (!object(animation)) { error(motionPath, "Expected an animation object."); return; }
                const allowed = new Set(["kind", "axis", "rpm", "rpmField", "amplitude", "period", "enabledField", "enabledValue", "clipName", "rate"]);
                for (const property of Object.keys(animation)) if (!allowed.has(property)) {
                    error(`${motionPath}/${property.replaceAll("~", "~0").replaceAll("/", "~1")}`, "Unsupported animation property.", "UNKNOWN_PROPERTY");
                }
                if (!(scene3dAnimationKinds as readonly unknown[]).includes(animation.kind)) {
                    error(`${motionPath}/kind`, "Unknown animation kind.", "INVALID_ENUM_VALUE");
                }
                if (animation.axis !== undefined && animation.axis !== "x" && animation.axis !== "y" && animation.axis !== "z") {
                    error(`${motionPath}/axis`, "Choose X, Y, or Z.", "INVALID_ENUM_VALUE");
                }
                if (animation.rpm !== undefined && !inRange(animation.rpm, -1800, 1800)) error(`${motionPath}/rpm`, "RPM must be from -1800 to 1800.");
                if (animation.amplitude !== undefined && !inRange(animation.amplitude, 0, 5)) error(`${motionPath}/amplitude`, "Amplitude must be from 0 to 5.");
                if (animation.period !== undefined && !inRange(animation.period, 0.15, 60)) error(`${motionPath}/period`, "Period must be from 0.15 to 60 seconds.");
                if (animation.rate !== undefined && !inRange(animation.rate, 0, 4)) error(`${motionPath}/rate`, "Clip playback rate must be from 0 to 4.");
                for (const field of ["rpmField", "enabledField"]) {
                    if (animation[field] !== undefined && (!text(animation[field]) || item.dataKey === undefined || !text(component.objectIdField))) {
                        error(`${motionPath}/${field}`, "Bind an animation field to a data-linked scene object.");
                    }
                }
                if (animation.enabledValue !== undefined && (!isScene3dKey(animation.enabledValue) || !text(animation.enabledField))) {
                    error(`${motionPath}/enabledValue`, "A matching value requires an enabled field.");
                }
                if (animation.clipName !== undefined && !text(animation.clipName)) error(`${motionPath}/clipName`, "Use a nonblank clip name.");
                if (animation.kind === "clip" && item.kind !== "model") error(`${motionPath}/kind`, "A glTF clip requires a model object.");
                if (animation.kind !== "clip" && (animation.clipName !== undefined || animation.rate !== undefined)) error(`${motionPath}/clipName`, "Clip controls require the clip animation kind.");
                if (animation.kind !== "rotate" && (animation.rpm !== undefined || animation.rpmField !== undefined)) error(`${motionPath}/rpm`, "RPM is supported only for rotation.");
            });
        }
        if (item.kind === "model") {
            if (++models > scene3dLimits.models) error(`${base}/kind`, `Use up to ${scene3dLimits.models} models per scene.`);
            const model = item.model;
            if (!object(model) || Object.keys(model).length !== 2 || model.format !== "glb" && model.format !== "gltf" ||
                typeof model.data !== "string" || model.data.length < 4 || model.data.length > scene3dLimits.modelBytes / 3 * 4 ||
                model.data.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(model.data)) {
                error(`${base}/model`, "Import a self-contained GLB or glTF file of up to 768 KiB.");
            }
        } else if (item.model !== undefined) error(`${base}/model`, "Model data requires the model object kind.");
    });
}
