import { h } from "preact";
import type { EmptyStateComponent } from "../../schema/hyperpbiSchema";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";

export function EmptyStateBlock({ component }: { component: EmptyStateComponent }) {
    const context = useRenderContext();
    const compact = component.compact ?? false;

    return (
        <div class={`hp-empty-state ${compact ? "hp-empty-compact" : ""}`}>
            {component.icon && (
                <div class="hp-empty-icon">
                    <Icon name={component.icon} size="lg" decorative />
                </div>
            )}
            {component.title && <h3 class="hp-empty-title">{component.title}</h3>}
            {component.description && <p class="hp-empty-description">{component.description}</p>}
            <div class="hp-empty-actions">
                {component.primaryAction && (
                    <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        onClick={() => context.executeUiAction(component.primaryAction!)}
                    >
                        {component.primaryAction.title ?? "Action"}
                    </button>
                )}
                {component.secondaryAction && (
                    <button
                        type="button"
                        class="btn btn-sm hp-btn-ghost"
                        onClick={() => context.executeUiAction(component.secondaryAction!)}
                    >
                        {component.secondaryAction.title ?? "Cancel"}
                    </button>
                )}
            </div>
        </div>
    );
}
