import { useCallback, useRef } from "preact/hooks";
import type { ModalComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { DashboardRenderer } from "../../render/DashboardRenderer";
import { Icon } from "../icons/Icon";
import { useOverlayDismiss } from "./useOverlayDismiss";
import { useOverlayFocus } from "./useOverlayFocus";

export function ModalOverlay({ component, stackIndex }: { component: ModalComponent; stackIndex: number }) {
    const context = useRenderContext(); const panelRef = useRef<HTMLDivElement>(null); const id = component.id!;
    const close = useCallback(() => context.dispatch({ type: "closeOverlay", id }), [context.dispatch, id]);
    useOverlayFocus(id, panelRef, { trap: true, focusFirst: true, restore: true });
    useOverlayDismiss(id, close, { outside: false, escape: true });
    const titleId = `${id}-title`;
    const descriptionId = component.subtitle ? `${id}-description` : undefined;
    return (
        <div class="hp-modal-backdrop" style={{ zIndex: 1100 + stackIndex * 10 }} onClick={event => { if (event.target === event.currentTarget && component.backdropClose !== false) close(); }}>
            <div ref={panelRef} id={`${id}-panel`} class={`hp-modal hp-modal-${component.size ?? "md"}`} role="dialog" aria-modal="true" aria-labelledby={component.title ? titleId : undefined} aria-label={component.title ? undefined : component.ariaLabel} aria-describedby={descriptionId} tabIndex={-1}>
                <div class="hp-modal-header">
                    <div><h2 id={titleId} class="hp-modal-title">{component.title}</h2>{component.subtitle && <p id={descriptionId} class="hp-modal-description">{component.subtitle}</p>}</div>
                    <button type="button" class="hp-btn-icon" aria-label="Close dialog" onClick={close}><Icon name="x" size="sm" decorative /></button>
                </div>
                <div class="hp-modal-body"><DashboardRenderer components={component.children ?? []} /></div>
                {component.footer?.length ? <div class="hp-modal-footer"><DashboardRenderer components={component.footer} /></div> : null}
            </div>
        </div>
    );
}
