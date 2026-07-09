import { h } from "preact";
import type { IconButtonComponent } from "../../schema/hyperpbiSchema";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";

export function IconButton({ component }: { component: IconButtonComponent }) {
    const context = useRenderContext();
    const variant = component.variant ?? "default";
    const size = component.size ?? "md";
    const disabled = component.disabled ?? false;

    const handleClick = (event: Event) => {
        if (disabled) return;
        if (component.uiAction) {
            context.executeUiAction(component.uiAction, event);
        }
    };

    return (
        <button
            type="button"
            class={`hp-icon-button hp-btn-icon hp-variant-${variant} hp-size-${size} ${disabled ? "hp-is-disabled" : ""}`}
            aria-label={component.ariaLabel}
            disabled={disabled}
            title={component.tooltip?.content ?? component.ariaLabel}
            aria-describedby={component.tooltip ? `hp-tooltip-${component.id}` : undefined}
            onClick={handleClick}
        >
            <Icon name={component.icon} size={size} decorative />
            {component.tooltip && (
                <span id={`hp-tooltip-${component.id}`} class="hp-tooltip" role="tooltip">
                    {component.tooltip.content}
                </span>
            )}
        </button>
    );
}
