import { useCallback, useRef } from "preact/hooks";
import type { PopoverComponent } from "../../schema/hyperpbiSchema";
import type { OverlayAnchor } from "../../render/stateStore";
import { useRenderContext } from "../../render/RenderContext";
import { DashboardRenderer } from "../../render/DashboardRenderer";
import { useOverlayDismiss } from "./useOverlayDismiss";
import { useOverlayFocus } from "./useOverlayFocus";
import { useAnchoredOverlayPosition } from "./useAnchoredOverlayPosition";

export function PopoverOverlay({ component, anchor }: { component: PopoverComponent; anchor?: OverlayAnchor }) {
    const context = useRenderContext(); const panelRef = useRef<HTMLDivElement>(null); const id = component.id!;
    const close = useCallback(() => context.dispatch({ type: "closeOverlay", id }), [context.dispatch, id]);
    const position = useAnchoredOverlayPosition(id, anchor, panelRef, component.placement ?? "bottom-start");
    useOverlayFocus(id, panelRef, { focusFirst: true, restore: true });
    useOverlayDismiss(id, close, { outside: component.closeOnOutsideClick !== false, escape: component.closeOnEscape !== false, closeOnTab: false });
    return (
        <div
            ref={panelRef}
            id={`${id}-panel`}
            class="hp-popover-panel"
            data-placement={position?.placement}
            role="dialog"
            aria-label={component.ariaLabel ?? component.title ?? "Contextual information"}
            tabIndex={-1}
            style={{ position: "fixed", top: position?.top ?? 0, left: position?.left ?? 0, width: component.width ? `${component.width}px` : undefined, maxWidth: "calc(100vw - 16px)", maxHeight: position?.maxHeight, visibility: position ? "visible" : "hidden" }}
        >
            {component.title && <div class="hp-popover-title">{component.title}</div>}
            <div class="hp-popover-content"><DashboardRenderer components={component.children ?? []} /></div>
            {component.showArrow !== false && <span class="hp-popover-arrow" aria-hidden="true" />}
        </div>
    );
}
