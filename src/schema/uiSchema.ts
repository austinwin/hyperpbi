// ── Shared UI primitives and app-shell configuration types ────────────
// Contains ONLY configuration types (no component interfaces)
// to avoid circular dependencies with hyperpbiSchema.ts.

import type { ComponentInteractionDefinition } from "../interactions/interactionTypes";

export type UiVariant =
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "ghost"
    | "outline";

export type UiSize = "xs" | "sm" | "md" | "lg";

export type IconName = string;

export type UiIntent = "neutral" | "primary" | "success" | "warning" | "danger";

// ── UI Actions ────────────────────────────────────────────────────────

export type UiActionType =
    | "clearFilters"
    | "setTab"
    | "setState"
    | "toggleState"
    | "toggleSidebar"
    | "openOverlay"
    | "closeOverlay"
    | "toggleOverlay"
    | "setStep"
    | "nextStep"
    | "previousStep"
    | "showToast"
    | "dismissToast"
    | "scrollTo"
    | "refresh";

export interface UiAction {
    type: UiActionType;
    target?: string;
    value?: unknown;
    message?: string;
    title?: string;
    intent?: UiIntent;
    durationMs?: number;
}

export interface UiActionResult {
    success: boolean;
    message?: string;
}

// ── Menu ──────────────────────────────────────────────────────────────

export interface MenuItem {
    id: string;
    label?: string;
    icon?: IconName;
    badge?: string | number;
    disabled?: boolean;
    divider?: boolean;
    action?: UiAction;
    interaction?: ComponentInteractionDefinition;
    children?: MenuItem[];
}

// ── Tooltip ───────────────────────────────────────────────────────────

export interface TooltipDefinition {
    content: string;
    placement?: "top" | "right" | "bottom" | "left";
    delayMs?: number;
}

// ── Application shell schema ──────────────────────────────────────────

export interface AppShellConfig {
    enabled?: boolean;
    layout?: "vertical" | "horizontal";
    container?: "fluid" | "boxed";
    density?: "compact" | "normal";
    stickyHeader?: boolean;
    contentPadding?: "none" | "compact" | "normal";
    brand?: AppBrandConfig;
    navbar?: AppNavbarConfig;
    sidebar?: AppSidebarConfig;
    pageHeader?: AppPageHeaderConfig;
    footer?: AppFooterConfig;
}

export interface AppBrandConfig {
    title: string;
    subtitle?: string;
    icon?: IconName;
    shortTitle?: string;
}

export interface AppNavbarConfig {
    visible?: boolean;
    showSidebarToggle?: boolean;
    showSearch?: boolean;
    searchPlaceholder?: string;
    actions?: AppActionItem[];
    user?: AppUserConfig;
    notifications?: AppNotificationConfig;
}

export interface AppSidebarConfig {
    visible?: boolean;
    width?: number;
    collapsedWidth?: number;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    mobileBreakpoint?: number;
    navigation?: AppNavigationItem[];
    footer?: AppSidebarFooterConfig;
}

export interface AppSidebarFooterConfig {
    title?: string;
    subtitle?: string;
}

export interface AppPageHeaderConfig {
    visible?: boolean;
    title?: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: AppActionItem[];
    meta?: AppMetaItem[];
}

export interface AppFooterConfig {
    visible?: boolean;
    text?: string;
    secondaryText?: string;
}

export interface BreadcrumbItem {
    id?: string;
    label: string;
    action?: UiAction;
}

export interface AppNavigationItem {
    id: string;
    label: string;
    icon?: IconName;
    badge?: string | number;
    disabled?: boolean;
    action?: UiAction;
    children?: AppNavigationItem[];
}

export interface AppActionItem {
    id: string;
    label?: string;
    ariaLabel?: string;
    icon?: IconName;
    badge?: string | number;
    variant?: UiVariant;
    action?: UiAction;
    menu?: MenuItem[];
}

export interface AppUserConfig {
    name: string;
    subtitle?: string;
    initials?: string;
    status?: "online" | "away" | "busy" | "offline";
    menu?: MenuItem[];
}

export interface AppNotificationConfig {
    count?: number;
    items?: NotificationItem[];
}

export interface NotificationItem {
    id: string;
    title?: string;
    message: string;
    time?: string;
    read?: boolean;
    action?: UiAction;
}

export interface AppMetaItem {
    label: string;
    value?: string;
    icon?: IconName;
    intent?: UiIntent;
}

// ── Resolved application shell ────────────────────────────────────────

export interface ResolvedAppShell {
    enabled: boolean;
    layout: "vertical" | "horizontal";
    container: "fluid" | "boxed";
    density: "compact" | "normal";
    stickyHeader: boolean;
    contentPadding: "none" | "compact" | "normal";
    brand?: AppBrandConfig;
    navbar?: AppNavbarConfig;
    sidebar?: AppSidebarConfig;
    pageHeader?: AppPageHeaderConfig;
    footer?: AppFooterConfig;
}

// ── Sub-types for component schemas ───────────────────────────────────

export interface ListGroupItem {
    id?: string;
    label: string;
    secondary?: string;
    badge?: string | number;
    value?: unknown;
    icon?: IconName;
    disabled?: boolean;
    action?: UiAction;
}

export interface DataGridItem {
    label: string;
    field?: string;
    value?: unknown;
    format?: string;
    badge?: boolean;
    copyable?: boolean;
    icon?: IconName;
}

export interface TrackingStage {
    id: string;
    label: string;
    description?: string;
    icon?: IconName;
    state?: "complete" | "current" | "upcoming" | "error";
}
