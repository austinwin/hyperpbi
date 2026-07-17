import type { IconName } from "../../schema/uiSchema";

export interface IconDefinition {
    name: string;
    category: string;
    path: string;
}

// Curated registry of ~40 high-value icons.
// All paths are safe, static SVG path data owned by the runtime.
// Never accept arbitrary SVG from JSON.

const ICONS: Record<string, IconDefinition> = {
    home:       { name: "home",       category: "navigation", path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    dashboard:  { name: "dashboard",  category: "navigation", path: "M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zm-10 0a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" },
    chart:      { name: "chart",      category: "data",       path: "M8 13v4m4-7v7m4-4v4m4-9v9M5 5v14h14" },
    table:      { name: "table",      category: "data",       path: "M4 6h16M4 10h16M4 14h16M4 18h16M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" },
    map:        { name: "map",        category: "data",       path: "M9 20l-5.4-3.6a1 1 0 01-.6-.9V7.1a1 1 0 011.5-.9L9 8.8l5.4-3.6a1 1 0 011.1 0L21 8.8v8.4a1 1 0 01-1.5.9L15 15.2l-5.4 3.6a1 1 0 01-1.1 0L3 15.2" },
    list:       { name: "list",       category: "data",       path: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
    filter:     { name: "filter",     category: "actions",    path: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.6a1 1 0 01-.3.7L14 14.6V19a1 1 0 01-.6.9l-4 2a1 1 0 01-1.4-.9v-6.4L1.3 7.3A1 1 0 011 6.6V4z" },
    search:     { name: "search",     category: "actions",    path: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    target:     { name: "target",     category: "actions",    path: "M12 2v3m0 14v3M2 12h3m14 0h3M12 8a4 4 0 100 8 4 4 0 000-8z" },
    "select-rectangle": { name: "select-rectangle", category: "actions", path: "M5 3H3v2m16-2h2v2M5 21H3v-2m16 2h2v-2M7 7h10v10H7V7z" },
    lasso:      { name: "lasso",      category: "actions",    path: "M4 8c0-3 3.6-5 8-5s8 2.1 8 6-3 7-8 7-8-2.2-8-6c0-2 1-3.6 3-4.5M12 16c-1 3-2.5 5-5 5-1.7 0-3-1-3-2.2 0-1.1.9-1.8 2-1.8 1.5 0 2.5 1.5 2.5 3" },
    menu:       { name: "menu",       category: "navigation", path: "M4 6h16M4 12h16M4 18h16" },
    "chevron-left":  { name: "chevron-left",  category: "navigation", path: "M15 19l-7-7 7-7" },
    "chevron-right": { name: "chevron-right", category: "navigation", path: "M9 5l7 7-7 7" },
    "chevron-down":  { name: "chevron-down",  category: "navigation", path: "M6 9l6 6 6-6" },
    "chevron-up":    { name: "chevron-up",    category: "navigation", path: "M18 15l-6-6-6 6" },
    close:      { name: "close",      category: "actions",    path: "M6 6l12 12M18 6L6 18" },
    plus:       { name: "plus",       category: "actions",    path: "M12 5v14m-7-7h14" },
    check:      { name: "check",      category: "actions",    path: "M5 13l4 4L19 7" },
    alert:      { name: "alert",      category: "feedback",   path: "M12 9v4m0 4h.01M10.3 4.3L3.3 16.5a2 2 0 001.7 3h14a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z" },
    info:       { name: "info",       category: "feedback",   path: "M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" },
    settings:   { name: "settings",   category: "actions",    path: "M10.3 4.3a1 1 0 011.4 0l1.1 1.1a1 1 0 001.3.3l1.5-.7a1 1 0 011.5.5l.4 1.5a1 1 0 00.8.8l1.5.4a1 1 0 01.5 1.5l-.7 1.5a1 1 0 00.3 1.3l1.1 1.1a1 1 0 010 1.4l-1.1 1.1a1 1 0 00-.3 1.3l.7 1.5a1 1 0 01-.5 1.5l-1.5.4a1 1 0 00-.8.8l-.4 1.5a1 1 0 01-1.5.5l-1.5-.7a1 1 0 00-1.3.3l-1.1 1.1a1 1 0 01-1.4 0l-1.1-1.1a1 1 0 00-1.3-.3l-1.5.7a1 1 0 01-1.5-.5l-.4-1.5a1 1 0 00-.8-.8l-1.5-.4a1 1 0 01-.5-1.5l.7-1.5a1 1 0 00-.3-1.3l-1.1-1.1a1 1 0 010-1.4l1.1-1.1a1 1 0 00.3-1.3l-.7-1.5a1 1 0 01.5-1.5l1.5-.4a1 1 0 00.8-.8l.4-1.5a1 1 0 011.5-.5l1.5.7a1 1 0 001.3-.3l1.1-1.1zM12 15a3 3 0 100-6 3 3 0 000 6z" },
    user:       { name: "user",       category: "identity",   path: "M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    users:      { name: "users",      category: "identity",   path: "M12 4.4a3 3 0 100 6 3 3 0 000-6zm6.5 2a2 2 0 100 4 2 2 0 000-4zm-13 0a2 2 0 100 4 2 2 0 000-4zm-3.5 11a7 7 0 0114 0M3 18a3 3 0 016 0m5 0a3 3 0 016 0" },
    bell:       { name: "bell",       category: "feedback",   path: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-5-5.9V4a1 1 0 10-2 0v1.1A6 6 0 006 11v3.2A2 2 0 015.4 15.6L4 17h5m6 0a3 3 0 01-6 0" },
    calendar:   { name: "calendar",   category: "data",       path: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
    clock:      { name: "clock",      category: "data",       path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    download:   { name: "download",   category: "actions",    path: "M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" },
    copy:       { name: "copy",       category: "actions",    path: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.6a1 1 0 01.7.3l2.4 2.4a1 1 0 01.3.7V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v6a2 2 0 002 2h2" },
    external:   { name: "external",   category: "actions",    path: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3" },
    refresh:    { name: "refresh",    category: "actions",    path: "M4 4v5h.6M21 21v-5h-.6M4.9 13.6A7 7 0 0119 8h1m-16 8h-1a7 7 0 0114.1-5.6" },
    dots:       { name: "dots",       category: "actions",    path: "M5 12h.01M12 12h.01M19 12h.01" },
    eye:        { name: "eye",        category: "actions",    path: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.5 12c1-4.5 5.6-7.5 9.5-7.5s8.5 3 9.5 7.5c-1 4.5-5.6 7.5-9.5 7.5S3.5 16.5 2.5 12z" },
    "eye-off": { name: "eye-off",    category: "actions",    path: "M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.6A10.8 10.8 0 0112 4.5c3.9 0 8.5 3 9.5 7.5a11.4 11.4 0 01-2.1 4.1M6.2 6.2A11.4 11.4 0 002.5 12c1 4.5 5.6 7.5 9.5 7.5 1.1 0 2.2-.2 3.2-.6" },
    image:      { name: "image",      category: "data",       path: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 12l5-5 4 4 2-2 5 5M15 8h.01" },
    text:       { name: "text",       category: "data",       path: "M4 5V3h16v2M12 3v18m-4 0h8" },
    edit:       { name: "edit",       category: "actions",    path: "M15.2 3.2a2.1 2.1 0 013 3L7 17.3l-4 1 1-4L15.2 3.2z" },
    trash:      { name: "trash",      category: "actions",    path: "M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" },
    pin:        { name: "pin",        category: "actions",    path: "M5.1 13.9l-3.6-3.6a1 1 0 010-1.4l7.1-7.1a1 1 0 011.4 0l3.6 3.6a1 1 0 010 1.4l-7.1 7.1a1 1 0 01-1.4 0zm7.1-7.1l-1.4-1.4M12 12l-4-4" },
    location:   { name: "location",   category: "data",       path: "M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" },
    activity:   { name: "activity",   category: "data",       path: "M3 12h4l3-9 4 18 3-9h4" },
    layers:     { name: "layers",     category: "data",       path: "M12 2l9 5-9 5-9-5 9-5zm0 7l9 5-9 5-9-5 9-5zm0 7l6.7 3.7L12 23l-6.7-3.3L12 16z" },
    bookmark:   { name: "bookmark",   category: "actions",    path: "M6 4a2 2 0 012-2h8a2 2 0 012 2v18l-6-4-6 4V4z" },
    database:   { name: "database",   category: "data",       path: "M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" },
    folder:     { name: "folder",     category: "navigation", path: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.5l-2-2H5a2 2 0 00-2 2z" },
    grid:       { name: "grid",       category: "layout",     path: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" },
    columns:    { name: "columns",    category: "layout",     path: "M5 3h5v18H5V3zm9 0h5v18h-5V3z" },
    sidebar:    { name: "sidebar",    category: "layout",     path: "M4 4h5v16H4V4zm8 0h8v4h-8V4zm0 6h8v4h-8v-4zm0 6h8v4h-8v-4z" },
};

// ── Public API ────────────────────────────────────────────────────────

export function getIcon(name: IconName): IconDefinition | undefined {
    return ICONS[name];
}

export function iconExists(name: IconName): boolean {
    return name in ICONS;
}

export function allIconNames(): string[] {
    return Object.keys(ICONS);
}

export function iconsByCategory(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [name, def] of Object.entries(ICONS)) {
        if (!result[def.category]) result[def.category] = [];
        result[def.category].push(name);
    }
    return result;
}

export const VALID_ICON_NAMES = new Set(Object.keys(ICONS));

export function isValidIconName(name: unknown): name is IconName {
    return typeof name === "string" && VALID_ICON_NAMES.has(name);
}
