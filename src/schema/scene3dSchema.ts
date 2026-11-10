import type { ComponentBase } from "./hyperpbiSchema";

export const scene3dKinds = ["box", "cylinder", "sphere", "cone", "pipe", "pump", "tank", "model"] as const;
export type Scene3dKind = typeof scene3dKinds[number];
export type Scene3dVector = [number, number, number];
export type Scene3dKey = string | number | boolean;

export const scene3dLimits = {
    scenes: 8,
    objects: 80,
    models: 4,
    modelBytes: 768 * 1024,
    statusColors: 12,
    tooltipFields: 8,
} as const;

export interface Scene3dObject {
    id: string;
    kind: Scene3dKind;
    label?: string;
    dataKey?: Scene3dKey;
    position?: Scene3dVector;
    size?: Scene3dVector;
    /** Euler angles in degrees, in XYZ order. */
    rotation?: Scene3dVector;
    color?: string;
    metalness?: number;
    roughness?: number;
    opacity?: number;
    visible?: boolean;
    selectable?: boolean;
    /** Base64 bytes of a self-contained glTF 2.0 file. */
    model?: { format: "glb" | "gltf"; data: string };
}

export interface Scene3dComponent extends ComponentBase {
    type: "scene3d";
    objects: Scene3dObject[];
    objectIdField?: string;
    statusField?: string;
    statusColors?: Array<{ value: Scene3dKey; color: string }>;
    colorField?: string;
    visibleField?: string;
    tooltipFields?: Array<string | { field: string; label?: string }>;
    hideUnmatched?: boolean;
    showLabels?: boolean;
    showObjectList?: boolean;
    shadows?: boolean;
    grid?: boolean;
    view?: "isometric" | "top";
    theme?: "auto" | "light" | "dark";
    height?: number;
    frameless?: boolean;
}

export const isScene3dColor = (value: unknown): value is string => typeof value === "string" && /^#[a-f\d]{6}$/i.test(value);
export const isScene3dKey = (value: unknown): value is Scene3dKey =>
    typeof value === "string" && value.trim().length > 0 && value.length <= 160 ||
    typeof value === "number" && Number.isFinite(value) || typeof value === "boolean";
