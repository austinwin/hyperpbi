import { h } from "preact";
import { DashboardState, DashboardAction } from "../../render/stateStore";
import type { AppNavbarConfig, AppBrandConfig } from "../../schema/uiSchema";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";

export function AppNavbar({
    config,
    brand,
    sidebarVisible,
    sidebarCollapsed,
    state,
    dispatch,
}: {
    config: AppNavbarConfig;
    brand?: AppBrandConfig;
    sidebarVisible: boolean;
    sidebarCollapsed: boolean;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
}) {
    const context = useRenderContext();

    const toggleSidebar = () => {
        if (typeof window !== "undefined" && window.innerWidth < 800) {
            dispatch({ type: "mobileSidebar", value: !state.mobileSidebarOpen });
        } else {
            dispatch({ type: "sidebarCollapsed", value: !sidebarCollapsed });
        }
    };

    return (
        <header class="hp-navbar">
            <div class="hp-navbar-start">
                {sidebarVisible && config.showSidebarToggle !== false && (
                    <button
                        type="button"
                        class="hp-navbar-toggle"
                        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        onClick={toggleSidebar}
                    >
                        <Icon name="menu" size="sm" decorative />
                    </button>
                )}
                {brand && (
                    <div class="hp-navbar-brand">
                        {brand.icon && <span class="hp-navbar-brand-icon"><Icon name={brand.icon} size="sm" decorative /></span>}
                        <span class="hp-navbar-brand-title">{brand.shortTitle ?? brand.title}</span>
                        {brand.subtitle && <span class="hp-navbar-brand-subtitle">{brand.subtitle}</span>}
                    </div>
                )}
            </div>

            {config.showSearch && (
                <div class="hp-navbar-search">
                    <input
                        type="search"
                        class="form-control form-control-sm"
                        placeholder={config.searchPlaceholder ?? "Search..."}
                        value={state.search}
                        onInput={(e) => dispatch({ type: "search", value: (e.target as HTMLInputElement).value })}
                    />
                </div>
            )}

            <div class="hp-navbar-end">
                {config.actions?.map(action => (
                    <button
                        key={action.id}
                        type="button"
                        class={`hp-navbar-action hp-btn-icon ${action.variant ? `hp-variant-${action.variant}` : ""}`}
                        aria-label={action.ariaLabel ?? action.label ?? action.id}
                        title={action.ariaLabel ?? action.label}
                        onClick={() => {
                            if (action.action) {
                                context.executeUiAction(action.action);
                            }
                        }}
                    >
                        {action.icon && <Icon name={action.icon} size="sm" decorative />}
                        {action.label && <span class="hp-navbar-action-label">{action.label}</span>}
                        {action.badge !== undefined && <span class="badge hp-badge">{action.badge}</span>}
                    </button>
                ))}

                {config.notifications && (
                    <button
                        type="button"
                        class="hp-navbar-action hp-btn-icon"
                        aria-label={`Notifications${config.notifications.count ? ` (${config.notifications.count})` : ""}`}
                    >
                        <Icon name="bell" size="sm" decorative />
                        {config.notifications.count ? <span class="badge bg-red hp-notification-badge">{config.notifications.count}</span> : null}
                    </button>
                )}

                {config.user && (
                    <div class="hp-navbar-user">
                        <button
                            type="button"
                            class="hp-navbar-user-btn"
                            aria-label={`${config.user.name} menu`}
                        >
                            <span class="hp-avatar hp-avatar-sm hp-avatar-circle">
                                {config.user.initials ?? config.user.name.charAt(0)}
                            </span>
                            <span class="hp-navbar-user-name">{config.user.name}</span>
                        </button>
                        {config.user.menu && config.user.menu.length > 0 && (
                            <div class="hp-navbar-user-menu">
                                {config.user.menu.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        class="hp-menu-item"
                                        disabled={item.disabled}
                                        onClick={() => {
                                            if (item.action) {
                                                context.executeUiAction(item.action);
                                            }
                                        }}
                                    >
                                        {item.icon && <Icon name={item.icon} size="xs" decorative />}
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
