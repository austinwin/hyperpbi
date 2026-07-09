import { h } from "preact";
import { DashboardState, DashboardAction } from "../../render/stateStore";
import type { AppSidebarConfig } from "../../schema/uiSchema";
import { AppNavigation } from "./AppNavigation";
import { Icon } from "../icons/Icon";
import { useRenderContext } from "../../render/RenderContext";

export function AppSidebar({
    config,
    collapsed,
    mobileOpen,
    state,
    dispatch,
}: {
    config: AppSidebarConfig;
    collapsed: boolean;
    mobileOpen: boolean;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
}) {
    const context = useRenderContext();
    const width = config.width ?? 248;
    const collapsedWidth = config.collapsedWidth ?? 64;
    const isMobile = typeof window !== "undefined" && window.innerWidth < (config.mobileBreakpoint ?? 800);

    const closeMobile = () => {
        dispatch({ type: "mobileSidebar", value: false });
    };

    const sidebarClasses = [
        "hp-sidebar-app",
        collapsed && !isMobile ? "hp-sidebar-collapsed" : "",
        isMobile ? "hp-sidebar-mobile" : "",
        mobileOpen && isMobile ? "hp-sidebar-mobile-open" : "",
    ].filter(Boolean).join(" ");

    return (
        <>
            {isMobile && mobileOpen && (
                <div class="hp-sidebar-backdrop" onClick={closeMobile} onKeyDown={(e) => { if (e.key === "Escape") closeMobile(); }} />
            )}
            <aside
                class={sidebarClasses}
                style={{
                    "--hp-sidebar-width": `${width}px`,
                    "--hp-sidebar-collapsed-width": `${collapsedWidth}px`,
                }}
            >
                {isMobile && (
                    <div class="hp-sidebar-mobile-header">
                        <span class="hp-sidebar-title">{config.footer?.title ?? "Navigation"}</span>
                        <button type="button" class="hp-btn-icon" aria-label="Close sidebar" onClick={closeMobile}>
                            <Icon name="close" size="sm" decorative />
                        </button>
                    </div>
                )}
                {config.navigation && config.navigation.length > 0 && (
                    <AppNavigation
                        items={config.navigation}
                        collapsed={collapsed && !isMobile}
                        state={state}
                        dispatch={dispatch}
                    />
                )}
                {config.footer && !collapsed && (
                    <div class="hp-sidebar-footer">
                        {config.footer.title && <span class="hp-sidebar-footer-title">{config.footer.title}</span>}
                        {config.footer.subtitle && <span class="hp-sidebar-footer-subtitle">{config.footer.subtitle}</span>}
                    </div>
                )}
            </aside>
        </>
    );
}
