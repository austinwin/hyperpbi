import { useEffect } from "preact/hooks";
import { useOverlayRuntime } from "./overlayRuntime";

export function useOverlayDismiss(id: string, close: () => void, options: { outside?: boolean; escape?: boolean; closeOnTab?: boolean } = {}): void {
    const overlayRuntime = useOverlayRuntime();
    useEffect(() => {
        const onPointerDown = (event: Event) => {
            if (overlayRuntime.stack.at(-1) !== id) return;
            if (options.outside === false) return;
            const path = event.composedPath();
            if (path.some(node => node === overlayRuntime.panels.get(id) || node === overlayRuntime.triggers.get(id))) return;
            close();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (overlayRuntime.stack.at(-1) !== id || event.defaultPrevented) return;
            const panel = overlayRuntime.panels.get(id);
            const root = panel?.getRootNode() as Document | ShadowRoot | undefined;
            if (!panel || (!event.composedPath().includes(panel) && !panel.contains(root?.activeElement ?? null))) return;
            if (event.key === "Escape" && options.escape !== false) { event.preventDefault(); event.stopPropagation(); close(); }
            else if (event.key === "Tab" && options.closeOnTab) { overlayRuntime.restoreSuppressed.add(id); close(); }
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("keydown", onKeyDown);
        return () => { document.removeEventListener("pointerdown", onPointerDown, true); document.removeEventListener("keydown", onKeyDown); };
    }, [overlayRuntime, id, close, options.outside, options.escape, options.closeOnTab]);
}
