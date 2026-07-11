import { useEffect, useState } from "preact/hooks";
import type { OverlayAnchor } from "../../render/stateStore";
import type { OverlayPlacement } from "./overlayTypes";
import { overlayRuntime } from "./overlayRuntime";
import { positionAnchoredOverlay, type OverlayPosition } from "./overlayPositioning";

export function useAnchoredOverlayPosition(id: string, anchor: OverlayAnchor | undefined, panelRef: { current: HTMLElement | null }, placement: OverlayPlacement): OverlayPosition | undefined {
    const [position, setPosition] = useState<OverlayPosition>();
    useEffect(() => {
        const update = () => {
            const panel = panelRef.current;
            const trigger = overlayRuntime.triggers.get(id);
            const rect = trigger?.getBoundingClientRect();
            const resolvedAnchor = anchor ?? (rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height, triggerId: trigger?.id } : undefined);
            if (!panel || !resolvedAnchor) return;
            const panelRect = panel.getBoundingClientRect();
            setPosition(positionAnchoredOverlay({ anchor: resolvedAnchor, panelWidth: panelRect.width, panelHeight: panelRect.height, placement, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }));
        };
        const frame = requestAnimationFrame(update);
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
    }, [id, anchor?.top, anchor?.left, anchor?.width, anchor?.height, panelRef, placement]);
    return position;
}
