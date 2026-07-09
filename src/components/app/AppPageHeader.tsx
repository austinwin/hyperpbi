import { h } from "preact";
import type { AppPageHeaderConfig } from "../../schema/uiSchema";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";

export function AppPageHeader({ config }: { config: AppPageHeaderConfig }) {
    const context = useRenderContext();

    return (
        <div class="hp-page-header">
            <div class="hp-page-header-start">
                {config.breadcrumbs && config.breadcrumbs.length > 0 && (
                    <nav class="hp-breadcrumbs" aria-label="Breadcrumb">
                        <ol>
                            {config.breadcrumbs.map((crumb, index) => (
                                <li key={crumb.id ?? `crumb_${index}`} class={index === config.breadcrumbs!.length - 1 ? "hp-breadcrumb-active" : ""}>
                                    {crumb.action ? (
                                        <button type="button" class="hp-breadcrumb-link" onClick={() => context.executeUiAction(crumb.action!)}>
                                            {crumb.label}
                                        </button>
                                    ) : (
                                        <span>{crumb.label}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
                <div class="hp-page-header-titles">
                    {config.title && <h1 class="hp-page-header-title">{config.title}</h1>}
                    {config.subtitle && <p class="hp-page-header-subtitle">{config.subtitle}</p>}
                </div>
                {config.meta && config.meta.length > 0 && (
                    <div class="hp-page-header-meta">
                        {config.meta.map((meta, index) => (
                            <span key={index} class={`hp-meta-item hp-meta-${meta.intent ?? "neutral"}`}>
                                {meta.icon && <Icon name={meta.icon} size="xs" decorative />}
                                <span class="hp-meta-label">{meta.label}</span>
                                {meta.value && <span class="hp-meta-value">{meta.value}</span>}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            {config.actions && config.actions.length > 0 && (
                <div class="hp-page-header-actions">
                    {config.actions.map(action => (
                        <button
                            key={action.id}
                            type="button"
                            class={`btn btn-sm ${action.variant ? `hp-btn-${action.variant}` : ""}`}
                            aria-label={action.ariaLabel ?? action.label}
                            disabled={false}
                            onClick={() => {
                                if (action.action) {
                                    context.executeUiAction(action.action);
                                }
                                if (action.menu) {
                                    // Trigger the dropdown menu
                                    context.executeUiAction({ type: "toggleOverlay", target: action.id });
                                }
                            }}
                        >
                            {action.icon && <Icon name={action.icon} size="xs" decorative />}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
