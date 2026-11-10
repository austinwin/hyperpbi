import type { DataRow } from "../../data/normalizeData";
import type { Scene3dAnimation, Scene3dObject, Scene3dVector } from "../../schema/scene3dSchema";

export interface ActiveSceneMotion {
    animation: Scene3dAnimation;
    rpm: number;
}

/** Resolve motion against the same filtered, typed row used for object status and selection. */
export function resolveActiveSceneMotions(object: Scene3dObject, row?: DataRow): ActiveSceneMotion[] {
    return (object.animations ?? []).filter(animation => {
        if (!animation.enabledField) return true;
        if (!row) return false;
        const value = row[animation.enabledField];
        return animation.enabledValue !== undefined ? value === animation.enabledValue :
            value === true || typeof value === "number" && Number.isFinite(value) && value > 0;
    }).map(animation => {
        const value = animation.rpmField && row ? row[animation.rpmField] : undefined;
        const rpm = typeof value === "number" && Number.isFinite(value)
            ? Math.max(-1800, Math.min(1800, value))
            : animation.rpm ?? 60;
        return { animation, rpm };
    });
}

export function sceneMotionPose(object: Scene3dObject, motions: readonly ActiveSceneMotion[], elapsed: number) {
    const position: Scene3dVector = [...(object.position ?? [0, 0, 0])];
    const size: Scene3dVector = [...(object.size ?? [1, 1, 1])];
    const rotation: Scene3dVector = [...(object.rotation ?? [0, 0, 0])];
    let visible = true;
    for (const { animation, rpm } of motions) {
        const axis = animation.axis === "x" ? 0 : animation.axis === "z" ? 2 : 1;
        const period = animation.period ?? 2;
        const oscillation = Math.sin(elapsed * 2 * Math.PI / period);
        const amplitude = animation.amplitude ?? 0.2;
        switch (animation.kind) {
            case "rotate":
                rotation[axis] += (elapsed * rpm * 6) % 360;
                break;
            case "translate":
                position[axis] += amplitude * oscillation;
                break;
            case "scale":
                size[axis] *= Math.max(0.05, 1 + amplitude * oscillation);
                break;
            case "pulse": {
                const factor = Math.max(0.05, 1 + amplitude * oscillation);
                for (let i = 0; i < 3; i++) size[i] *= factor;
                break;
            }
            case "blink":
                visible = visible && Math.floor(elapsed * 2 / period) % 2 === 0;
                break;
            case "clip":
                // Imported animation clips are driven by the glTF AnimationMixer, not a parent transform.
                break;
        }
    }
    return { position, size, rotation, visible };
}
