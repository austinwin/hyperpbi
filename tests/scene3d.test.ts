import { h, render } from "preact";
import { describe, expect, it, vi } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { prepareSpecification } from "../src/schema/prepareSpecification";
import { validateSchema } from "../src/schema/validateSchema";
import type { Scene3dComponent } from "../src/schema/scene3dSchema";
import { inspectModelAsset, openModelAsset } from "../src/components/scene3d/modelAsset";
import { resolveSceneObjects } from "../src/components/scene3d/sceneData";
import { HyperPbiRoot } from "../src/render/HyperPbiRoot";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";

const scene: Scene3dComponent = {
    type: "scene3d", id: "scene", objectIdField: "asset", statusField: "status",
    colorField: "color", visibleField: "visible", tooltipFields: ["pressure"],
    statusColors: [{ value: "Alarm", color: "#e8a936" }],
    objects: [{ id: "pump", kind: "pump", dataKey: "P-1" }],
};

const triangleBytes = new Uint8Array(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
const triangle = {
    asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    buffers: [{ byteLength: 36, uri: `data:application/octet-stream;base64,${Buffer.from(triangleBytes).toString("base64")}` }],
};
const encode = (asset: unknown) => new TextEncoder().encode(JSON.stringify(asset));

describe("scene3d schema and data", () => {
    it("validates object ids, transforms, palette and the inline model boundary", () => {
        const result = validateSchema({ version: "2.0", components: [{
            ...scene, statusColors: [{ value: "Alarm", color: "var(--color)" }],
            objects: [
                { id: "pump", kind: "pump", size: [1, 0, 1] },
                { id: "pump", kind: "model", model: { url: "/assets/pump.glb" }, onClick: "alert(1)" },
            ],
        }] });
        expect(result.valid).toBe(false);
        expect(result.diagnostics?.map(item => item.path)).toEqual(expect.arrayContaining([
            "/components/0/statusColors/0", "/components/0/objects/0/size", "/components/0/objects/1/id",
            "/components/0/objects/1/model", "/components/0/objects/1/onClick",
        ]));
    });

    it("matches typed keys using currently visible rows and derives status, color, and visibility", () => {
        const older = { asset: 1, status: "Running" };
        const current = { asset: 1, status: "Alarm", visible: false, color: "#112233" };
        const stringKey = { asset: "1", status: "Alarm" };
        const spec = { ...scene, objects: [{ id: "pump", kind: "pump" as const, dataKey: 1 }] };
        const source = [older, current, stringKey];
        expect(resolveSceneObjects(spec, source, [current, stringKey])[0]).toMatchObject({
            row: current, indices: [1], color: "#112233", status: "Alarm", visible: false,
        });
        expect(resolveSceneObjects({ ...spec, hideUnmatched: true }, source, [stringKey])[0]).toMatchObject({ visible: false, indices: [] });
        expect(resolveSceneObjects(spec, [current, older], [current, older])[0].indices).toEqual([0, 1]);
        const invalidColor = [{ ...current, color: "url(example)" }];
        expect(resolveSceneObjects(spec, invalidColor, invalidColor)[0].color).toBe("#e8a936");
    });

    it("uses alias-aware field traversal and selects contributing original Power BI rows from a logical dataset", () => {
        const data = parseCsvText("Asset,Status,Pressure\nP-1,Alarm,63\nP-2,Running,67\nP-1,Alarm,64", "station.csv").data;
        const specification = {
            version: "2.0", data: { datasets: { pumps: { source: "powerbi", groupBy: ["asset", "status"], metrics: { peak: { op: "max", field: "pressure" } } } } },
            components: [{
                ...scene, dataset: "pumps", objectIdField: "asset", statusField: "status",
                colorField: undefined, visibleField: undefined, tooltipFields: ["peak"], interaction: { externalMode: "selection" },
            }],
        };
        const prepared = prepareSpecification(specification, data, { repair: false });
        expect(prepared.errors).toEqual([]);
        const selectExternal = vi.fn(() => ({ sent: true as const }));
        const host = document.createElement("div");
        render(h(HyperPbiRoot, {
            instanceId: "pump-lineage", schema: prepared.schema!, data,
            settings: toRuntimeSettings(new VisualFormattingSettingsModel()), renderMs: 0, selectExternal,
        }), host);
        try {
            host.querySelector<HTMLButtonElement>(".hp-scene3d-object-list button")!.click();
            expect(selectExternal).toHaveBeenCalledWith([0, 2], false, expect.objectContaining({ componentId: "scene" }));
        } finally { render(null, host); }
    });
});

describe("embedded glTF asset policy", () => {
    it("accepts a self-contained glTF file and its binary GLB equivalent", () => {
        const source = encode(triangle);
        expect(openModelAsset({ format: "gltf", data: Buffer.from(source).toString("base64") }).uris.size).toBe(1);
        const glbJson = Buffer.from(JSON.stringify({ ...triangle, buffers: [{ byteLength: 36 }] }));
        const padded = (glbJson.length + 3) & ~3;
        const glb = Buffer.alloc(28 + padded + triangleBytes.length, 0x20);
        glb.writeUInt32LE(0x46546c67, 0);
        glb.writeUInt32LE(2, 4);
        glb.writeUInt32LE(glb.length, 8);
        glb.writeUInt32LE(padded, 12);
        glb.writeUInt32LE(0x4e4f534a, 16);
        glbJson.copy(glb, 20);
        glb.writeUInt32LE(36, 20 + padded);
        glb.writeUInt32LE(0x004e4942, 24 + padded);
        glb.set(triangleBytes, 28 + padded);
        expect(inspectModelAsset("glb", new Uint8Array(glb)).uris.size).toBe(0);
        expect(() => inspectModelAsset("glb", new Uint8Array(glb.subarray(0, -1)))).toThrow(/header/);
    });

    it("rejects external files, compressed plugins, sparse geometry, and cyclic model nodes", () => {
        for (const uri of ["buffer.bin", "blob:example", "//example.invalid/mesh.bin"]) {
            expect(() => inspectModelAsset("gltf", encode({ ...triangle, buffers: [{ byteLength: 36, uri }] }))).toThrow(/embedded/);
        }
        expect(() => inspectModelAsset("gltf", encode({ ...triangle, extensionsUsed: ["KHR_draco_mesh_compression"] }))).toThrow(/extension/);
        expect(() => inspectModelAsset("gltf", encode({ ...triangle, accessors: [{ ...triangle.accessors[0], sparse: {} }] }))).toThrow(/sparse/);
        expect(() => inspectModelAsset("gltf", encode({ ...triangle, nodes: [{ mesh: 0, children: [0] }] }))).toThrow(/cyclic/);
    });
});
