import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import type { DropdownComponent, PopoverComponent } from "../../schema/hyperpbiSchema";
import { Icon } from "../icons/Icon";
import { overlayRuntime, registerOverlayDefinition } from "./overlayRuntime";

export function OverlayTrigger({ component, className, children }: { component: DropdownComponent | PopoverComponent; className?: string; children?: ComponentChildren }) {
    const context = useRenderContext();
    const ref = useRef<HTMLButtonElement>(null);
    const id = component.id;
    const isOpen = Boolean(id && context.state.openOverlays.includes(id));
    useEffect(() => registerOverlayDefinition(component), [component]);
    useEffect(() => {
        if (!id || !ref.current) return;
        overlayRuntime.triggers.set(id, ref.current);
        return () => { if (overlayRuntime.triggers.get(id) === ref.current) overlayRuntime.triggers.delete(id); };
    }, [id]);
    if (!id) return null;
    const trigger = component.trigger ?? {};
    const activate = (event: Event) => context.executeUiAction({ type: "toggleOverlay", target: id }, event);
    return (
        <button
            ref={ref}
            id={`${id}-trigger`}
            type="button"
            class={className ?? `hp-overlay-trigger ${trigger.variant ? `hp-variant-${trigger.variant}` : ""}`}
            disabled={component.disabled}
            aria-label={trigger.ariaLabel ?? trigger.label ?? component.ariaLabel ?? component.title ?? (component.type === "dropdown" ? "Open menu" : "Open dialog")}
            aria-haspopup={component.type === "dropdown" ? "menu" : "dialog"}
            aria-expanded={isOpen}
            aria-controls={`${id}-panel`}
            onClick={activate}
            onKeyDown={event => {
                if (["Enter", " ", "ArrowDown"].includes(event.key)) { event.preventDefault(); if (!isOpen) activate(event); }
            }}
        >
            {children ?? <>{trigger.icon && <Icon name={trigger.icon} size="sm" decorative />}{trigger.label && <span>{trigger.label}</span>}</>}
        </button>
    );
}
