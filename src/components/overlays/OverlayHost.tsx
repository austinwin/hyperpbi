import { useEffect, useRef } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import type { OffcanvasComponent } from "../../schema/hyperpbiSchema";
import { collectOverlayComponents, normalizeOffcanvas, type OverlayComponent } from "./overlayTypes";
import { overlayRuntime } from "./overlayRuntime";
import { ModalOverlay } from "./ModalOverlay";
import { OffcanvasOverlay } from "./OffcanvasOverlay";
import { DropdownOverlay } from "./DropdownOverlay";
import { PopoverOverlay } from "./PopoverOverlay";

export function OverlayHost() {
    const context = useRenderContext();
    const conditions = useRef(new Map<string, boolean>());
    const overlays = collectOverlayComponents(context.schema);
    overlayRuntime.definitions.forEach((component, id) => overlays.set(id, component));

    useEffect(() => {
        overlays.forEach(component => {
            if (!component.id || component.type !== "offcanvas") return;
            const panel = component as OffcanvasComponent;
            const condition = panel.openWhen === "always" || panel.openWhen === "selectedRow" && context.state.selectedRows.length > 0 || panel.openWhen === "state" && Boolean(panel.stateKey && context.state.values[panel.stateKey]);
            const previous = conditions.current.get(component.id);
            if (previous === undefined) {
                conditions.current.set(component.id, condition);
                if (condition || panel.defaultOpen) context.dispatch({ type: "openOverlay", id: component.id });
            } else if (condition !== previous) {
                conditions.current.set(component.id, condition);
                context.dispatch({ type: condition ? "openOverlay" : "closeOverlay", id: component.id });
            }
        });
    }, [context.schema, context.state.selectedRows.length, context.state.values, context.dispatch]);

    const active = context.state.openOverlays.map(id => overlays.get(id)).filter((component): component is OverlayComponent => Boolean(component));
    overlayRuntime.stack = active.map(component => component.id!);
    if (!active.length) return null;
    return (
        <div class="hp-overlay-host" aria-live="polite">
            {active.map((component, stackIndex) => {
                const id = component.id!; const anchor = context.state.overlayAnchors[id];
                if (component.type === "modal") return <ModalOverlay key={id} component={component} stackIndex={stackIndex} />;
                if (component.type === "dropdown") return <DropdownOverlay key={id} component={component} anchor={anchor} />;
                if (component.type === "popover") return <PopoverOverlay key={id} component={component} anchor={anchor} />;
                return <OffcanvasOverlay key={id} component={normalizeOffcanvas(component)} stackIndex={stackIndex} />;
            })}
        </div>
    );
}
