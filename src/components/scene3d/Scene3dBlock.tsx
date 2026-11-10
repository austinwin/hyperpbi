import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { Card } from "../layout/LayoutBlocks";
import { useRenderContext } from "../../render/RenderContext";
import { clearComponentInteraction, executeComponentInteraction } from "../../interactions/componentInteraction";
import { claimInteractionEvent, createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import type { Scene3dComponent } from "../../schema/scene3dSchema";
import { formatValue } from "../../utils/formatValue";
import { resolveSceneObjects, type SceneObjectState } from "./sceneData";
import type { SceneRuntime } from "./sceneRuntime";

export function Scene3dBlock({ component }: { component: Scene3dComponent }) {
    const context = useRenderContext();
    const id = component.id ?? "scene3d";
    const detailId = useId();
    const dark = component.theme === "dark" || (!component.theme || component.theme === "auto") && context.settings.theme.mode === "dark";
    const hostRef = useRef<HTMLDivElement>(null);
    const labels = useRef(new Map<string, HTMLElement>());
    const runtimeRef = useRef<SceneRuntime>();
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
    const visibleRows = useMemo(() => context.getRowsForComponent(id), [context.getRowsForComponent, id]);
    const objects = useMemo(() => resolveSceneObjects(component, context.sourceRows, visibleRows), [component, context.sourceRows, visibleRows]);
    const selectedIndices = new Set(context.componentRows(id));
    const ownKeys = new Set(context.state.componentSelectedRowKeys[id]);
    const sourceKeys = context.powerBiSourceRowKeys ?? context.sourceRowKeys;
    const isOwnSelection = (index: number) => {
        if (context.interactionIndexSpace !== "component" || !context.datasetLineage) return ownKeys.has(context.sourceRowKeys[index]);
        return context.datasetLineage[index]?.some(sourceIndex => ownKeys.has(sourceKeys[sourceIndex]));
    };
    const own = objects.filter(state => state.object.id === staticSelection || state.indices.some(isOwnSelection));
    const selected = new Set([...own, ...objects.filter(state => state.indices.some(index => selectedIndices.has(index)))].map(state => state.object.id));
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
    useEffect(() => {
        const host = hostRef.current;
        if (!host || !hasObjects) return;
        let cancelled = false;
        let loading = false;
        let visible = true;
        const stop = () => { runtimeRef.current?.dispose(); runtimeRef.current = undefined; };
        const start = async () => {
            if (loading) return;
            loading = true;
            setNotice(undefined);
            try {
                // Power BI packages one visual.js. Vite keeps the engine in a lazy local chunk.
                const { createSceneRuntime } = await import(/* webpackMode: "eager" */ "./sceneRuntime");
                if (cancelled) return;
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
                runtime.setActive(visible);
                setReady(true);
            } catch {
                if (cancelled) return;
                stop();
                setReady(false);
                setNotice("3D graphics are unavailable in this viewer. WebGL 2 is required.");
            }
        };
        const observer = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            runtimeRef.current?.setActive(visible);
            if (visible) void start();
        });
        if (observer) observer.observe(host); else void start();
        return () => {
            cancelled = true;
            observer?.disconnect();
            stop();
            setReady(false);
        };
    }, [attempt, hasObjects]);
    useEffect(() => setShowLabels(component.showLabels !== false), [component.showLabels]);
    useLayoutEffect(() => {
        runtimeRef.current?.configure(component, dark);
    }, [component.objects, component.grid, component.shadows, component.view, component.levelField, component.flowField, dark]);
    useLayoutEffect(() => {
        runtimeRef.current?.update(objects, selected, showLabels, flowBudget);
    });

    const level = (state: SceneObjectState) => state.level === undefined ? undefined : `${formatValue(state.level)}%`;
    const status = (state: SceneObjectState) => [
        state.status != null ? formatValue(state.status) : state.object.dataKey !== undefined && !state.row ? "No data" : undefined,
        state.level === undefined ? undefined : `Water level ${level(state)}`,
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
            <div class="hp-scene3d-canvas" ref={hostRef} />
            {ready && <>
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
            {!ready && <div class="hp-scene3d-message" role="status">
                {!hasObjects ? "Add objects in the Scene editor to build a 3D view." : notice ?? "Loading 3D view…"}
                {hasObjects && notice && <button type="button" onClick={() => setAttempt(attempt + 1)}>Retry 3D view</button>}
            </div>}
            {modelErrors.size > 0 && <div class="hp-scene3d-model-error" role="status">
                {modelErrors.size === 1 ? `${objects.find(state => modelErrors.has(state.object.id))?.label ?? "Model"} · ${modelErrors.values().next().value}`
                    : `${modelErrors.size} models could not be rendered. Re-import supported GLB or glTF files.`}
            </div>}
            {detail && (status(detail) || detail.row && tooltips.length) ? <div class="hp-scene3d-detail" id={detailId}>
                <strong>{detail.label}</strong>
                {status(detail) && <small>{status(detail)}</small>}
                {detail.row && tooltips.length ? <dl>
                    {tooltips.map((item, index) => {
                        const field = typeof item === "string" ? item : item.field;
                        const label = typeof item === "string" ? undefined : item.label;
                        return <div key={index}><dt>{label ?? context.data.fields[field]?.displayName ?? field}</dt><dd>{formatValue(detail.row?.[field])}</dd></div>;
                    })}
                </dl> : null}
            </div> : null}
        </div>
    </div>;
    return component.frameless ? viewport : <Card title={component.title} className="hp-scene3d-card">{viewport}</Card>;
}
