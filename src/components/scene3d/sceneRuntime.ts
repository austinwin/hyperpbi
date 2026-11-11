import {
    ACESFilmicToneMapping, AnimationClip, AnimationMixer, Box3, BoxGeometry, Color, DirectionalLight, GridHelper, Group,
    HemisphereLight, LoadingManager, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFShadowMap,
    PerspectiveCamera, Raycaster, RingGeometry, Scene, Texture, Vector2, Vector3, WebGLRenderer,
    type Material, type Object3D,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { scene3dLimits, type Scene3dDefinition, type Scene3dObject } from "../../schema/scene3dSchema";
import type { SceneObjectState } from "./sceneData";
import { createSceneMeshes } from "./sceneMeshes";
import { openModelAsset } from "./modelAsset";
import { resolveActiveSceneMotions, sceneMotionPose, type ActiveSceneMotion } from "./sceneMotion";

type View = NonNullable<Scene3dDefinition["view"]>;
type LabelPositions = (id: string, point?: { x: number; y: number }) => void;
interface Callbacks {
    labels: LabelPositions;
    pick: (id: string, event: MouseEvent) => void;
    hover: (id?: string) => void;
    modelError: (id: string, message?: string) => void;
    lost: () => void;
}

interface Entry {
    definition: Scene3dObject;
    group: Group;
    finish: MeshStandardMaterial;
    selection: Mesh;
    anchor: Vector3;
    model?: Group;
    originalColors: Array<{ material: MeshStandardMaterial; color: Color; opacity: number; transparent: boolean; depthWrite: boolean }>;
    selected: boolean;
    color?: string;
    appearance?: string;
    setLevel?: (level?: number) => void;
    pipeFlow?: ReturnType<ReturnType<typeof createSceneMeshes>["addPipeFlow"]>;
    phase: number;
    speed: number;
    motions: ActiveSceneMotion[];
    motionTime: number;
    baseVisible: boolean;
    mixer?: AnimationMixer;
    clips?: AnimationClip[];
    activeClip?: AnimationClip;
}

const floorThemes = {
    light: { slab: "#dce5ee", major: "#bacadc", minor: "#c9d8e5" },
    dark: { slab: "#263a50", major: "#3d586e", minor: "#33495e" },
};
const dragThreshold = 5;

function releaseModel(root: Object3D) {
    const geometries = new Set<Mesh["geometry"]>();
    const materials = new Set<Material>();
    const textures = new Set<Texture>();
    root.traverse(object => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            materials.add(material);
            for (const value of Object.values(material)) {
                if (value instanceof Texture) textures.add(value);
            }
        }
    });
    const images = new Set([...textures].map(texture => texture.source.data));
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    for (const image of images) if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) image.close();
}

function updateFinish(entry: Entry) {
    const { definition, finish, selected, color, originalColors } = entry;
    const appearance = JSON.stringify([color, selected, definition.metalness, definition.roughness, definition.opacity]);
    if (appearance === entry.appearance) return;
    entry.appearance = appearance;
    finish.color.set(color ?? (definition.kind === "tank" ? "#a8bfce" : "#327eab"));
    finish.metalness = definition.metalness ?? 0.22;
    finish.roughness = definition.roughness ?? 0.44;
    finish.emissive.set(selected ? "#3076b7" : "#000000");
    finish.emissiveIntensity = 0.25;
    finish.opacity = definition.opacity ?? (entry.setLevel ? 0.35 : 1);
    finish.transparent = finish.opacity < 1;
    finish.depthWrite = !finish.transparent;
    for (const source of originalColors) {
        const { material } = source;
        material.color.copy(color ? finish.color : source.color);
        if (definition.metalness !== undefined && material.isMeshStandardMaterial) material.metalness = definition.metalness;
        if (definition.roughness !== undefined && material.isMeshStandardMaterial) material.roughness = definition.roughness;
        material.opacity = source.opacity * finish.opacity;
        material.transparent = source.transparent || finish.transparent;
        material.depthWrite = source.depthWrite && !finish.transparent;
    }
    entry.selection.visible = selected;
}

export function createSceneRuntime(host: HTMLElement, callbacks: Callbacks) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, powerPreference: "low-power" });
    if (!gl) throw new Error("WebGL 2 is unavailable.");
    const renderer = new WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true });
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.13;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    host.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 1, 0.05, 1400);
    const controls = new OrbitControls(camera, canvas);
    canvas.style.removeProperty("cursor");
    controls.maxPolarAngle = Math.PI * 0.499;
    controls.zoomSpeed = 0.85;
    const hemisphere = new HemisphereLight("#f6fbff", "#8095b0", 2.05);
    const sun = new DirectionalLight("#fff0df", 2.85);
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.00045;
    sun.shadow.normalBias = 0.035;
    const fill = new DirectionalLight("#b9d7ff", 0.65);
    fill.position.set(-4, 3, -6);
    scene.add(hemisphere, sun, sun.target, fill);

    const kits = createSceneMeshes();
    const floorGeometry = new BoxGeometry();
    const floorMaterial = new MeshStandardMaterial({ roughness: 0.86, metalness: 0.05 });
    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    scene.add(floor);
    let grid: GridHelper | undefined;
    const ringGeometry = new RingGeometry(0.92, 1, 48);
    ringGeometry.rotateX(-Math.PI / 2);
    const ringMaterial = new MeshBasicMaterial({ color: "#2589ed", transparent: true, opacity: 0.83, depthWrite: false });
    const entries = new Map<string, Entry>();
    const flowing = new Set<Entry>();
    const moving = new Set<Entry>();
    const roots = new Map<Object3D, string>();
    const bounds = new Box3();
    const projected = new Vector3();
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    let width = 0;
    let height = 0;
    let frame = 0;
    let viewDirty = false;
    let lastFlowDraw = 0;
    let disposed = false;
    let active = true;
    let labels = true;
    let lastHover: string | undefined;
    let theme = floorThemes.light;
    let showGrid = true;
    let view: View = "isometric";
    let viewInitialized = false;
    let press: { id: number; x: number; y: number; button: number; dragging: boolean } | undefined;
    let pendingPick: string | undefined;

    function draw(now: number) {
        frame = 0;
        if (!active || disposed || !width || !height) return;
        if (!viewDirty && now - lastFlowDraw < 32) {
            if (flowing.size || moving.size) scheduleFrame();
            return;
        }
        const elapsed = lastFlowDraw ? Math.min((now - lastFlowDraw) / 1000, 0.05) : 0;
        for (const entry of flowing) {
            entry.phase = (entry.phase + entry.speed * elapsed + 1) % 1;
            entry.pipeFlow?.move(entry.phase, entry.definition.size?.[1] ?? 1);
        }
        for (const entry of moving) {
            entry.motionTime += elapsed;
            const pose = sceneMotionPose(entry.definition, entry.motions, entry.motionTime);
            entry.group.position.fromArray(pose.position);
            entry.group.scale.fromArray(pose.size);
            const [rx, ry, rz] = pose.rotation;
            entry.group.rotation.set(rx * Math.PI / 180, ry * Math.PI / 180, rz * Math.PI / 180);
            entry.group.visible = entry.baseVisible && pose.visible;
            const clipMotion = entry.motions.find(motion => motion.animation.kind === "clip");
            const clip = clipMotion && (entry.clips?.find(item => item.name === clipMotion.animation.clipName) ??
                (!clipMotion.animation.clipName ? entry.clips?.[0] : undefined));
            if (entry.mixer && clip !== entry.activeClip) {
                entry.mixer.stopAllAction();
                entry.activeClip = clip;
                if (clip) entry.mixer.clipAction(clip).reset().play();
            }
            if (entry.mixer && clip) entry.mixer.update(elapsed * (clipMotion?.animation.rate ?? 1));
        }
        if (moving.size) {
            viewDirty = true;
            renderer.shadowMap.needsUpdate = true;
        }
        lastFlowDraw = flowing.size || moving.size ? now : 0;
        renderer.render(scene, camera);
        if (viewDirty) {
            viewDirty = false;
            for (const [id, entry] of entries) {
                projected.copy(entry.anchor).project(camera);
                const inside = entry.group.visible && labels && Math.abs(projected.x) < 0.98 && Math.abs(projected.y) < 0.92 && Math.abs(projected.z) < 1;
                callbacks.labels(id, inside ? { x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2 } : undefined);
            }
        }
        if (flowing.size || moving.size) scheduleFrame();
    }

    function scheduleFrame() {
        if (!frame && active && !disposed) frame = requestAnimationFrame(draw);
    }

    function invalidate() {
        viewDirty = true;
        scheduleFrame();
    }

    function fit(preset: View) {
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        const eye = preset === "top" ? new Vector3(0, 1, 0.035) : new Vector3(0.78, 0.84, 1.35);
        eye.normalize();
        const right = new Vector3().crossVectors(new Vector3(0, 1, 0), eye).normalize();
        const up = new Vector3().crossVectors(eye, right);
        const tangent = Math.tan(camera.fov * Math.PI / 360);
        let distance = 0;
        for (const x of [-size.x / 2, size.x / 2]) {
            for (const y of [-size.y / 2, size.y / 2]) {
                for (const z of [-size.z / 2, size.z / 2]) {
                    const corner = new Vector3(x, y, z);
                    const projectedDistance = Math.max(Math.abs(corner.dot(right)) / camera.aspect, Math.abs(corner.dot(up)));
                    distance = Math.max(distance, corner.dot(eye) + projectedDistance / tangent);
                }
            }
        }
        controls.target.copy(center);
        controls.minDistance = Math.max(0.3, size.length() * 0.07);
        controls.maxDistance = Math.max(distance * 3, 25);
        camera.far = Math.max(100, controls.maxDistance * 2);
        camera.updateProjectionMatrix();
        camera.position.copy(center).addScaledVector(eye, Math.max(2, distance * (preset === "top" ? 1.12 : 1.02)));
        controls.update();
        view = preset;
        viewInitialized = true;
        invalidate();
    }

    function resize() {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h || width === w && height === h) return;
        const previousAspect = camera.aspect;
        width = w;
        height = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65, Math.sqrt(2_500_000 / (w * h))));
        renderer.setSize(w, h, false);
        if (viewInitialized && Math.abs(previousAspect / camera.aspect - 1) > 0.18) fit(view);
        invalidate();
    }

    function disposeGrid() {
        if (!grid) return;
        grid.removeFromParent();
        grid.dispose();
        grid = undefined;
    }

    function setGround() {
        bounds.makeEmpty();
        bounds.expandByPoint(new Vector3(-2, 0, -1.5));
        bounds.expandByPoint(new Vector3(2, 0.6, 1.5));
        for (const entry of entries.values()) {
            bounds.expandByObject(entry.group, Boolean(entry.model));
        }
        bounds.min.x -= 0.8;
        bounds.max.x += 0.8;
        bounds.min.z -= 0.8;
        bounds.max.z += 0.8;
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        floor.position.set(center.x, bounds.min.y - 0.135, center.z);
        floor.scale.set(size.x, 0.25, size.z);
        floorMaterial.color.set(theme.slab);
        disposeGrid();
        if (showGrid) {
            grid = new GridHelper(size.x, Math.max(8, Math.min(36, Math.round(size.x * 2))), theme.major, theme.minor);
            grid.scale.z = size.z / size.x;
            grid.position.set(center.x, bounds.min.y - 0.007, center.z);
            scene.add(grid);
        }
        const span = Math.max(5, size.length() * 0.6);
        sun.position.copy(center).addScaledVector(new Vector3(0.55, 1.5, 0.67), span);
        sun.target.position.copy(center);
        Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, far: span * 4 });
        sun.shadow.camera.updateProjectionMatrix();
        renderer.shadowMap.needsUpdate = true;
    }

    function setAnchor(entry: Entry) {
        const box = new Box3().setFromObject(entry.group, Boolean(entry.model));
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        entry.anchor.set(center.x, box.max.y + Math.min(0.28, size.y * 0.12), center.z);
        entry.selection.position.set(center.x, box.min.y + 0.025, center.z);
        entry.selection.scale.set(size.x * 0.65 + 0.08, 1, size.z * 0.69 + 0.08);
    }

    async function loadModel(entry: Entry) {
        const id = entry.definition.id;
        const current = () => !disposed && entries.get(id) === entry;
        let loaded: Group | undefined;
        try {
            const { input, uris } = openModelAsset(entry.definition.model!);
            const { GLTFLoader } = await import(/* webpackMode: "eager" */ "three/examples/jsm/loaders/GLTFLoader.js");
            if (!current()) return;
            const manager = new LoadingManager().setURLModifier(url => {
                if (uris.has(url) || url.startsWith("blob:")) return url;
                throw new Error("External model resources are blocked.");
            });
            const asset = await new GLTFLoader(manager).parseAsync(input, "");
            loaded = asset.scene;
            if (!current()) { releaseModel(loaded); return; }
            const box = new Box3().setFromObject(loaded, true);
            const size = box.getSize(new Vector3());
            if (box.isEmpty() || ![...box.min, ...box.max].every(Number.isFinite) || Math.max(size.x, size.y, size.z) < 0.000001) {
                throw new Error("The model has invalid geometry bounds.");
            }
            const dimensions = new Vector3(Math.max(size.x, 0.001), Math.max(size.y, 0.001), Math.max(size.z, 0.001));
            const origin = box.getCenter(new Vector3());
            const normalized = new Group();
            loaded.position.sub(origin);
            normalized.add(loaded);
            normalized.scale.set(1 / dimensions.x, 1 / dimensions.y, 1 / dimensions.z);
            const materials = new Set<MeshStandardMaterial>();
            loaded.traverse(object => {
                if (!(object instanceof Mesh)) return;
                object.castShadow = object.receiveShadow = true;
                for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                    if (material.color instanceof Color) materials.add(material);
                }
            });
            entry.model = loaded;
            entry.clips = asset.animations;
            entry.mixer = asset.animations.length ? new AnimationMixer(loaded) : undefined;
            entry.originalColors = [...materials].map(material => ({
                material, color: material.color.clone(), opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite,
            }));
            entry.group.clear();
            entry.group.add(normalized);
            entry.appearance = undefined;
            updateFinish(entry);
            setAnchor(entry);
            setGround();
            invalidate();
        } catch {
            if (loaded) releaseModel(loaded);
            if (current()) callbacks.modelError(id, "Model could not be rendered. Re-import a supported GLB or glTF file.");
        }
    }

    function remove(entry: Entry) {
        flowing.delete(entry);
        moving.delete(entry);
        entry.mixer?.stopAllAction();
        if (entry.mixer && entry.model) entry.mixer.uncacheRoot(entry.model);
        roots.delete(entry.group);
        entry.group.removeFromParent();
        entry.selection.removeFromParent();
        entry.finish.dispose();
        entry.pipeFlow?.bands.dispose();
        if (entry.model) releaseModel(entry.model);
    }

    function configure(component: Scene3dDefinition, dark: boolean) {
        if (component.objects.length > scene3dLimits.objects) throw new Error(`A scene supports up to ${scene3dLimits.objects} objects.`);
        const nextIds = new Set(component.objects.map(object => object.id));
        for (const [id, entry] of entries) {
            if (!nextIds.has(id)) {
                remove(entry);
                entries.delete(id);
                callbacks.modelError(id);
            }
        }
        for (const definition of component.objects) {
            let entry = entries.get(definition.id);
            const gauge = definition.kind === "tank" && Boolean(component.levelField) && definition.dataKey !== undefined;
            const animate = definition.kind === "pipe" && Boolean(component.flowField) &&
                (definition.flowKey !== undefined || definition.dataKey !== undefined);
            if (entry && (entry.definition.kind !== definition.kind || entry.definition.model?.data !== definition.model?.data ||
                entry.definition.model?.format !== definition.model?.format ||
                definition.kind === "model" && (entry.definition.metalness !== definition.metalness || entry.definition.roughness !== definition.roughness) ||
                Boolean(entry.setLevel) !== gauge || Boolean(entry.pipeFlow) !== animate)) {
                remove(entry);
                entry = undefined;
            }
            if (!entry) {
                const finish = new MeshStandardMaterial();
                const group = kits.build(definition.kind === "model" ? "box" : definition.kind, finish);
                const selection = new Mesh(ringGeometry, ringMaterial);
                selection.visible = false;
                const setLevel = gauge ? kits.addTankGauge(group) : undefined;
                setLevel?.();
                const pipeFlow = animate ? kits.addPipeFlow(group) : undefined;
                entry = { definition, group, finish, selection, anchor: new Vector3(), originalColors: [], selected: false,
                    setLevel, pipeFlow, phase: 0.12, speed: 0, motions: [], motionTime: 0, baseVisible: true };
                scene.add(group, selection);
                entries.set(definition.id, entry);
                roots.set(group, definition.id);
                callbacks.modelError(definition.id);
                if (definition.kind === "model") void loadModel(entry);
            }
            entry.definition = definition;
            entry.group.position.fromArray(definition.position ?? [0, 0, 0]);
            entry.group.scale.fromArray(definition.size ?? [1, 1, 1]);
            const [x, y, z] = definition.rotation ?? [0, 0, 0];
            entry.group.rotation.set(x * Math.PI / 180, y * Math.PI / 180, z * Math.PI / 180);
            setAnchor(entry);
        }
        showGrid = component.grid !== false;
        theme = dark ? floorThemes.dark : floorThemes.light;
        sun.castShadow = renderer.shadowMap.enabled = component.shadows !== false;
        setGround();
        fit(component.view ?? "isometric");
    }

    function update(objects: SceneObjectState[], selected: ReadonlySet<string>, showLabels: boolean, flowBudget: number) {
        labels = showLabels;
        flowing.clear();
        moving.clear();
        // Reserve slots for configured equipment motion before allocating leftover slots to pipe flow.
        for (const state of objects) {
            const entry = entries.get(state.object.id);
            if (!entry) continue;
            entry.motions = state.visible && moving.size < flowBudget ? resolveActiveSceneMotions(state.object, state.row) : [];
            if (entry.motions.length) moving.add(entry);
        }
        for (const state of objects) {
            const entry = entries.get(state.object.id);
            if (!entry) continue;
            if (entry.group.visible !== state.visible) renderer.shadowMap.needsUpdate = true;
            entry.baseVisible = state.visible;
            if (!moving.has(entry)) {
                const pose = sceneMotionPose(entry.definition, [], 0);
                entry.group.position.fromArray(pose.position);
                entry.group.scale.fromArray(pose.size);
                const [rx, ry, rz] = pose.rotation;
                entry.group.rotation.set(rx * Math.PI / 180, ry * Math.PI / 180, rz * Math.PI / 180);
                entry.mixer?.stopAllAction();
                entry.activeClip = undefined;
            }
            entry.group.visible = state.visible;
            entry.selected = state.visible && selected.has(state.object.id);
            entry.color = state.color;
            updateFinish(entry);
            entry.setLevel?.(state.level);
            if (entry.pipeFlow) {
                const rate = state.flow ?? 0;
                const flowingNow = state.visible && rate !== 0 && flowing.size < flowBudget - moving.size;
                entry.pipeFlow.bands.visible = flowingNow;
                if (flowingNow) {
                    const length = Math.max(1, entry.definition.size?.[1] ?? 1);
                    entry.speed = Math.sign(rate) * (0.22 + 0.7 * Math.min(1, Math.abs(rate) / 1200)) / Math.sqrt(length);
                    flowing.add(entry);
                }
            }
        }
        invalidate();
    }

    function pick(event: PointerEvent): string | undefined {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
        camera.updateMatrixWorld();
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects([...roots.keys()].filter(group => group.visible), true)[0];
        for (let object: Object3D | null | undefined = hit?.object; object; object = object.parent) {
            const id = roots.get(object);
            if (id) return id;
        }
    }

    function hover(id?: string) {
        if (id === lastHover) return;
        lastHover = id;
        const definition = id ? entries.get(id)?.definition : undefined;
        canvas.classList.toggle("is-pickable", Boolean(definition && (definition.selectable ?? definition.dataKey !== undefined)));
        callbacks.hover(id);
    }

    let hoverFrame = 0;
    let hoverEvent: PointerEvent | undefined;
    const clearHoverFrame = () => {
        if (hoverFrame) cancelAnimationFrame(hoverFrame);
        hoverFrame = 0;
        hoverEvent = undefined;
    };
    const down = (event: PointerEvent) => {
        pendingPick = undefined;
        press = event.isPrimary && event.button >= 0 && event.button <= 2
            ? { id: event.pointerId, x: event.clientX, y: event.clientY, button: event.button, dragging: false }
            : undefined;
        clearHoverFrame();
    };
    const move = (event: PointerEvent) => {
        if (press?.id === event.pointerId && event.buttons && !press.dragging) {
            if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < dragThreshold) {
                // OrbitControls listens on the document. Ignore the small movement of a click.
                event.stopPropagation();
                return;
            }
            press.dragging = true;
            canvas.classList.add("is-dragging");
            hover();
        }
        if (!event.buttons && event.pointerType !== "touch") {
            hoverEvent = event;
            if (!hoverFrame) hoverFrame = requestAnimationFrame(() => {
                hoverFrame = 0;
                if (hoverEvent) hover(pick(hoverEvent));
                hoverEvent = undefined;
            });
        }
    };
    const up = (event: PointerEvent) => {
        const id = pick(event);
        pendingPick = press?.id === event.pointerId && press.button === 0 && event.button === 0 && !press.dragging &&
            Math.hypot(event.clientX - press.x, event.clientY - press.y) < dragThreshold ? id : undefined;
        press = undefined;
        canvas.classList.remove("is-dragging");
        if (event.pointerType !== "touch") hover(id);
    };
    const click = (event: MouseEvent) => {
        // Let pointerup bubble to OrbitControls before the interaction engine claims the click.
        const id = pendingPick;
        pendingPick = undefined;
        if (id) callbacks.pick(id, event);
    };
    const leave = () => {
        clearHoverFrame();
        hover();
    };
    const captureLost = () => { press = undefined; canvas.classList.remove("is-dragging"); };
    const cancel = () => { pendingPick = undefined; captureLost(); leave(); };
    const lost = (event: Event) => { event.preventDefault(); callbacks.lost(); };
    const listeners = [
        ["pointerdown", down], ["pointermove", move], ["pointerup", up], ["click", click],
        ["pointercancel", cancel], ["lostpointercapture", captureLost], ["pointerleave", leave], ["webglcontextlost", lost],
    ] as const;
    for (const [event, listener] of listeners) canvas.addEventListener(event, listener as EventListener);
    controls.addEventListener("change", invalidate);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    return {
        configure, update, fit, invalidate,
        resetInteraction() {
            cancel();
            for (const entry of entries.values()) {
                entry.motionTime = 0;
                entry.phase = 0.12;
                entry.mixer?.stopAllAction();
                entry.activeClip = undefined;
            }
        },
        setActive(value: boolean) {
            if (active === value) return;
            active = value;
            if (active) invalidate();
            else {
                cancelAnimationFrame(frame);
                clearHoverFrame();
                frame = lastFlowDraw = 0;
            }
        },
        dispose() {
            disposed = true;
            cancelAnimationFrame(frame);
            clearHoverFrame();
            observer.disconnect();
            controls.dispose();
            for (const [event, listener] of listeners) canvas.removeEventListener(event, listener as EventListener);
            for (const entry of entries.values()) remove(entry);
            entries.clear();
            disposeGrid();
            for (const resource of [floorGeometry, floorMaterial, ringGeometry, ringMaterial, sun.shadow]) resource.dispose();
            kits.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        },
    };
}

export type SceneRuntime = ReturnType<typeof createSceneRuntime>;
