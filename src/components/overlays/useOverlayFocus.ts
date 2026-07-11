import { useEffect } from "preact/hooks";
import { overlayRuntime } from "./overlayRuntime";

export const focusableSelector = [
    "button:not([disabled])", "[href]", "input:not([disabled])", "select:not([disabled])",
    "textarea:not([disabled])", "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useOverlayFocus(id: string, panelRef: { current: HTMLElement | null }, options: { trap?: boolean; focusFirst?: boolean; restore?: boolean } = {}): void {
    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        overlayRuntime.panels.set(id, panel);
        const first = panel.querySelector<HTMLElement>(focusableSelector);
        (options.focusFirst === false ? panel : first ?? panel).focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (!options.trap || event.key !== "Tab" || overlayRuntime.stack.at(-1) !== id) return;
            const items = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(item => item.offsetParent !== null);
            if (!items.length) { event.preventDefault(); panel.focus(); return; }
            const first = items[0]; const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            if (overlayRuntime.panels.get(id) === panel) overlayRuntime.panels.delete(id);
            if (options.restore !== false && !overlayRuntime.restoreSuppressed.delete(id)) overlayRuntime.triggers.get(id)?.focus();
        };
    }, [id, options.trap, options.focusFirst, options.restore]);
}
