import { useEffect } from "preact/hooks";
import { overlayRuntime } from "./overlayRuntime";

export function useOverlayDismiss(id: string, close: () => void, options: { outside?: boolean; escape?: boolean; closeOnTab?: boolean } = {}): void {
    useEffect(() => {
        const onPointerDown = (event: Event) => {
            if (overlayRuntime.stack.at(-1) !== id) return;
            if (options.outside === false) return;
            const target = event.target as Node | null;
            if (overlayRuntime.panels.get(id)?.contains(target) || overlayRuntime.triggers.get(id)?.contains(target)) return;
            close();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (overlayRuntime.stack.at(-1) !== id) return;
            if (event.key === "Escape" && options.escape !== false) { event.preventDefault(); event.stopPropagation(); close(); }
            else if (event.key === "Tab" && options.closeOnTab) { overlayRuntime.restoreSuppressed.add(id); close(); }
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("keydown", onKeyDown);
        return () => { document.removeEventListener("pointerdown", onPointerDown, true); document.removeEventListener("keydown", onKeyDown); };
    }, [id, close, options.outside, options.escape, options.closeOnTab]);
}
