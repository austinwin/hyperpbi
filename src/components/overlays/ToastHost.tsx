import { h } from "preact";
import { useEffect } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import type { ToastMessage } from "../../render/stateStore";

export function ToastHost() {
    const context = useRenderContext();
    const { state, dispatch } = context;
    const toasts = state.toasts ?? [];

    return (
        <div class="hp-toast-container" aria-live="polite" aria-atomic="false">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => dispatch({ type: "dismissToast", id: toast.id })}
                />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
    useEffect(() => {
        if (toast.durationMs !== undefined && toast.durationMs > 0) {
            const timer = setTimeout(onDismiss, toast.durationMs);
            return () => clearTimeout(timer);
        }
    }, [toast.durationMs, onDismiss]);

    const intentClass = `hp-toast-${toast.intent ?? "neutral"}`;

    return (
        <div
            class={`hp-toast ${intentClass}`}
            role={toast.intent === "danger" ? "alert" : "status"}
            aria-live={toast.intent === "danger" ? "assertive" : "polite"}
        >
            <div class="hp-toast-body">
                {toast.title && <strong class="hp-toast-title">{toast.title}</strong>}
                <span class="hp-toast-message">{toast.message}</span>
            </div>
            <button type="button" class="hp-toast-dismiss" aria-label="Dismiss" onClick={onDismiss}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
        </div>
    );
}
