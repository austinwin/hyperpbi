import type { ComponentBase } from "./hyperpbiSchema";

export const scene3dKinds = ["box", "cylinder", "sphere", "cone", "pipe", "pump", "tank", "fan", "well", "flowmeter", "valve", "injector", "analyzer", "model"] as const;
export type Scene3dKind = typeof scene3dKinds[number];
export type Scene3dVector = [number, number, number];
export type Scene3dKey = string | number | boolean;

export const scene3dAnimationKinds = ["rotate", "translate", "scale", "pulse", "blink", "clip"] as const;
export type Scene3dAnimationKind = typeof scene3dAnimationKinds[number];

/** Declarative, bounded equipment motion. No user-authored JavaScript is executed. */
export interface Scene3dAnimation {
    kind: Scene3dAnimationKind;
    axis?: "x" | "y" | "z";
    /** Rotation speed in revolutions per minute; negative values reverse direction. */
    rpm?: number;
    /** Numeric field on the object's matching data row, overriding rpm. */
    rpmField?: string;
    /** Translation in scene units or relative scale change for scale/pulse. */
    amplitude?: number;
    /** Oscillation or blink cycle duration in seconds. */
    period?: number;
    /** Animation plays only when the matching data value satisfies enabledValue or is true/positive. */
    enabledField?: string;
    enabledValue?: Scene3dKey;
    /** Optional imported glTF clip name; when omitted, play the first clip. */
    clipName?: string;
    /** glTF clip playback-rate multiplier. */
    rate?: number;
}

export const scene3dLimits = {
    scenes: 8,
    objects: 104,
    models: 4,
    animationsPerObject: 4,
    clipsPerModel: 4,
    modelBytes: 768 * 1024,
    statusColors: 12,
    tooltipFields: 8,
    pipePathPoints: 16,
} as const;

export interface Scene3dObject {
    id: string;
    kind: Scene3dKind;
    label?: string;
    dataKey?: Scene3dKey;
    /** Optional separate row key for pipe flow. */
    flowKey?: Scene3dKey;
    /** Pipe centerline in local scene units, ordered from upstream to downstream.
     * When defined, it replaces the default one-unit straight cylinder; flow is signed
     * along the polyline and pipe geometry uses connected straight segments. */
    path?: Scene3dVector[];
    /** Pipe outside diameter in scene units, used with path. */
    diameter?: number;
    /** Per-instrument numeric or text readout from this object's matching row. */
    valueField?: string;
    /** Engineering unit appended to an instrument readout (e.g. GPM, mg/L). */
    valueUnit?: string;
    /** 0–100% butterfly valve opening, data-bound on valve objects. */
    openingField?: string;
    /** Motor RPM. Animates the internal pump fan without rotating the entire pump. */
    motorRpmField?: string;
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
    animations?: Scene3dAnimation[];
}

export interface Scene3dComponent extends ComponentBase {
    type: "scene3d";
    objects: Scene3dObject[];
    objectIdField?: string;
    statusField?: string;
    statusColors?: Array<{ value: Scene3dKey; color: string }>;
    colorField?: string;
    visibleField?: string;
    /** A numeric field containing tank fill as 0–100 percent. */
    levelField?: string;
    /** A signed numeric field for pipe flow along the pipe's local Y axis. */
    flowField?: string;
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
