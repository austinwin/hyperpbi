import { h, ComponentChildren } from "preact";
import { HyperPbiSchema } from "../../schema/hyperpbiSchema";
import { RuntimeSettings } from "../../runtime/runtimeSettings";
import { DashboardState, DashboardAction } from "../../render/stateStore";
import type { ResolvedAppShell } from "../../schema/uiSchema";
import { AppNavbar } from "./AppNavbar";
import { AppSidebar } from "./AppSidebar";
import { AppPageHeader } from "./AppPageHeader";
import { AppFooter } from "./AppFooter";

export function AppShell({
    app,
    schema,
    settings,
    state,
    dispatch,
    children,
}: {
    app: ResolvedAppShell;
    schema: HyperPbiSchema;
    settings: RuntimeSettings;
    state: DashboardState;
    dispatch: (action: DashboardAction) => void;
    children: ComponentChildren;
}) {
    if (!app.enabled) {
        // Without an enabled app shell, render dashboard content directly.
        return <>{children}</>;
    }

    const sidebarCollapsed = state.sidebarCollapsed;
    const mobileSidebarOpen = state.mobileSidebarOpen;
    const sidebarVisible = app.sidebar?.visible !== false;
    const navbarVisible = app.navbar?.visible !== false;
    const pageHeaderVisible = app.pageHeader?.visible !== false;
    const footerVisible = app.footer?.visible !== false;

    const isVertical = app.layout === "vertical";
    const containerClass = app.container === "boxed" ? "hp-app-boxed" : "hp-app-fluid";
    const densityClass = `hp-app-density-${app.density ?? "normal"}`;
    const paddingClass = `hp-app-padding-${app.contentPadding ?? "normal"}`;

    return (
        <div class={`hp-app-shell hp-app-${app.layout} ${containerClass} ${densityClass} ${paddingClass} ${app.stickyHeader ? "hp-sticky-header" : ""}`}>
            {navbarVisible && app.navbar && (
                <AppNavbar
                    config={app.navbar}
                    brand={app.brand}
                    sidebarVisible={sidebarVisible}
                    sidebarCollapsed={sidebarCollapsed}
                    state={state}
                    dispatch={dispatch}
                />
            )}
            <div class="hp-app-body">
                {isVertical && sidebarVisible && app.sidebar && (
                    <AppSidebar
                        config={app.sidebar}
                        collapsed={sidebarCollapsed}
                        mobileOpen={mobileSidebarOpen}
                        state={state}
                        dispatch={dispatch}
                    />
                )}
                <div class="hp-app-content">
                    {pageHeaderVisible && app.pageHeader && (
                        <AppPageHeader config={app.pageHeader} />
                    )}
                    <main class="hp-app-main">
                        {children}
                    </main>
                    {footerVisible && app.footer && (
                        <AppFooter config={app.footer} />
                    )}
                </div>
            </div>
        </div>
    );
}
