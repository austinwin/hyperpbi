import type { ComponentChildren, JSX } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";

interface Point { x: number; y: number; }
interface View extends Point { scale: number; }
interface Pointer extends Point { target: Element; }

const fittedView: View = { x: 0, y: 0, scale: 1 };
const center: Point = { x: .5, y: .5 };
const zoomStep = 1.25;
const maxScale = 5;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function zoomAt(view: View, factor: number, minScale: number, from: Point, to = from): View {
    const scale = Math.max(minScale, Math.min(maxScale, view.scale * factor));
    const ratio = scale / view.scale;
    return { scale, x: to.x - (from.x - view.x) * ratio, y: to.y - (from.y - view.y) * ratio };
}

interface PanZoomViewportProps {
    resetKey: unknown;
    children?: ComponentChildren;
    markup?: string;
    contentClass?: string;
    contentRole?: JSX.HTMLAttributes<HTMLDivElement>["role"];
    contentLabel?: string;
    minScale?: number;
    dragExclusion?: string;
    fitOnly?: boolean;
}

export function PanZoomViewport({ resetKey, children, markup, contentClass, contentRole, contentLabel,
    minScale = 1, dragExclusion, fitOnly }: PanZoomViewportProps) {
    const viewport = useRef<HTMLDivElement>(null);
    const [view, setView] = useState(fittedView);

    useLayoutEffect(() => {
        setView(fittedView);
        const host = viewport.current!;
        const pointers = new Map<number, Pointer>();
        let moved = false;
        const relative = (point: Point, box: DOMRect): Point => ({
            x: (point.x - box.left) / box.width,
            y: (point.y - box.top) / box.height,
        });

        const wheel = (event: WheelEvent) => {
            const box = host.getBoundingClientRect();
            if (!event.deltaY || !box.width || !box.height) return;
            event.preventDefault();
            const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? box.height : 1;
            const factor = Math.exp(-event.deltaY * units / 450);
            const anchor = relative({ x: event.clientX, y: event.clientY }, box);
            setView(current => zoomAt(current, factor, minScale, anchor));
        };

        const down = (event: PointerEvent) => {
            if (!pointers.size) moved = false;
            const target = event.target;
            if (event.button !== 0 || pointers.size >= 2 || !(target instanceof Element) ||
                target.closest(".hp-pan-zoom-controls") || (dragExclusion && target.closest(dragExclusion))) return;
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, target });
            // Capture on the original target so a tap still clicks the SVG mark.
            target.setPointerCapture(event.pointerId);
            if (pointers.size === 2) moved = true;
        };

        const move = (event: PointerEvent) => {
            const previous = pointers.get(event.pointerId);
            if (!previous) return;
            const next = { x: event.clientX, y: event.clientY, target: previous.target };
            if (!moved && distance(previous, next) < 4) return;
            moved = true;
            const box = host.getBoundingClientRect();
            if (!box.width || !box.height) return;
            pointers.set(event.pointerId, next);
            const other = Array.from(pointers.entries()).find(([id]) => id !== event.pointerId)?.[1];
            if (other) {
                const from = relative(midpoint(previous, other), box);
                const to = relative(midpoint(next, other), box);
                const factor = Math.max(1, distance(next, other)) / Math.max(1, distance(previous, other));
                setView(current => zoomAt(current, factor, minScale, from, to));
            } else {
                setView(current => ({ ...current, x: current.x + (next.x - previous.x) / box.width,
                    y: current.y + (next.y - previous.y) / box.height }));
            }
        };

        const up = (event: PointerEvent) => { pointers.delete(event.pointerId); };
        const click = (event: MouseEvent) => {
            if (moved && event.detail > 0) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        host.addEventListener("wheel", wheel, { passive: false });
        host.addEventListener("pointerdown", down);
        host.addEventListener("pointermove", move);
        host.addEventListener("pointerup", up);
        host.addEventListener("pointercancel", up);
        host.addEventListener("lostpointercapture", up);
        host.addEventListener("click", click, true);
        return () => {
            host.removeEventListener("wheel", wheel);
            host.removeEventListener("pointerdown", down);
            host.removeEventListener("pointermove", move);
            host.removeEventListener("pointerup", up);
            host.removeEventListener("pointercancel", up);
            host.removeEventListener("lostpointercapture", up);
            host.removeEventListener("click", click, true);
            for (const [id, { target }] of pointers) {
                if (target.hasPointerCapture(id)) target.releasePointerCapture(id);
            }
        };
    }, [resetKey, minScale, dragExclusion]);

    return <div class="hp-pan-zoom" ref={viewport}>
        <div class={`hp-pan-zoom-content${contentClass ? ` ${contentClass}` : ""}`} role={contentRole} aria-label={contentLabel}
            style={{ transform: `translate(${view.x * 100}%, ${view.y * 100}%) scale(${view.scale})` }}
            dangerouslySetInnerHTML={markup === undefined ? undefined : { __html: markup }}>{children}</div>
        <div class="hp-pan-zoom-controls" role="group" aria-label="Pan and zoom controls" onClick={event => event.stopPropagation()}>
            {!fitOnly && <>
                <button type="button" aria-label="Zoom in" title="Zoom in" disabled={view.scale >= maxScale}
                    onClick={() => setView(current => zoomAt(current, zoomStep, minScale, center))}>+</button>
                <button type="button" aria-label="Zoom out" title="Zoom out" disabled={view.scale <= minScale}
                    onClick={() => setView(current => zoomAt(current, 1 / zoomStep, minScale, center))}>−</button>
            </>}
            <button type="button" onClick={() => setView(fittedView)}>Fit</button>
        </div>
    </div>;
}
