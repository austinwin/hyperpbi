import { scene3dLimits, type Scene3dObject } from "../../schema/scene3dSchema";

type EmbeddedModel = NonNullable<Scene3dObject["model"]>;
type Json = Record<string, unknown>;
const jsonObject = (value: unknown): value is Json => value !== null && typeof value === "object" && !Array.isArray(value);
const whole = (value: unknown, min: number, max: number): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

const glbMagic = 0x46546c67;
const jsonChunk = 0x4e4f534a;
const binaryChunk = 0x004e4942;
const allowedExtensions = new Set(["KHR_materials_unlit", "KHR_texture_transform"]);
const accessorArity = new Map<unknown, number>([["SCALAR", 1], ["VEC2", 2], ["VEC3", 3], ["VEC4", 4]]);
const accessorWidth = new Map<unknown, number>([[5120, 1], [5121, 1], [5122, 2], [5123, 2], [5125, 4], [5126, 4]]);
const meshAttributes = /^(POSITION|NORMAL|TANGENT|TEXCOORD_[0-3]|COLOR_0)$/;

function requireAsset(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function decode(data: string): Uint8Array {
    requireAsset(data.length <= scene3dLimits.modelBytes / 3 * 4 && data.length % 4 === 0 && !/[^A-Za-z0-9+/=]/.test(data), "Invalid or oversized base64 model data.");
    return Uint8Array.from(atob(data), character => character.charCodeAt(0));
}

function dataUri(value: unknown, mimeTypes: readonly string[]): { mime: string; bytes: Uint8Array } {
    requireAsset(typeof value === "string", "Model buffers and textures must be embedded.");
    const comma = value.indexOf(",");
    const mime = mimeTypes.find(type => value.slice(0, comma) === `data:${type};base64`);
    requireAsset(mime, "Model buffers and textures must be embedded as supported data URIs.");
    return { mime, bytes: decode(value.slice(comma + 1)) };
}

function readContainer(format: EmbeddedModel["format"], bytes: Uint8Array): { json: Uint8Array; binary?: Uint8Array } {
    requireAsset(bytes.length > 0 && bytes.length <= scene3dLimits.modelBytes, "The model must be at most 768 KiB.");
    if (format === "gltf") return { json: bytes };
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    requireAsset(format === "glb" && bytes.length >= 20 && view.getUint32(0, true) === glbMagic &&
        view.getUint32(4, true) === 2 && view.getUint32(8, true) === bytes.length && view.getUint32(16, true) === jsonChunk,
    "Expected a valid glTF 2.0 binary header.");
    const end = 20 + view.getUint32(12, true);
    requireAsset(end <= bytes.length && end % 4 === 0, "Invalid GLB JSON chunk length.");
    if (end === bytes.length) return { json: bytes.subarray(20, end) };
    requireAsset(end + 8 <= bytes.length && view.getUint32(end + 4, true) === binaryChunk &&
        end + 8 + view.getUint32(end, true) === bytes.length, "Invalid GLB binary chunk.");
    return { json: bytes.subarray(20, end), binary: bytes.subarray(end + 8) };
}

function texturePixels(bytes: Uint8Array, mime: string): number {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let width = 0;
    let height = 0;
    if (mime === "image/png") {
        requireAsset(bytes.length >= 33 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a &&
            view.getUint32(8) === 13 && view.getUint32(12) === 0x49484452, "Invalid PNG texture.");
        width = view.getUint32(16);
        height = view.getUint32(20);
        for (let offset = 8; offset + 12 <= bytes.length;) {
            requireAsset(view.getUint32(offset + 4) !== 0x6163544c, "Animated PNG textures are unsupported.");
            offset += view.getUint32(offset) + 12;
        }
    } else {
        requireAsset(bytes.length >= 4 && view.getUint16(0) === 0xffd8, "Invalid JPEG texture.");
        for (let offset = 2; offset + 4 <= bytes.length;) {
            requireAsset(bytes[offset] === 0xff, "Invalid JPEG texture segment.");
            const marker = bytes[offset + 1];
            if (marker === 0xff) { offset++; continue; }
            if (marker === 0xda || marker === 0xd9) break;
            const length = view.getUint16(offset + 2);
            requireAsset(length >= 2 && offset + 2 + length <= bytes.length, "Invalid JPEG texture segment length.");
            if ([0xc0, 0xc1, 0xc2].includes(marker)) {
                requireAsset(length >= 8, "Invalid JPEG texture dimensions.");
                height = view.getUint16(offset + 5);
                width = view.getUint16(offset + 7);
                break;
            }
            offset += 2 + length;
        }
    }
    requireAsset(whole(width, 1, 1024) && whole(height, 1, 1024), "Each embedded texture must be at most 1024 × 1024 pixels.");
    return width * height;
}

export function inspectModelAsset(format: EmbeddedModel["format"], bytes: Uint8Array): { uris: Set<string>; input: ArrayBuffer | string } {
    const { json, binary } = readContainer(format, bytes);
    const source = new TextDecoder("utf-8", { fatal: true }).decode(json);
    const document: unknown = JSON.parse(source, (key, value: unknown) => {
        requireAsset(key !== "__proto__", "Unsupported model property.");
        if (key === "extensions") requireAsset(jsonObject(value) && Object.keys(value).every(extension => allowedExtensions.has(extension)), "Unsupported glTF extension.");
        return value;
    });
    requireAsset(jsonObject(document) && jsonObject(document.asset) && document.asset.version === "2.0", "Expected a glTF 2.0 model.");
    for (const property of ["extensionsUsed", "extensionsRequired"]) {
        const value = document[property];
        requireAsset(value === undefined || Array.isArray(value) && value.every(extension => allowedExtensions.has(extension)), "The model uses an unsupported glTF extension or compression.");
    }
    for (const property of ["skins", "cameras"]) {
        const value = document[property];
        requireAsset(value === undefined || Array.isArray(value) && value.length === 0, "Import a static model without animations, skins, or cameras.");
    }
    const items = (property: string, limit: number): Json[] => {
        const list = document[property] ?? [];
        requireAsset(Array.isArray(list) && list.length <= limit && list.every(jsonObject), `Invalid or oversized glTF ${property}.`);
        return list;
    };
    const uris = new Set<string>();
    let bufferBytes = 0;
    const buffers = items("buffers", 8).map(({ uri, byteLength }, index) => {
        const data = uri === undefined && index === 0 && binary
            ? binary : dataUri(uri, ["application/octet-stream", "application/gltf-buffer"]).bytes;
        if (typeof uri === "string") uris.add(uri);
        requireAsset(whole(byteLength, 1, data.length) && data.length - byteLength <= 3, "Invalid embedded glTF buffer length.");
        bufferBytes += byteLength;
        requireAsset(bufferBytes <= scene3dLimits.modelBytes, "The embedded buffers exceed the model limit.");
        return data.subarray(0, byteLength);
    });
    const views = items("bufferViews", 384).map(({ buffer, byteOffset = 0, byteLength, byteStride }) => {
        requireAsset(whole(buffer, 0, buffers.length - 1), "Invalid glTF buffer reference.");
        const data = buffers[buffer];
        requireAsset(whole(byteOffset, 0, data.length) && whole(byteLength, 1, data.length - byteOffset) &&
            (byteStride === undefined || whole(byteStride, 4, 252) && byteStride % 4 === 0), "Invalid glTF buffer view bounds.");
        return { data: data.subarray(byteOffset, byteOffset + byteLength), stride: byteStride };
    });
    let elements = 0;
    const accessors = items("accessors", 384).map(({ count, type, componentType, bufferView, byteOffset = 0, sparse }) => {
        const arity = accessorArity.get(type);
        const componentBytes = accessorWidth.get(componentType);
        requireAsset(sparse === undefined && arity && componentBytes && whole(bufferView, 0, views.length - 1) &&
            whole(count, 1, 180_000), "Invalid, sparse, or oversized glTF accessor.");
        const { data, stride = arity * componentBytes } = views[bufferView];
        requireAsset(whole(byteOffset, 0, data.length) && stride >= arity * componentBytes &&
            (data.byteOffset + byteOffset) % componentBytes === 0 &&
            byteOffset + (count - 1) * stride + arity * componentBytes <= data.length, "glTF accessor exceeds its buffer view.");
        elements += count * arity;
        requireAsset(elements <= 600_000, "The model exceeds its geometry budget.");
        return { count, type, componentType, data, byteOffset, stride };
    });
    const images = items("images", 8);
    let pixels = 0;
    for (const { uri, bufferView, mimeType } of images) {
        let data: { bytes: Uint8Array; mime: string };
        if (uri === undefined) {
            requireAsset(whole(bufferView, 0, views.length - 1) && (mimeType === "image/png" || mimeType === "image/jpeg"), "Use embedded PNG or JPEG textures.");
            data = { bytes: views[bufferView].data, mime: mimeType };
        } else {
            data = dataUri(uri, ["image/png", "image/jpeg"]);
            uris.add(String(uri));
        }
        pixels += texturePixels(data.bytes, data.mime);
        requireAsset(pixels <= 2 * 1024 * 1024, "The model exceeds its texture pixel budget.");
    }
    items("materials", 48);
    items("samplers", 16);
    for (const { source } of items("textures", 8)) requireAsset(whole(source, 0, images.length - 1), "Invalid glTF texture reference.");
    const maxIndices = new Map<number, number>();
    const checkedPositions = new Set<number>();
    const meshes = items("meshes", 64).map(({ primitives, weights }) => {
        requireAsset(weights === undefined && Array.isArray(primitives) && primitives.length > 0 && primitives.length <= 16 && primitives.every(jsonObject), "Invalid glTF mesh or unsupported morph targets.");
        let triangles = 0;
        for (const { mode = 4, attributes, indices, targets } of primitives) {
            requireAsset(mode === 4 && targets === undefined && jsonObject(attributes) && whole(attributes.POSITION, 0, accessors.length - 1), "Use triangle meshes without morph targets.");
            const position = accessors[attributes.POSITION];
            requireAsset(position.type === "VEC3" && position.componentType === 5126 && Object.keys(attributes).length <= 8, "Invalid glTF vertex attributes.");
            if (!checkedPositions.has(attributes.POSITION)) {
                const data = new DataView(position.data.buffer, position.data.byteOffset, position.data.byteLength);
                for (let vertex = 0; vertex < position.count; vertex++) {
                    const offset = position.byteOffset + vertex * position.stride;
                    for (const axis of [0, 4, 8]) requireAsset(Number.isFinite(data.getFloat32(offset + axis, true)), "Invalid glTF vertex position.");
                }
                checkedPositions.add(attributes.POSITION);
            }
            for (const [key, index] of Object.entries(attributes)) requireAsset(meshAttributes.test(key) && whole(index, 0, accessors.length - 1) && accessors[index].count === position.count, "Unsupported or mismatched glTF vertex attributes.");
            let count = position.count;
            if (indices !== undefined) {
                requireAsset(whole(indices, 0, accessors.length - 1), "Invalid glTF index reference.");
                const accessor = accessors[indices];
                requireAsset(accessor.type === "SCALAR" && [5121, 5123, 5125].includes(Number(accessor.componentType)), "Invalid glTF mesh indices.");
                let maximum = maxIndices.get(indices);
                if (maximum === undefined) {
                    maximum = 0;
                    const data = new DataView(accessor.data.buffer, accessor.data.byteOffset, accessor.data.byteLength);
                    for (let index = 0; index < accessor.count; index++) {
                        const offset = accessor.byteOffset + index * accessor.stride;
                        const value = accessor.componentType === 5121 ? data.getUint8(offset)
                            : accessor.componentType === 5123 ? data.getUint16(offset, true) : data.getUint32(offset, true);
                        maximum = Math.max(maximum, value);
                    }
                    maxIndices.set(indices, maximum);
                }
                requireAsset(maximum < position.count, "glTF mesh index exceeds the vertex count.");
                count = accessor.count;
            }
            requireAsset(count % 3 === 0, "Invalid glTF triangle count.");
            triangles += count / 3;
        }
        return { draws: primitives.length, triangles };
    });
    const nodes = items("nodes", 192);
    const claimed = new Set<number>();
    let triangles = 0;
    let draws = 0;
    function visit(index: unknown, depth: number) {
        requireAsset(whole(index, 0, nodes.length - 1) && depth <= 24 && !claimed.has(index), "Invalid, repeated, cyclic, or deeply nested glTF node.");
        claimed.add(index);
        const { children = [], mesh, skin, camera, weights } = nodes[index];
        requireAsset(Array.isArray(children) && children.length <= nodes.length && skin === undefined && camera === undefined && weights === undefined, "Invalid glTF node children or unsupported node type.");
        if (mesh !== undefined) {
            requireAsset(whole(mesh, 0, meshes.length - 1), "Invalid glTF mesh reference.");
            draws += meshes[mesh].draws;
            triangles += meshes[mesh].triangles;
            requireAsset(draws <= 96 && triangles <= 80_000, "The model exceeds 96 draw calls or 80,000 triangles.");
        }
        for (const child of children) visit(child, depth + 1);
    }
    const scenes = items("scenes", 1);
    requireAsset(scenes.length === 1 && Array.isArray(scenes[0].nodes) && scenes[0].nodes.length <= nodes.length &&
        (document.scene === undefined || document.scene === 0), "Import a model with a single glTF scene.");
    for (const node of scenes[0].nodes) visit(node, 1);
    requireAsset(draws > 0 && claimed.size === nodes.length, "The model must contain rendered geometry and all nodes must belong to its scene.");
    // Only bounded, rigid-node transform clips are allowed. No skins, morph targets,
    // external resources, scripts, or compressed animation buffers are accepted.
    const animations = items("animations", scene3dLimits.clipsPerModel);
    for (const animation of animations) {
        const samplers = animation.samplers;
        const channels = animation.channels;
        requireAsset(Array.isArray(samplers) && samplers.length <= 24 && samplers.every(jsonObject) &&
            Array.isArray(channels) && channels.length <= 24 && channels.every(jsonObject),
            "A glTF clip may contain at most 24 samplers and transform channels.");
        for (const { sampler, target } of channels) {
            requireAsset(whole(sampler, 0, samplers.length - 1) && jsonObject(target) &&
                whole(target.node, 0, nodes.length - 1) && claimed.has(target.node) &&
                ["rotation", "translation", "scale"].includes(String(target.path)),
                "Animation channels must target scene node transforms.");
            const source = samplers[sampler];
            requireAsset(whole(source.input, 0, accessors.length - 1) &&
                whole(source.output, 0, accessors.length - 1) &&
                (source.interpolation === undefined || ["LINEAR", "STEP"].includes(String(source.interpolation))),
                "Use supported LINEAR or STEP keyframe interpolation.");
            const times = accessors[source.input];
            const values = accessors[source.output];
            requireAsset(times.type === "SCALAR" && times.componentType === 5126 &&
                times.count >= 1 && times.count <= 2048 && values.count === times.count &&
                values.componentType === 5126 && values.type === (target.path === "rotation" ? "VEC4" : "VEC3"),
                "Invalid animation keyframe types or counts.");
            const timeView = new DataView(times.data.buffer, times.data.byteOffset, times.data.byteLength);
            let previous = -1;
            for (let frame = 0; frame < times.count; frame++) {
                const value = timeView.getFloat32(times.byteOffset + frame * times.stride, true);
                requireAsset(Number.isFinite(value) && value >= 0 && value <= 120 && value > previous,
                    "Animation keyframe times must increase within 120 seconds.");
                previous = value;
            }
            const valueView = new DataView(values.data.buffer, values.data.byteOffset, values.data.byteLength);
            for (let frame = 0; frame < values.count; frame++) {
                for (let part = 0; part < (target.path === "rotation" ? 4 : 3); part++) {
                    const value = valueView.getFloat32(values.byteOffset + frame * values.stride + part * 4, true);
                    requireAsset(Number.isFinite(value) && Math.abs(value) < 100_000,
                        "Invalid or unbounded animation keyframe value.");
                }
            }
        }
    }
    return { uris, input: format === "glb" ? bytes.slice().buffer : source };
}

export function openModelAsset(model: EmbeddedModel) {
    return inspectModelAsset(model.format, decode(model.data));
}

export async function importModelFile(file: File): Promise<EmbeddedModel> {
    const format = file.name.toLowerCase().endsWith(".glb") ? "glb" : file.name.toLowerCase().endsWith(".gltf") ? "gltf" : undefined;
    requireAsset(format && file.size > 0 && file.size <= scene3dLimits.modelBytes, "Choose a GLB or self-contained glTF file up to 768 KiB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    inspectModelAsset(format, bytes);
    const blocks: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += 8192) blocks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
    return { format, data: btoa(blocks.join("")) };
}
