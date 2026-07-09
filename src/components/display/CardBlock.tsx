import { h } from "preact";
import type { CardComponent } from "../../schema/hyperpbiSchema";
import { DashboardComponent } from "../../schema/hyperpbiSchema";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";
import { IconButton } from "../display/IconButton";
import { useState } from "preact/hooks";

export function CardBlock({
    component,
    renderChildren,
}: {
    component: CardComponent;
    renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren;
}) {
    const context = useRenderContext();
    const paddingClass = `hp-card-padding-${component.padding ?? "normal"}`;
    const statusIntent = component.status?.intent;
    const statusPosition = component.status?.position ?? "top";
    const [collapsed, setCollapsed] = useState(component.defaultCollapsed ?? false);
    const isCollapsible = component.collapsible === true;

    const cardClasses = [
        "hp-card hp-card-block",
        paddingClass,
        statusIntent ? `hp-card-status-${statusIntent}` : "",
        statusPosition === "left" ? "hp-card-status-left" : "hp-card-status-top",
    ].filter(Boolean).join(" ");

    return (
        <div class={cardClasses}>
            {/* Status accent border */}
            {statusIntent && <div class={`hp-card-status-accent hp-accent-${statusIntent}`} />}

            {/* Header */}
            {(component.header || component.title || component.actions || isCollapsible) && (
                <div class="hp-card-header">
                    <div class="hp-card-header-start">
                        {component.header?.icon && <Icon name={component.header.icon} size="sm" decorative />}
                        <div class="hp-card-header-text">
                            {component.header?.title && <h3 class="hp-card-title">{component.header.title}</h3>}
                            {(component.header?.subtitle || component.subtitle) && (
                                <span class="hp-card-subtitle">{component.header?.subtitle ?? component.subtitle}</span>
                            )}
                        </div>
                    </div>
                    <div class="hp-card-header-end">
                        {component.actions?.map(action => (
                            <button
                                key={action.id}
                                type="button"
                                class={`btn btn-sm ${action.variant ? `hp-btn-${action.variant}` : "hp-btn-ghost"}`}
                                aria-label={action.ariaLabel ?? action.label}
                                onClick={() => {
                                    if (action.action) {
                                        context.executeUiAction(action.action);
                                    }
                                }}
                            >
                                {action.icon && <Icon name={action.icon} size="xs" decorative />}
                                {action.label}
                            </button>
                        ))}
                        {isCollapsible && (
                            <button
                                type="button"
                                class="hp-card-collapse-btn hp-btn-icon"
                                aria-expanded={!collapsed}
                                aria-label={collapsed ? "Expand" : "Collapse"}
                                onClick={() => setCollapsed(prev => !prev)}
                            >
                                <Icon name={collapsed ? "chevron-down" : "chevron-up"} size="xs" decorative />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Body */}
            {!collapsed && (
                <div class="hp-card-body">
                    {component.children && component.children.length > 0 && renderChildren(component.children)}
                </div>
            )}

            {/* Footer */}
            {component.footer && component.footer.length > 0 && !collapsed && (
                <div class="hp-card-footer">
                    {renderChildren(component.footer)}
                </div>
            )}
        </div>
    );
}
