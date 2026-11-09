import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import type { DropdownComponent, PopoverComponent } from "../../schema/hyperpbiSchema";
import { Icon } from "../icons/Icon";
import { useOverlayRuntime, registerOverlayDefinition } from "./overlayRuntime";

export function OverlayTrigger({ component, className, children }: { component: DropdownComponent | PopoverComponent; className?: string; children?: ComponentChildren }) {
    const context = useRenderContext();
    const overlayRuntime = useOverlayRuntime();
    const ref = useRef<HTMLButtonElement>(null);
    const id = component.id;
    const isOpen = Boolean(id && context.state.openOverlays.includes(id));
    useEffect(() => registerOverlayDefinition(overlayRuntime, component), [overlayRuntime, component]);
    useEffect(() => {
        if (!id || !ref.current) return;
        const trigger = ref.current;
        overlayRuntime.triggers.set(id, trigger);
        return () => { if (overlayRuntime.triggers.get(id) === trigger) overlayRuntime.triggers.delete(id); };
    }, [id, overlayRuntime]);
    if (!id) return null;
    const trigger = component.trigger ?? {};
    const activate = (event: Event) => context.executeUiAction({ type: "toggleOverlay", target: id }, event);
    return (
        <button
            ref={ref}
            id={overlayRuntime.domId(id, "trigger")}
            type="button"
            class={className ?? `hp-overlay-trigger ${trigger.variant ? `hp-variant-${trigger.variant}` : ""}`}
            disabled={component.disabled}
            aria-label={trigger.ariaLabel ?? trigger.label ?? component.ariaLabel ?? component.title ?? (component.type === "dropdown" ? "Open menu" : "Open dialog")}
            aria-haspopup={component.type === "dropdown" ? "menu" : "dialog"}
            aria-expanded={isOpen}
            aria-controls={overlayRuntime.domId(id, "panel")}
            onClick={activate}
            onKeyDown={event => {
                if (["Enter", " ", "ArrowDown"].includes(event.key)) { event.preventDefault(); if (!isOpen) activate(event); }
            }}
        >
            {children ?? <>{trigger.icon && <Icon name={trigger.icon} size="sm" decorative />}{trigger.label && <span>{trigger.label}</span>}</>}
        </button>
    );
}
