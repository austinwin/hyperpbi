import { useCallback, useRef } from "preact/hooks";
import type { DropdownComponent } from "../../schema/hyperpbiSchema";
import type { OverlayAnchor } from "../../render/stateStore";
import { useRenderContext } from "../../render/RenderContext";
import { MenuList } from "./MenuList";
import { useOverlayDismiss } from "./useOverlayDismiss";
import { useOverlayFocus } from "./useOverlayFocus";
import { useAnchoredOverlayPosition } from "./useAnchoredOverlayPosition";

export function DropdownOverlay({ component, anchor }: { component: DropdownComponent; anchor?: OverlayAnchor }) {
    const context = useRenderContext(); const panelRef = useRef<HTMLDivElement>(null); const id = component.id!;
    const close = useCallback(() => context.dispatch({ type: "closeOverlay", id }), [context.dispatch, id]);
    const position = useAnchoredOverlayPosition(id, anchor, panelRef, component.placement ?? "bottom-start");
    useOverlayFocus(id, panelRef, { focusFirst: true, restore: true });
    useOverlayDismiss(id, close, { outside: true, escape: true, closeOnTab: true });
    return (
        <div
            ref={panelRef}
            id={`${id}-panel`}
            class="hp-dropdown-panel"
            data-placement={position?.placement}
            style={{ position: "fixed", top: position?.top ?? 0, left: position?.left ?? 0, maxHeight: position?.maxHeight, visibility: position ? "visible" : "hidden" }}
            tabIndex={-1}
        >
            <MenuList items={component.items} overlayId={id} closeOnSelect={component.closeOnSelect !== false} onClose={close} />
        </div>
    );
}
