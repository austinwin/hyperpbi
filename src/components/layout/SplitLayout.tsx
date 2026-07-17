import { Fragment, type ComponentChildren } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { ContainerComponent, DashboardComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { adjacentPaneBounds, normalizePaneSizes, resizeAdjacentPanes, validPersistedPaneSizes } from "./splitPaneSizing";

type PersistMode = NonNullable<ContainerComponent["persist"]>;

function storageFor(mode: PersistMode): Storage | undefined {
    try {
        if (mode === "local") return globalThis.localStorage;
        if (mode === "session") return globalThis.sessionStorage;
    } catch {
        // Sandboxed hosts may deny storage. The split remains fully functional.
    }
    return undefined;
}

function readPersistedSizes(mode: PersistMode, key: string, count: number, minimums?: readonly number[], maximums?: readonly number[]): number[] | undefined {
    try {
        const raw = storageFor(mode)?.getItem(key);
        return raw ? validPersistedPaneSizes(JSON.parse(raw), count, minimums, maximums) : undefined;
    } catch {
        return undefined;
    }
}

function writePersistedSizes(mode: PersistMode, key: string, sizes: readonly number[]): void {
    try {
        storageFor(mode)?.setItem(key, JSON.stringify(sizes.map(value => Math.round(value * 1000) / 1000)));
    } catch {
        // Persistence is progressive enhancement in restricted Power BI hosts.
    }
}

export function SplitLayout({
    component,
    renderChildren,
}: {
    component: ContainerComponent;
    renderChildren: (children: DashboardComponent[]) => ComponentChildren;
}) {
    const context = useRenderContext();
    const children = component.children ?? [];
    const count = children.length;
    const persistMode: PersistMode = component.resizable === true ? component.persist ?? "local" : "none";
    const storageKey = `hyperpbi:${context.instanceId ?? "dashboard"}:split:${component.storageKey ?? component.id ?? "split"}`;
    const defaultSizes = useMemo(() => normalizePaneSizes(component.sizes, count, component.minSizes, component.maxSizes), [component.sizes, component.minSizes, component.maxSizes, count]);
    const configurationSignature = JSON.stringify([persistMode, storageKey, defaultSizes, component.minSizes, component.maxSizes, count]);
    const [sizes, setSizes] = useState<number[]>(() => readPersistedSizes(persistMode, storageKey, count, component.minSizes, component.maxSizes) ?? defaultSizes);
    const [orientation, setOrientation] = useState<"horizontal" | "vertical">(component.direction === "column" ? "vertical" : "horizontal");
    const sizesRef = useRef(sizes);
    const previousConfigurationRef = useRef(configurationSignature);
    const containerRef = useRef<HTMLDivElement>(null);
    const publishFrameRef = useRef<number>();
    const dragFrameRef = useRef<number>();
    const pendingSizesRef = useRef<number[]>();
    const activeDragAbortRef = useRef<AbortController>();
    sizesRef.current = sizes;

    useEffect(() => {
        if (previousConfigurationRef.current === configurationSignature && sizesRef.current.length === count) return;
        previousConfigurationRef.current = configurationSignature;
        const next = readPersistedSizes(persistMode, storageKey, count, component.minSizes, component.maxSizes) ?? defaultSizes;
        sizesRef.current = next;
        setSizes(next);
    }, [configurationSignature, defaultSizes, count, persistMode, storageKey]);

    const publishResize = () => {
        const node = containerRef.current;
        if (!node) return;
        const nextOrientation = getComputedStyle(node).flexDirection === "column" ? "vertical" : "horizontal";
        setOrientation(current => current === nextOrientation ? current : nextOrientation);
        node.dispatchEvent(new CustomEvent("hyperpbi:layout-resize", {
            bubbles: true,
            detail: { componentId: component.id, sizes: [...sizesRef.current] },
        }));
    };

    useEffect(() => {
        const node = containerRef.current;
        if (!node || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => {
            if (publishFrameRef.current !== undefined) cancelAnimationFrame(publishFrameRef.current);
            publishFrameRef.current = requestAnimationFrame(() => {
                publishFrameRef.current = undefined;
                publishResize();
            });
        });
        observer.observe(node);
        return () => {
            observer.disconnect();
            if (publishFrameRef.current !== undefined) cancelAnimationFrame(publishFrameRef.current);
        };
    }, [component.id]);

    useEffect(() => publishResize(), [sizes]);

    useEffect(() => () => {
        activeDragAbortRef.current?.abort();
        if (dragFrameRef.current !== undefined) cancelAnimationFrame(dragFrameRef.current);
    }, []);

    const commit = (next: number[], persist = false) => {
        pendingSizesRef.current = undefined;
        sizesRef.current = next;
        setSizes(next);
        if (persist && persistMode !== "none") writePersistedSizes(persistMode, storageKey, next);
    };

    const resizeBy = (handleIndex: number, deltaPercent: number, persist = false) => {
        commit(resizeAdjacentPanes(sizesRef.current, handleIndex, deltaPercent, component.minSizes, component.maxSizes), persist);
    };

    const startPointerResize = (event: PointerEvent, handleIndex: number) => {
        if (component.resizable !== true || !containerRef.current) return;
        event.preventDefault();
        const container = containerRef.current;
        const computedDirection = getComputedStyle(container).flexDirection;
        const vertical = computedDirection === "column";
        const startCoordinate = vertical ? event.clientY : event.clientX;
        const length = Math.max(1, vertical ? container.clientHeight : container.clientWidth);
        const startSizes = [...sizesRef.current];
        activeDragAbortRef.current?.abort();
        const dragAbort = new AbortController();
        activeDragAbortRef.current = dragAbort;
        const move = (moveEvent: PointerEvent) => {
            const coordinate = vertical ? moveEvent.clientY : moveEvent.clientX;
            const deltaPercent = (coordinate - startCoordinate) / length * 100;
            pendingSizesRef.current = resizeAdjacentPanes(startSizes, handleIndex, deltaPercent, component.minSizes, component.maxSizes);
            if (dragFrameRef.current !== undefined) return;
            dragFrameRef.current = requestAnimationFrame(() => {
                dragFrameRef.current = undefined;
                if (pendingSizesRef.current) commit(pendingSizesRef.current);
            });
        };
        const end = (endEvent: PointerEvent) => {
            move(endEvent);
            if (dragFrameRef.current !== undefined) {
                cancelAnimationFrame(dragFrameRef.current);
                dragFrameRef.current = undefined;
            }
            commit(pendingSizesRef.current ?? sizesRef.current, true);
            dragAbort.abort();
            if (activeDragAbortRef.current === dragAbort) activeDragAbortRef.current = undefined;
        };
        globalThis.addEventListener("pointermove", move, { signal: dragAbort.signal });
        globalThis.addEventListener("pointerup", end, { signal: dragAbort.signal });
        globalThis.addEventListener("pointercancel", end, { signal: dragAbort.signal });
    };

    if (!count) return <Fragment>{component.title && <h3 class="hp-section-title hp-split-title">{component.title}</h3>}<div class="hp-split hp-split-empty" /></Fragment>;

    return (
        <Fragment>
        {component.title && <h3 class="hp-section-title hp-split-title">{component.title}</h3>}
        <div ref={containerRef} class={`hp-split ${component.resizable === true ? "is-resizable" : ""}`}>
            {children.map((child, index) => {
                const preceding = sizes.slice(0, index).reduce((sum, value) => sum + value, 0);
                const bounds = adjacentPaneBounds(sizes, index, component.minSizes, component.maxSizes);
                return <Fragment key={child.id ?? index}>
                    <div
                        class="hp-split-pane"
                        style={{ "--hp-pane-size": sizes[index] ?? 0 }}
                    >
                        {renderChildren([child])}
                    </div>
                    {index < count - 1 && component.resizable === true && (
                        <div
                            class="hp-split-handle"
                            role="separator"
                            tabIndex={0}
                            aria-orientation={orientation}
                            aria-label={`Resize ${component.title ?? component.id ?? "split"} pane ${index + 1}`}
                            aria-valuemin={Math.round(preceding + bounds.minimum)}
                            aria-valuemax={Math.round(preceding + bounds.maximum)}
                            aria-valuenow={Math.round(sizes.slice(0, index + 1).reduce((sum, value) => sum + value, 0))}
                            onPointerDown={(pointerEvent) => startPointerResize(pointerEvent as unknown as PointerEvent, index)}
                            onDblClick={() => commit(defaultSizes, true)}
                            onKeyDown={(keyboardEvent) => {
                                const direction = containerRef.current ? getComputedStyle(containerRef.current).flexDirection : component.direction;
                                const negative = direction === "column" ? keyboardEvent.key === "ArrowUp" : keyboardEvent.key === "ArrowLeft";
                                const positive = direction === "column" ? keyboardEvent.key === "ArrowDown" : keyboardEvent.key === "ArrowRight";
                                if (!negative && !positive) return;
                                keyboardEvent.preventDefault();
                                resizeBy(index, (positive ? 1 : -1) * (keyboardEvent.shiftKey ? 5 : 1), true);
                            }}
                        >
                            <span aria-hidden="true" />
                        </div>
                    )}
                </Fragment>;
            })}
        </div>
        </Fragment>
    );
}
