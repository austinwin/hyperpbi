import { h } from "preact";
import { DashboardState, DashboardAction } from "../../render/stateStore";
import type { AppNavbarConfig, AppBrandConfig } from "../../schema/uiSchema";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";
import type { DropdownComponent } from "../../schema/hyperpbiSchema";
import { OverlayTrigger } from "../overlays/OverlayTrigger";

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
                {config.actions?.map((action, actionIndex) => {
                    const content = <>{action.icon && <Icon name={action.icon} size="sm" decorative />}{action.label && <span class="hp-navbar-action-label">{action.label}</span>}{action.badge !== undefined && <span class="badge hp-badge">{action.badge}</span>}</>;
                    if (action.menu?.length) {
                        const dropdown: DropdownComponent = { type: "dropdown", id: `hp-navbar-action-${action.id.replace(/[^A-Za-z0-9_-]/g, "-")}-${actionIndex}`, items: action.menu, placement: "bottom-end", trigger: { ariaLabel: action.ariaLabel ?? action.label ?? action.id, variant: action.variant } };
                        return <OverlayTrigger key={action.id} component={dropdown} className={`hp-navbar-action hp-btn-icon ${action.variant ? `hp-variant-${action.variant}` : ""}`}>{content}</OverlayTrigger>;
                    }
                    return <button key={action.id} type="button" class={`hp-navbar-action hp-btn-icon ${action.variant ? `hp-variant-${action.variant}` : ""}`} aria-label={action.ariaLabel ?? action.label ?? action.id} title={action.ariaLabel ?? action.label} onClick={event => action.action && context.executeUiAction(action.action, event)}>{content}</button>;
                })}

                {config.notifications && (() => {
                    const dropdown: DropdownComponent = { type: "dropdown", id: "hp-navbar-notifications", placement: "bottom-end", trigger: { ariaLabel: `Notifications${config.notifications?.count ? ` (${config.notifications.count})` : ""}` }, items: (config.notifications.items ?? []).map(item => ({ id: item.id, label: [item.title, item.message, item.time].filter(Boolean).join(" — "), badge: item.read === false ? "New" : undefined, action: item.action })) };
                    return dropdown.items.length ? <OverlayTrigger component={dropdown} className="hp-navbar-action hp-btn-icon"><Icon name="bell" size="sm" decorative />{config.notifications.count ? <span class="badge bg-red hp-notification-badge">{config.notifications.count}</span> : null}</OverlayTrigger> : <button type="button" class="hp-navbar-action hp-btn-icon" aria-label={dropdown.trigger?.ariaLabel} disabled><Icon name="bell" size="sm" decorative /></button>;
                })()}

                {config.user && (
                    <div class="hp-navbar-user">
                        {config.user.menu?.length ? <OverlayTrigger component={{ type: "dropdown", id: "hp-navbar-user", items: config.user.menu, placement: "bottom-end", trigger: { ariaLabel: `${config.user.name} menu` } }} className="hp-navbar-user-btn">
                            <span class="hp-avatar hp-avatar-sm hp-avatar-circle">
                                {config.user.initials ?? config.user.name.charAt(0)}
                            </span>
                            <span class="hp-navbar-user-name">{config.user.name}</span>
                        </OverlayTrigger> : <div class="hp-navbar-user-btn"><span class="hp-avatar hp-avatar-sm hp-avatar-circle">{config.user.initials ?? config.user.name.charAt(0)}</span><span class="hp-navbar-user-name">{config.user.name}</span></div>}
                    </div>
                )}
            </div>
        </header>
    );
}
