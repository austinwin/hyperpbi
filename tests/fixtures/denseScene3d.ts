import type { Scene3dDefinition, Scene3dObject } from "../../src/schema/scene3dSchema";

/** A compact 16 × 8 layout exercising primitives, equipment kits, and pickable labels. */
export function denseScene3d(count = 128): Scene3dDefinition {
    const kinds = ["box", "cylinder", "sphere", "cone", "pipe", "pump", "tank", "fan"] as const;
    const objects: Scene3dObject[] = Array.from({ length: count }, (_, index) => ({
        id: `asset${index + 1}`,
        kind: kinds[index % kinds.length],
        position: [(index % 16 - 7.5) * 1.7, 0.6, Math.floor(index / 16) * 2.2],
        size: [.65, .65, .65],
        color: index % 2 ? "#408ba8" : "#52ab95",
        label: `Asset ${index + 1} · "North" \\ Section`,
        selectable: true,
    }));
    return { objects, grid: true, shadows: false, showLabels: true, view: "top" };
}

export function nearPowerBiTextLimit() {
    const definition = denseScene3d();
    let remaining = 32_000 - JSON.stringify(definition).length;
    for (const object of definition.objects) {
        const label = object.label!;
        const padding = Math.min(160 - label.length, remaining);
        object.label = label + "X".repeat(padding);
        remaining -= padding;
    }
    return JSON.stringify(definition);
}

export function embeddedSceneTestModels(): Scene3dObject[] {
    const positions = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]).buffer);
    const model = {
        asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 1] }],
        bufferViews: [{ buffer: 0, byteLength: positions.length }],
        buffers: [{ byteLength: positions.length }],
    };
    const gltf = Buffer.from(JSON.stringify({
        ...model, buffers: [{ byteLength: positions.length, uri: `data:application/octet-stream;base64,${positions.toString("base64")}` }],
    }));
    const json = Buffer.from(JSON.stringify(model));
    const padded = Math.ceil(json.length / 4) * 4;
    const glb = Buffer.alloc(28 + padded + positions.length, 0x20);
    glb.writeUInt32LE(0x46546c67, 0);
    glb.writeUInt32LE(2, 4);
    glb.writeUInt32LE(glb.length, 8);
    glb.writeUInt32LE(padded, 12);
    glb.writeUInt32LE(0x4e4f534a, 16);
    json.copy(glb, 20);
    glb.writeUInt32LE(positions.length, 20 + padded);
    glb.writeUInt32LE(0x004e4942, 24 + padded);
    positions.copy(glb, 28 + padded);
    return [
        { id: "json_model", kind: "model", model: { format: "gltf", data: gltf.toString("base64") }, position: [11.05, .6, 15.4], selectable: true },
        { id: "binary_model", kind: "model", model: { format: "glb", data: glb.toString("base64") }, position: [12.75, .6, 15.4], selectable: true },
    ];
}
