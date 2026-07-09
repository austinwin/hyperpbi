import { h } from "preact";
import { DashboardState, DashboardAction } from "../../render/stateStore";
import type { AppNavigationItem } from "../../schema/uiSchema";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";
import { useState } from "preact/hooks";

export function AppNavigation({
    items,
    collapsed,
    state,
    dispatch,
}: {
    items: AppNavigationItem[];
    collapsed: boolean;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
}) {
    const context = useRenderContext();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const activeTab = state.activeTabs["mainTabs"] ?? "";

    return (
        <nav class="hp-app-nav" aria-label="Main navigation">
            <ul>
                {items.map(item => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedGroups[item.id] ?? false;
                    const isActive = !hasChildren && item.action?.type === "setTab" && item.action.value === activeTab;

                    if (hasChildren) {
                        return (
                            <li key={item.id} class={`hp-nav-group ${isExpanded ? "hp-nav-group-expanded" : ""}`}>
                                <button
                                    type="button"
                                    class="hp-nav-item hp-nav-group-toggle"
                                    aria-expanded={isExpanded}
                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                    title={collapsed ? item.label : undefined}
                                >
                                    {item.icon && <Icon name={item.icon} size="sm" decorative />}
                                    {!collapsed && <span class="hp-nav-label">{item.label}</span>}
                                    {!collapsed && <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size="xs" decorative />}
                                </button>
                                {isExpanded && (
                                    <ul class="hp-nav-submenu">
                                        {item.children!.map(child => {
                                            const childActive = child.action?.type === "setTab" && child.action.value === activeTab;
                                            return (
                                                <li key={child.id}>
                                                    <button
                                                        type="button"
                                                        class={`hp-nav-item hp-nav-subitem ${childActive ? "hp-nav-active" : ""}`}
                                                        disabled={child.disabled}
                                                        title={collapsed ? child.label : undefined}
                                                        onClick={() => {
                                                            if (child.action) {
                                                                context.executeUiAction(child.action);
                                                            }
                                                        }}
                                                    >
                                                        {child.icon && <Icon name={child.icon} size="sm" decorative />}
                                                        {!collapsed && <span class="hp-nav-label">{child.label}</span>}
                                                        {child.badge !== undefined && !collapsed && <span class="badge hp-badge">{child.badge}</span>}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    }

                    return (
                        <li key={item.id}>
                            <button
                                type="button"
                                class={`hp-nav-item ${isActive ? "hp-nav-active" : ""}`}
                                disabled={item.disabled}
                                title={collapsed ? item.label : undefined}
                                onClick={() => {
                                    if (item.action) {
                                        context.executeUiAction(item.action);
                                    }
                                }}
                            >
                                {item.icon && <Icon name={item.icon} size="sm" decorative />}
                                {!collapsed && <span class="hp-nav-label">{item.label}</span>}
                                {item.badge !== undefined && !collapsed && <span class="badge hp-badge">{item.badge}</span>}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
