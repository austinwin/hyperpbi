// Separate app-shell example (not a component catalog entry).
// This demonstrates the root "app" property.

const appShellExample = {
    version: "1.0",
    title: "Operations Portal",
    theme: {
        mode: "light",
        density: "compact",
        primaryColor: "#206bc4",
        surfaceColor: "#ffffff",
        textColor: "#182433",
        borderColor: "#dce1e7",
        radius: 8,
        cardPadding: 12,
        gap: 10
    },
    app: {
        enabled: true,
        layout: "vertical",
        container: "fluid",
        stickyHeader: true,
        contentPadding: "compact",
        brand: {
            title: "HyperPBI",
            shortTitle: "HP",
            subtitle: "Operations Analytics",
            icon: "dashboard"
        },
        navbar: {
            visible: true,
            showSidebarToggle: true,
            showSearch: true,
            searchPlaceholder: "Search dashboard...",
            actions: [
                {
                    id: "refresh_action",
                    ariaLabel: "Refresh view",
                    icon: "refresh",
                    action: {
                        type: "showToast",
                        title: "Dashboard",
                        message: "The current Power BI data is displayed.",
                        intent: "primary",
                        durationMs: 3000
                    }
                }
            ],
            user: {
                name: "Operations Team",
                subtitle: "Dashboard Viewer",
                initials: "OT",
                status: "online",
                menu: [
                    {
                        id: "settings_item",
                        label: "Dashboard settings",
                        icon: "settings",
                        action: {
                            type: "openOverlay",
                            target: "settings_modal"
                        }
                    }
                ]
            }
        },
        sidebar: {
            visible: true,
            width: 248,
            collapsedWidth: 64,
            collapsible: true,
            defaultCollapsed: false,
            navigation: [
                {
                    id: "overview_nav",
                    label: "Overview",
                    icon: "dashboard",
                    action: {
                        type: "setTab",
                        target: "main_tabs",
                        value: "overview"
                    }
                },
                {
                    id: "analysis_nav",
                    label: "Analysis",
                    icon: "chart",
                    children: [
                        {
                            id: "trends_nav",
                            label: "Trends",
                            icon: "activity",
                            action: {
                                type: "setTab",
                                target: "main_tabs",
                                value: "trends"
                            }
                        },
                        {
                            id: "records_nav",
                            label: "Records",
                            icon: "table",
                            action: {
                                type: "setTab",
                                target: "main_tabs",
                                value: "records"
                            }
                        }
                    ]
                }
            ],
            footer: {
                title: "Operations Workspace",
                subtitle: "Power BI"
            }
        },
        pageHeader: {
            visible: true,
            title: "Executive Overview",
            subtitle: "Current operational performance and exceptions",
            breadcrumbs: [
                { id: "home_crumb", label: "Home" },
                { id: "operations_crumb", label: "Operations" }
            ],
            meta: [
                { label: "Status", value: "Current", icon: "check", intent: "success" }
            ],
            actions: [
                {
                    id: "filter_action",
                    label: "Filters",
                    icon: "filter",
                    variant: "outline",
                    action: {
                        type: "openOverlay",
                        target: "filter_panel"
                    }
                }
            ]
        },
        footer: {
            visible: true,
            text: "HyperPBI Operations Dashboard",
            secondaryText: "Data is controlled by the Power BI semantic model."
        }
    },
    components: [
        {
            type: "tabs",
            id: "main_tabs",
            span: 12,
            tabs: [
                { id: "overview", title: "Overview", children: [] },
                { id: "records", title: "Records", children: [] }
            ],
            interaction: { enabled: false, internalMode: "none", externalMode: "none" }
        }
    ]
};

export const appShellJsonExample = JSON.stringify(appShellExample, null, 2);
