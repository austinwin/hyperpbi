import { useCallback, useRef } from "preact/hooks";
import type { OffcanvasComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { DashboardRenderer } from "../../render/DashboardRenderer";
import { Icon } from "../icons/Icon";
import { useOverlayDismiss } from "./useOverlayDismiss";
import { useOverlayFocus } from "./useOverlayFocus";

export function OffcanvasOverlay({ component, stackIndex }: { component: OffcanvasComponent; stackIndex: number }) {
    const context = useRenderContext(); const panelRef = useRef<HTMLElement>(null); const id = component.id!;
    const close = useCallback(() => context.dispatch({ type: "closeOverlay", id }), [context.dispatch, id]);
    useOverlayFocus(id, panelRef, { trap: component.backdrop !== false, focusFirst: true, restore: true });
    useOverlayDismiss(id, close, { outside: false, escape: true });
    const viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth;
    const width = Math.min(Math.max(component.width ?? 360, 240), Math.max(240, viewportWidth - 24));
    return (
        <div class={`hp-offcanvas-backdrop ${component.backdrop === false ? "hp-offcanvas-backdrop-transparent" : ""}`} style={{ zIndex: 1050 + stackIndex * 10 }} onClick={event => { if (event.target === event.currentTarget && component.backdrop !== false && component.backdropClose !== false) close(); }}>
            <aside ref={panelRef} id={`${id}-panel`} class={`hp-offcanvas hp-offcanvas-${component.position ?? "right"}`} style={{ width: `${width}px` }} role="dialog" aria-modal={component.backdrop !== false ? "true" : "false"} aria-label={component.ariaLabel ?? component.title ?? "Side panel"} tabIndex={-1}>
                <div class="hp-offcanvas-header"><div><h2>{component.title}</h2>{component.subtitle && <p>{component.subtitle}</p>}</div><button type="button" class="hp-btn-icon" aria-label="Close panel" onClick={close}><Icon name="x" size="sm" decorative /></button></div>
                <div class="hp-offcanvas-content"><DashboardRenderer components={component.children ?? []} /></div>
            </aside>
        </div>
    );
}
