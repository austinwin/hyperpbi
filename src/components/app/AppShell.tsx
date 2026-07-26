import { h, ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
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
    const shellRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>();
    const mobileBreakpoint = app.sidebar?.mobileBreakpoint ?? 800;
    const isMobile = containerWidth !== undefined && containerWidth < mobileBreakpoint;

    useEffect(() => {
        const element = shellRef.current;
        if (!element) return;
        const updateWidth = (width: number) => {
            if (Number.isFinite(width) && width > 0) {
                setContainerWidth(previous => previous === width ? previous : width);
            }
        };
        updateWidth(element.getBoundingClientRect().width);
        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(entries => {
            const entry = entries.find(candidate => candidate.target === element) ?? entries[0];
            if (entry) updateWidth(entry.contentRect.width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [app.enabled]);

    useEffect(() => {
        if (!isMobile && containerWidth !== undefined && mobileSidebarOpen) {
            dispatch({ type: "mobileSidebar", value: false });
        }
    }, [containerWidth, dispatch, isMobile, mobileSidebarOpen]);

    if (!app.enabled) {
        // Without an enabled app shell, render dashboard content directly.
        return <>{children}</>;
    }

    return (
        <div
            ref={shellRef}
            class={`hp-app-shell hp-app-${app.layout} ${containerClass} ${densityClass} ${paddingClass} ${isMobile ? "hp-app-mobile" : ""} ${app.stickyHeader ? "hp-sticky-header" : ""}`}
        >
            {navbarVisible && app.navbar && (
                <AppNavbar
                    config={app.navbar}
                    brand={app.brand}
                    sidebarVisible={sidebarVisible}
                    sidebarCollapsed={sidebarCollapsed}
                    mobile={isMobile}
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
                        mobile={isMobile}
                        state={state}
                        dispatch={dispatch}
                    />
                )}
                <div class="hp-app-content">
                    {pageHeaderVisible && app.pageHeader && (
                        <AppPageHeader config={app.pageHeader} />
                    )}
                    <div class="hp-app-main">
                        {children}
                    </div>
                    {footerVisible && app.footer && (
                        <AppFooter config={app.footer} />
                    )}
                </div>
            </div>
        </div>
    );
}
