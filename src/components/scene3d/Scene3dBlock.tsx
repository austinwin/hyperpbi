import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { Card } from "../layout/LayoutBlocks";
import { useRenderContext } from "../../render/RenderContext";
import { clearComponentInteraction, clearLocalComponentSelection, executeComponentInteraction } from "../../interactions/componentInteraction";
import { claimInteractionEvent, createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import type { Scene3dComponent, Scene3dDefinition } from "../../schema/scene3dSchema";
import { formatValue } from "../../utils/formatValue";
import { resolveSceneObjects, type SceneObjectState } from "./sceneData";
import type { SceneRuntime } from "./sceneRuntime";
import { createSceneJsonCache, createSceneTelemetryResolver, resolveBoundScene } from "./sceneBinding";

const emptyObjects: Scene3dDefinition["objects"] = [];
const emptyRows: Parameters<typeof resolveSceneObjects>[1] = [];

export function Scene3dBlock({ component: authored }: { component: Scene3dComponent }) {
    const context = useRenderContext();
    const [parseScene] = useState(createSceneJsonCache);
    const [resolveTelemetry] = useState(createSceneTelemetryResolver);
    const binding = authored.sceneBinding?.mode === "data" ? authored.sceneBinding : undefined;
    const registry = binding ? context.datasets?.get(binding.dataset ?? "powerbi") : undefined;
    const registryData = registry?.data ?? (binding && !context.datasets && (!binding.dataset || binding.dataset === "powerbi") ? context.data : undefined);
    const selectedKey = binding && Object.hasOwn(context.state.values, binding.selectedKeyState) ? context.state.values[binding.selectedKeyState] : undefined;
    const bound = useMemo(() => binding ? resolveBoundScene(binding, registryData, selectedKey, parseScene) : undefined,
        [binding, registryData, selectedKey, parseScene]);
    const parsed = bound && "definition" in bound ? bound.definition : undefined;
    const telemetry = useMemo(() => parsed ? resolveTelemetry(parsed, context.data, context.config.fields?.aliases) : undefined,
        [parsed, resolveTelemetry, context.data, context.config.fields?.aliases]);
    const definition = telemetry?.definition;
    const component = useMemo(() => ({
        ...authored,
        ...definition,
        objects: binding ? definition?.objects ?? emptyObjects : authored.objects ?? emptyObjects,
    }), [authored, definition, binding]);
    const remoteStatus = registry?.sourceId ? context.remoteSources?.[registry.sourceId] : undefined;
    const bindingMessage = bound && "message" in bound
        ? remoteStatus?.status === "loading" || registryData?.loadStatus?.fetchInProgress ? "Loading station scenes…" : bound.message
        : undefined;
    const id = component.id ?? "scene3d";
    const detailId = useId();
    const dark = component.theme === "dark" || (!component.theme || component.theme === "auto") && context.settings.theme.mode === "dark";
    const hostRef = useRef<HTMLDivElement>(null);
    const labels = useRef(new Map<string, HTMLElement>());
    const runtimeRef = useRef<SceneRuntime>();
    const syncRuntime = useRef<() => void>();
    const [attempt, setAttempt] = useState(0);
    const [notice, setNotice] = useState<string>();
    const [ready, setReady] = useState(false);
    const [showLabels, setShowLabels] = useState(component.showLabels !== false);
    const [flowPaused, setFlowPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(() => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const [hovered, setHovered] = useState<string>();
    const [focused, setFocused] = useState<string>();
    const [staticSelection, setStaticSelection] = useState<string>();
    const [modelErrors, setModelErrors] = useState<ReadonlyMap<string, string>>(new Map());
    const policy = resolveInteractionPolicy(component, context.config);
    const sourceRows = component.objectIdField ? context.sourceRows : emptyRows;
    const visibleRows = useMemo(() => component.objectIdField ? context.getRowsForComponent(id) : emptyRows,
        [context.getRowsForComponent, id, component.objectIdField]);
    const objects = useMemo(() => resolveSceneObjects(component, sourceRows, visibleRows), [component, sourceRows, visibleRows]);
    const selectedIndices = useMemo(() => new Set(context.componentRows(id)), [context.componentRows, id]);
    const ownKeys = context.state.componentSelectedRowKeys[id];
    const sourceKeys = context.powerBiSourceRowKeys ?? context.sourceRowKeys;
    const own = useMemo(() => {
        const keys = new Set(ownKeys);
        const isOwnSelection = (index: number) => {
            if (context.interactionIndexSpace !== "component" || !context.datasetLineage) return keys.has(context.sourceRowKeys[index]);
            return context.datasetLineage[index]?.some(sourceIndex => keys.has(sourceKeys[sourceIndex]));
        };
        return objects.filter(state => state.object.id === staticSelection || state.indices.some(isOwnSelection));
    }, [objects, staticSelection, ownKeys, context.interactionIndexSpace, context.datasetLineage, context.sourceRowKeys, sourceKeys]);
    const selected = useMemo(() => new Set([...own, ...objects.filter(state => state.indices.some(index => selectedIndices.has(index)))].map(state => state.object.id)),
        [own, objects, selectedIndices]);
    const hasOwn = Boolean(context.state.interactionSignatures[id] || staticSelection);
    const equipment = objects.filter(state => state.visible && state.selectable);
    const detail = objects.find(state => state.visible && state.object.id === (hovered ?? focused)) ?? own.find(state => state.visible);
    const tooltips = component.tooltipFields ?? [];
    const motion = context.config.motion;
    const flowAllowed = Boolean(component.flowField || component.objects.some(object => object.animations?.length)) && motion?.enabled !== false && motion?.reducedMotion !== "always-reduce" &&
        (motion?.reducedMotion === "never-reduce" || !reducedMotion) && (motion?.maxConcurrentAnimations ?? 12) > 0;
    const flowBudget = flowAllowed && !flowPaused ? Math.min(24, motion?.maxConcurrentAnimations ?? 12) : 0;
    useEffect(() => {
        if (!(component.flowField || component.objects.some(object => object.animations?.length)) || typeof matchMedia !== "function") return;
        const query = matchMedia("(prefers-reduced-motion: reduce)");
        const sync = () => setReducedMotion(query.matches);
        sync();
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
    }, [component.flowField, component.objects]);

    function activate(state: SceneObjectState, event: Event) {
        if (component.disabled || !state.visible || !state.selectable) return;
        if (state.object.dataKey === undefined) {
            if (claimInteractionEvent(event)) setStaticSelection(previous => previous === state.object.id ? undefined : state.object.id);
        } else if (state.indices.length) {
            const result = executeComponentInteraction(policy, createInteractionPayload(component, {
                rowIndices: state.indices,
                sourceRowKeys: context.sourceRowKeys,
                field: component.objectIdField,
                value: state.object.dataKey,
                contextRows: state.indices.map(index => context.sourceRows[index]),
            }), context, { trigger: "click", multiSelect: event instanceof MouseEvent && (event.ctrlKey || event.metaKey), event });
            if (result.executed) setStaticSelection(undefined);
        }
    }

    const current = useRef({ component, dark, objects, selected, showLabels, flowBudget, activate });
    current.current = { component, dark, objects, selected, showLabels, flowBudget, activate };
    const hasObjects = objects.length > 0;
    const mountRuntime = Boolean(binding) || hasObjects;
    useEffect(() => {
        const host = hostRef.current;
        if (!host || !mountRuntime) return;
        let cancelled = false;
        let loading = false;
        let visible = typeof IntersectionObserver === "undefined";
        const stop = () => { runtimeRef.current?.dispose(); runtimeRef.current = undefined; };
        const start = async () => {
            if (loading) return;
            loading = true;
            setNotice(undefined);
            try {
                // Power BI packages one visual.js. Vite keeps the engine in a lazy local chunk.
                const { createSceneRuntime } = await import(/* webpackMode: "eager" */ "./sceneRuntime");
                if (cancelled) return;
                if (!current.current.objects.length || !visible) { loading = false; return; }
                const runtime = createSceneRuntime(host, {
                    labels(labelId, point) {
                        const label = labels.current.get(labelId);
                        if (!label) return;
                        label.style.visibility = point ? "visible" : "hidden";
                        if (point) label.style.transform = `translate3d(${point.x}px,${point.y}px,0) translate(-50%,-100%)`;
                    },
                    pick(objectId, event) {
                        const target = current.current.objects.find(state => state.object.id === objectId);
                        if (target) current.current.activate(target, event);
                    },
                    hover: setHovered,
                    modelError(objectId, message) {
                        setModelErrors(previous => {
                            if (previous.get(objectId) === message) return previous;
                            const next = new Map(previous);
                            if (message) next.set(objectId, message); else next.delete(objectId);
                            return next;
                        });
                    },
                    lost() {
                        stop();
                        setReady(false);
                        setNotice("The 3D graphics context was lost.");
                    },
                });
                runtimeRef.current = runtime;
                const state = current.current;
                runtime.configure(state.component, state.dark);
                runtime.update(state.objects, state.selected, state.showLabels, state.flowBudget);
                runtime.setActive(visible && !document.hidden);
                setReady(true);
            } catch {
                if (cancelled) return;
                stop();
                setReady(false);
                setNotice("3D graphics are unavailable in this viewer. WebGL 2 is required.");
            }
        };
        const sync = () => {
            const active = visible && current.current.objects.length > 0 && !document.hidden;
            if (runtimeRef.current) runtimeRef.current.setActive(active);
            else if (active) void start();
        };
        syncRuntime.current = sync;
        const observer = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
        });
        document.addEventListener("visibilitychange", sync);
        if (observer) observer.observe(host); else sync();
        return () => {
            cancelled = true;
            observer?.disconnect();
            document.removeEventListener("visibilitychange", sync);
            syncRuntime.current = undefined;
            stop();
            setReady(false);
        };
    }, [attempt, mountRuntime]);
    useEffect(() => syncRuntime.current?.(), [hasObjects]);
    useEffect(() => setShowLabels(component.showLabels !== false), [component.showLabels]);
    const bindingIdentity = binding?.selectedKeyState;
    const wasBound = useRef(false);
    useLayoutEffect(() => {
        const shouldReset = bindingIdentity || wasBound.current;
        wasBound.current = Boolean(bindingIdentity);
        if (!shouldReset) return;
        setStaticSelection(undefined);
        setHovered(undefined);
        setFocused(undefined);
        runtimeRef.current?.resetInteraction();
        if (context.state.interactionSignatures[id]) clearLocalComponentSelection(id, context);
    }, [bindingIdentity, selectedKey, definition]);
    useLayoutEffect(() => {
        runtimeRef.current?.configure(component, dark);
    }, [component.objects, component.grid, component.shadows, component.view, component.levelField, component.flowField, dark]);
    useLayoutEffect(() => {
        runtimeRef.current?.update(objects, selected, showLabels, flowBudget);
    }, [objects, selected, showLabels, flowBudget, component.grid, component.shadows, component.view, dark]);

    const level = (state: SceneObjectState) => state.level === undefined ? undefined : `${formatValue(state.level)}%`;
    const status = (state: SceneObjectState) => [
        state.status != null ? formatValue(state.status) : state.object.dataKey !== undefined && !state.row ? "No data" : undefined,
        state.level !== undefined ? `Water level ${level(state)}` :
            binding && state.row && state.object.kind === "tank" && component.levelField ? "No level data" : undefined,
    ].filter(Boolean).join(" · ");
    const controlProps = (state: SceneObjectState) => ({
        "aria-pressed": selected.has(state.object.id),
        "aria-describedby": detail === state && (status(state) || state.row && tooltips.length) ? detailId : undefined,
        disabled: component.disabled || state.object.dataKey !== undefined && !state.row,
        onClick: (event: MouseEvent) => activate(state, event),
        onFocus: () => setFocused(state.object.id),
        onBlur: () => setFocused(undefined),
    });
    const viewport = <div class={`hp-scene3d ${dark ? "hp-scene3d-dark" : ""}`} aria-label={component.ariaLabel ?? component.title ?? "Interactive 3D scene"}>
        {component.showObjectList !== false && equipment.length > 0 && <aside class="hp-scene3d-objects" aria-label="Scene objects">
            <div class="hp-scene3d-index-heading">Equipment <span>{equipment.length.toString().padStart(2, "0")}</span></div>
            <div class="hp-scene3d-object-list">
                {equipment.map(state => <button key={state.object.id} type="button" {...controlProps(state)}>
                    <i style={{ backgroundColor: state.color }} />
                    <span><strong>{state.label}</strong>{status(state) && <small>{status(state)}</small>}</span>
                </button>)}
            </div>
            {hasOwn && <button type="button" class="hp-scene3d-clear" onClick={() => {
                setStaticSelection(undefined);
                if (context.state.interactionSignatures[id]) clearComponentInteraction(policy, id, context);
            }}>Clear selection</button>}
        </aside>}
        <div class="hp-scene3d-stage" style={{ "--hp-scene-height": `${component.height ?? 420}px` }}>
            <div class="hp-scene3d-canvas" ref={hostRef} style={{ visibility: hasObjects ? undefined : "hidden" }} />
            {ready && hasObjects && <>
                <div class="hp-scene3d-tools" aria-label="3D view controls">
                    <button type="button" onClick={() => runtimeRef.current?.fit("isometric")}>Isometric</button>
                    <button type="button" onClick={() => runtimeRef.current?.fit("top")}>Top view</button>
                    <button type="button" onClick={() => runtimeRef.current?.fit(component.view ?? "isometric")}>Reset view</button>
                    <button type="button" aria-pressed={showLabels} onClick={() => setShowLabels(!showLabels)}>Labels</button>
                    {flowAllowed && <button type="button" onClick={() => setFlowPaused(!flowPaused)}>{flowPaused ? "Play flow" : "Pause flow"}</button>}
                </div>
                <div class="hp-scene3d-labels">
                    {objects.filter(state => showLabels && state.visible && (state.object.label || state.selectable)).map(state => {
                        const ref = (element: HTMLElement | null) => {
                            if (element) labels.current.set(state.object.id, element);
                            else labels.current.delete(state.object.id);
                        };
                        const tag = <><i style={{ backgroundColor: state.color }} />{state.label}{state.level !== undefined && ` · ${level(state)}`}</>;
                        return state.selectable
                            ? <button type="button" key={state.object.id} ref={ref} {...controlProps(state)}>{tag}</button>
                            : <span key={state.object.id} ref={ref}>{tag}</span>;
                    })}
                </div>
                <div class="hp-scene3d-hint">Drag to orbit · Shift-drag to pan · Scroll to zoom</div>
            </>}
            {(!ready || !hasObjects) && <div class="hp-scene3d-message" role="status">
                {!hasObjects ? bindingMessage ?? (binding ? "The selected scene has no objects." : "Add objects in the Scene editor to build a 3D view.") : notice ?? "Loading 3D view…"}
                {hasObjects && notice && <button type="button" onClick={() => setAttempt(attempt + 1)}>Retry 3D view</button>}
            </div>}
            {(modelErrors.size > 0 || telemetry?.warning) && <div class="hp-scene3d-model-error" role="status">
                {modelErrors.size === 0 ? telemetry?.warning
                    : modelErrors.size === 1 ? `${objects.find(state => modelErrors.has(state.object.id))?.label ?? "Model"} · ${modelErrors.values().next().value}`
                        : `${modelErrors.size} models could not be rendered. Re-import supported GLB or glTF files.`}
            </div>}
            {detail && (status(detail) || detail.row && tooltips.length) ? <div class="hp-scene3d-detail" id={detailId}>
                <strong>{detail.label}</strong>
                {status(detail) && <small>{status(detail)}</small>}
                {detail.row && tooltips.length ? <dl>
                    {tooltips.map((item, index) => {
                        const field = typeof item === "string" ? item : item.field;
                        const label = typeof item === "string" ? undefined : item.label;
                        const value = detail.row?.[field];
                        return <div key={index}><dt>{label ?? context.data.fields[field]?.displayName ?? field}</dt><dd>{binding && value == null ? "No data" : formatValue(value)}</dd></div>;
                    })}
                </dl> : null}
            </div> : null}
        </div>
    </div>;
    return component.frameless ? viewport : <Card title={component.title} className="hp-scene3d-card">{viewport}</Card>;
}
