// ── UI Action Types ───────────────────────────────────────────────────
// Separate from data interactions (filtering, selection, Power BI).
// See uiActions.ts for the executor.

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

export type UiIntent = "neutral" | "primary" | "success" | "warning" | "danger";

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
