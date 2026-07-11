import type { DashboardAction } from "../render/stateStore";
import type { RenderContextValue } from "../render/RenderContext";
import type { UiAction, UiActionResult } from "./uiActionTypes";
import { collectOverlayComponents, getOverlayAnchor, overlayKind } from "../components/overlays/overlayTypes";
import { overlayRuntime } from "../components/overlays/overlayRuntime";

// ── Safe UI Action Executor ───────────────────────────────────────────
// Never executes strings as code. Never uses eval or new Function.
// Never navigates the browser. Never opens arbitrary URLs.

const SAFE_TOAST_DURATION_MIN = 1000;
const SAFE_TOAST_DURATION_MAX = 30000;
let toastIdCounter = 0;

function generateToastId(): string {
    return `toast_${++toastIdCounter}_${Date.now()}`;
}

function clampDuration(durationMs?: number): number | undefined {
    if (durationMs === undefined || durationMs === 0) return undefined; // persistent
    return Math.max(SAFE_TOAST_DURATION_MIN, Math.min(SAFE_TOAST_DURATION_MAX, durationMs));
}

export function executeUiAction(
    action: UiAction,
    context: RenderContextValue,
    event?: Event
): UiActionResult {
    const { dispatch, state } = context;

    switch (action.type) {
        case "clearFilters": {
            dispatch({ type: "clearFilters" } as DashboardAction);
            return { success: true };
        }

        case "setTab": {
            if (!action.target) {
                return { success: false, message: "setTab requires a target tab container ID." };
            }
            dispatch({ type: "tab", id: action.target, value: String(action.value ?? "") } as DashboardAction);
            return { success: true };
        }

        case "setState": {
            if (!action.target) {
                return { success: false, message: "setState requires a target state key." };
            }
            dispatch({ type: "value", id: action.target, value: action.value } as DashboardAction);
            return { success: true };
        }

        case "toggleState": {
            if (!action.target) {
                return { success: false, message: "toggleState requires a target state key." };
            }
            dispatch({ type: "value", id: action.target, value: !state.values[action.target] } as DashboardAction);
            return { success: true };
        }

        case "toggleSidebar": {
            const collapsed = state.sidebarCollapsed;
            dispatch({ type: "sidebarCollapsed", value: !collapsed } as DashboardAction);
            return { success: true };
        }

        case "openOverlay": {
            if (!action.target) {
                return { success: false, message: "openOverlay requires a target overlay ID." };
            }
            // Close dropdowns/popovers when opening a modal
            const overlayType = getOverlayType(action.target, context);
            const anchor = getOverlayAnchor(event);
            const eventElement = typeof HTMLElement !== "undefined" && event?.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
            if (eventElement) {
                const containingOverlay = Array.from(overlayRuntime.panels.entries()).find(([, panel]) => panel.contains(eventElement));
                overlayRuntime.triggers.set(action.target, containingOverlay ? overlayRuntime.triggers.get(containingOverlay[0]) ?? eventElement : eventElement);
            }
            if (overlayType === "modal") {
                state.openOverlays.filter(id => {
                    const t = getOverlayType(id, context);
                    return t === "dropdown" || t === "popover";
                }).forEach(id => dispatch({ type: "closeOverlay", id } as DashboardAction));
                dispatch({ type: "openOverlay", id: action.target, anchor } as DashboardAction);
            } else if (overlayType === "dropdown") {
                state.openOverlays.filter(id => {
                    const t = getOverlayType(id, context);
                    return t === "dropdown" && id !== action.target;
                }).forEach(id => dispatch({ type: "closeOverlay", id } as DashboardAction));
                dispatch({ type: "openOverlay", id: action.target, anchor } as DashboardAction);
            } else {
                dispatch({ type: "openOverlay", id: action.target, anchor } as DashboardAction);
            }
            if (event) event.stopPropagation();
            return { success: true };
        }

        case "closeOverlay": {
            if (!action.target) {
                return { success: false, message: "closeOverlay requires a target overlay ID." };
            }
            dispatch({ type: "closeOverlay", id: action.target } as DashboardAction);
            return { success: true };
        }

        case "toggleOverlay": {
            if (!action.target) {
                return { success: false, message: "toggleOverlay requires a target overlay ID." };
            }
            if (state.openOverlays.includes(action.target)) {
                dispatch({ type: "closeOverlay", id: action.target } as DashboardAction);
            } else {
                executeUiAction({ type: "openOverlay", target: action.target }, context, event);
            }
            return { success: true };
        }

        case "setStep": {
            if (!action.target) {
                return { success: false, message: "setStep requires a target steps component ID." };
            }
            dispatch({ type: "step", id: action.target, value: String(action.value ?? "") } as DashboardAction);
            return { success: true };
        }

        case "nextStep": {
            if (!action.target) {
                return { success: false, message: "nextStep requires a target steps component ID." };
            }
            // step progression handled by the component reading state
            dispatch({ type: "stepNext", id: action.target } as DashboardAction);
            return { success: true };
        }

        case "previousStep": {
            if (!action.target) {
                return { success: false, message: "previousStep requires a target steps component ID." };
            }
            dispatch({ type: "stepPrevious", id: action.target } as DashboardAction);
            return { success: true };
        }

        case "showToast": {
            const id = generateToastId();
            const durationMs = clampDuration(action.durationMs);
            dispatch({
                type: "pushToast",
                toast: {
                    id,
                    title: action.title,
                    message: action.message ?? "",
                    intent: action.intent ?? "neutral",
                    durationMs,
                }
            } as DashboardAction);
            return { success: true };
        }

        case "dismissToast": {
            if (!action.target) {
                return { success: false, message: "dismissToast requires a target toast ID." };
            }
            dispatch({ type: "dismissToast", id: action.target } as DashboardAction);
            return { success: true };
        }

        case "scrollTo": {
            if (!action.target) {
                return { success: false, message: "scrollTo requires a target component ID." };
            }
            const el = document.querySelector(`[data-hp-id="${action.target}"]`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
            return { success: true };
        }

        case "refresh": {
            // refresh is a no-op UI action — data is bound by Power BI
            return { success: true };
        }

        default:
            return { success: false, message: `Unknown UI action type: ${(action as UiAction).type}` };
    }
}

export function executeUiActions(
    actions: UiAction | UiAction[],
    context: RenderContextValue,
    event?: Event
): UiActionResult {
    if (Array.isArray(actions)) {
        let lastResult: UiActionResult = { success: true };
        for (const action of actions) {
            lastResult = executeUiAction(action, context, event);
            if (!lastResult.success) return lastResult;
        }
        return lastResult;
    }
    return executeUiAction(actions, context, event);
}

// ── Helpers ───────────────────────────────────────────────────────────

function getOverlayType(
    id: string,
    context: RenderContextValue
): "modal" | "dropdown" | "popover" | "offcanvas" | "unknown" {
    const component = collectOverlayComponents(context.schema).get(id) ?? overlayRuntime.definitions.get(id);
    return overlayKind(component);
}
