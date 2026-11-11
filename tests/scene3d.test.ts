import { h, render } from "preact";
import { describe, expect, it, vi } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { prepareSpecification } from "../src/schema/prepareSpecification";
import { validateSchema } from "../src/schema/validateSchema";
import type { Scene3dComponent } from "../src/schema/scene3dSchema";
import { inspectModelAsset, openModelAsset } from "../src/components/scene3d/modelAsset";
import { resolveSceneObjects } from "../src/components/scene3d/sceneData";
import { resolveActiveSceneMotions, sceneMotionPose } from "../src/components/scene3d/sceneMotion";
import { HyperPbiRoot } from "../src/render/HyperPbiRoot";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import { createSceneJsonCache, createSceneTelemetryResolver, maxSceneJsonLength, resolveBoundScene } from "../src/components/scene3d/sceneBinding";
import { parseDataView } from "../src/data/parseDataView";
import { denseScene3d, nearPowerBiTextLimit } from "./fixtures/denseScene3d";

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
    it("accepts 128 direct objects and rejects 129 without changing the direct JSON contract", () => {
        const direct = { type: "scene3d", id: "dense", ...denseScene3d() };
        const spec = { version: "2.0", components: [direct] };
        expect(validateSchema(spec).schema).toEqual(spec);
        expect(validateSchema({ ...spec, components: [{ ...direct, ...denseScene3d(129) }] }).errors.join(" ")).toContain("128 objects");
        expect(validateSchema({ ...spec, components: [{ type: "scene3d", id: "empty" }] }).valid).toBe(false);
    });

    it("validates data-only scenes and resolves the exact matching row with an exact-content cache", () => {
        const binding = { mode: "data" as const, keyField: "stationid", sceneField: "scenejson", selectedKeyState: "station" };
        const parsed = parseCsvText("stationid,scenejson\nA,example", "registry.csv").data;
        const authored = { type: "scene3d", id: "viewer", sceneBinding: binding };
        expect(prepareSpecification({ version: "2.0", components: [authored] }, parsed).errors).toEqual([]);
        const dense = nearPowerBiTextLimit();
        const other = '{"objects":[{"id":"tank","kind":"tank"}]}';
        const data = { ...parsed, rows: [{ stationid: "1", scenejson: dense }, { stationid: 1, scenejson: other }] };
        const parse = createSceneJsonCache();
        const first = resolveBoundScene(binding, data, "1", parse);
        expect(first).toMatchObject({ definition: JSON.parse(dense) });
        expect(resolveBoundScene(binding, data, 1, parse)).toMatchObject({ definition: JSON.parse(other) });
        expect(resolveBoundScene(binding, data, "1", parse)).toBe(first);
        expect(resolveBoundScene(binding, data, "missing", parse)).toMatchObject({ message: expect.stringContaining("No scene row") });
        expect(resolveBoundScene(binding, data, undefined, parse)).toMatchObject({ message: expect.stringContaining("Select a station") });
        expect(resolveBoundScene(binding, { ...data, rows: [data.rows[0], data.rows[0]] }, "1", parse)).toMatchObject({ message: expect.stringContaining("More than one") });
    });

    it("reports missing, truncated, oversized, unsupported and over-limit content", () => {
        const parse = createSceneJsonCache();
        expect(parse('{"objects":[')).toMatchObject({ message: expect.stringContaining("invalid or truncated") });
        expect(parse(" ".repeat(maxSceneJsonLength + 1))).toMatchObject({ message: expect.stringContaining("too large") });
        expect(parse('{"objects":[],"interaction":{"script":"x"}}')).toMatchObject({ message: expect.stringContaining("unsupported") });
        expect(parse(JSON.stringify(denseScene3d(129)))).toMatchObject({ message: expect.stringContaining("128 objects") });
        const binding = { mode: "data" as const, keyField: "stationid", sceneField: "scenejson", selectedKeyState: "station" };
        const data = parseCsvText("stationid,scenejson\nA,", "registry.csv").data;
        expect(resolveBoundScene(binding, data, "A", parse)).toMatchObject({ message: expect.stringContaining("missing for station") });
    });

    it("resolves portable equipment, tooltip, and motion aliases in Power BI row definitions", () => {
        const columns = ["AssetID", "Status", "RPM"].map((name, index) => ({
            displayName: name, index, queryName: `Equipment.${name}`,
            type: name === "RPM" ? { numeric: true } : { text: true }, roles: { values: true },
        }));
        const data = parseDataView({ metadata: { columns }, table: { columns, rows: [["A", "Running", 240]] } });
        const definition = {
            objectIdField: "assetID", statusField: "status", tooltipFields: [{ field: "rPM", label: "Speed" }],
            objects: [{ id: "fan", kind: "fan" as const, dataKey: "A",
                animations: [{ kind: "rotate" as const, rpmField: "rPM", enabledField: "status", enabledValue: "Running" }] }],
        };
        const resolve = createSceneTelemetryResolver();
        const resolved = resolve(definition, data);
        expect(resolved.warning).toBeUndefined();
        const [state] = resolveSceneObjects(resolved.definition, data.rows, data.rows);
        expect(state.status).toBe("Running");
        expect(resolveActiveSceneMotions(state.object, state.row)[0].rpm).toBe(240);
        expect(resolved.definition.tooltipFields).toEqual([{ field: "equipment_rpm", label: "Speed" }]);
        expect(resolve(definition, { ...data, fields: { ...data.fields }, rows: [] })).toBe(resolved);
        expect(definition.objects[0].animations[0].rpmField).toBe("rPM");
    });

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

    it("clamps tank levels and reads pipe flow without changing the pipe's color or selection", () => {
        const tank = { asset: "T-1", level: 108, rate: 12 };
        const pump = { asset: "P-1", rate: -24, color: "#ff0000" };
        const spec: Scene3dComponent = {
            ...scene, levelField: "level", flowField: "rate",
            objects: [{ id: "tank", kind: "tank", dataKey: "T-1" }, { id: "pipe", kind: "pipe", flowKey: "P-1", color: "#3481bd" }],
        };
        const source = [tank, pump];
        expect(resolveSceneObjects(spec, source, source)).toEqual([
            expect.objectContaining({ level: 100, indices: [0], selectable: true }),
            expect.objectContaining({ flow: -24, color: "#3481bd", indices: [], selectable: false }),
        ]);
        expect(resolveSceneObjects(spec, source, [tank])[1].flow).toBeUndefined();
        const zero = [{ ...tank, level: 0 }, { ...pump, rate: 0 }];
        expect(resolveSceneObjects(spec, zero, zero)).toEqual([
            expect.objectContaining({ level: 0 }), expect.objectContaining({ flow: 0 }),
        ]);
        expect(validateSchema({ version: "2.0", components: [{ ...spec, objects: [{ id: "wrong", kind: "pump", flowKey: "P-1" }] }] }).valid).toBe(false);
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

describe("Scene3D declarative animations", () => {
    it("drives fan RPM from a matching row and pauses when the flow stops", () => {
        const fan = { id: "fan", kind: "fan" as const, dataKey: "P-1", position: [1, 2, 3] as [number, number, number],
            animations: [{ kind: "rotate" as const, axis: "z" as const, rpm: 45, rpmField: "rpm", enabledField: "flow" }] };
        const motions = resolveActiveSceneMotions(fan, { flow: 1200, rpm: 90 });
        expect(motions).toHaveLength(1);
        expect(motions[0].rpm).toBe(90);
        expect(sceneMotionPose(fan, motions, 1).rotation).toEqual([0, 0, 180]);
        expect(resolveActiveSceneMotions(fan, { flow: 0, rpm: 90 })).toHaveLength(0);
        expect(sceneMotionPose(fan, [], 4).rotation).toEqual([0, 0, 0]);
    });

    it("combines translation, pulsing and blinking without editing base transforms", () => {
        const rotor = { id: "test", kind: "box" as const, size: [2, 3, 4] as [number, number, number], animations: [
            { kind: "translate" as const, axis: "x" as const, amplitude: 2, period: 4 },
            { kind: "pulse" as const, amplitude: 0.5, period: 4 },
            { kind: "blink" as const, period: 4 },
        ] };
        const motions = resolveActiveSceneMotions(rotor);
        const first = sceneMotionPose(rotor, motions, 1);
        expect(first.position[0]).toBeCloseTo(2);
        expect(first.size).toEqual([3, 4.5, 6]);
        expect(first.visible).toBe(true);
        expect(sceneMotionPose(rotor, motions, 3).visible).toBe(false);
        expect(rotor.size).toEqual([2, 3, 4]);
    });

    it("validates animation properties, imported clip restrictions and object binding", () => {
        const result = validateSchema({ version: "2.0", components: [{
            type: "scene3d", id: "animations",
            objects: [{ id: "fan", kind: "fan", animations: [
                { kind: "rotate", rpm: 2600 }, { kind: "clip", clipName: "Rotor" },
                { kind: "pulse", enabledField: "status", enabledValue: "Running" },
            ] }],
        }] });
        expect(result.valid).toBe(false);
        expect(result.diagnostics?.map(item => item.path)).toEqual(expect.arrayContaining([
            "/components/0/objects/0/animations/0/rpm",
            "/components/0/objects/0/animations/1/kind",
            "/components/0/objects/0/animations/2/enabledField",
        ]));
    });
});
