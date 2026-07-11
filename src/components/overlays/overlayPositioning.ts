import type { OverlayAnchor } from "../../render/stateStore";
import type { OverlayPlacement } from "./overlayTypes";

export interface OverlayPosition {
    top: number;
    left: number;
    maxHeight: number;
    placement: OverlayPlacement;
}

export function positionAnchoredOverlay({
    anchor, panelWidth, panelHeight, placement, viewportWidth, viewportHeight, padding = 8,
}: {
    anchor: OverlayAnchor;
    panelWidth: number;
    panelHeight: number;
    placement: OverlayPlacement;
    viewportWidth: number;
    viewportHeight: number;
    padding?: number;
}): OverlayPosition {
    const gap = 6;
    let resolved = placement;
    const [side, align = "center"] = placement.split("-") as ["top" | "right" | "bottom" | "left", "start" | "end" | "center"];
    const space = { top: anchor.top - padding, bottom: viewportHeight - (anchor.top + anchor.height) - padding, left: anchor.left - padding, right: viewportWidth - (anchor.left + anchor.width) - padding };
    let resolvedSide = side;
    if (side === "bottom" && panelHeight + gap > space.bottom && space.top > space.bottom) resolvedSide = "top";
    else if (side === "top" && panelHeight + gap > space.top && space.bottom > space.top) resolvedSide = "bottom";
    else if (side === "right" && panelWidth + gap > space.right && space.left > space.right) resolvedSide = "left";
    else if (side === "left" && panelWidth + gap > space.left && space.right > space.left) resolvedSide = "right";
    resolved = `${resolvedSide}${align === "center" ? "" : `-${align}`}` as OverlayPlacement;

    let top = anchor.top;
    let left = anchor.left;
    if (resolvedSide === "bottom") top = anchor.top + anchor.height + gap;
    if (resolvedSide === "top") top = anchor.top - panelHeight - gap;
    if (resolvedSide === "right") left = anchor.left + anchor.width + gap;
    if (resolvedSide === "left") left = anchor.left - panelWidth - gap;
    if (resolvedSide === "top" || resolvedSide === "bottom") {
        left = align === "start" ? anchor.left : align === "end" ? anchor.left + anchor.width - panelWidth : anchor.left + (anchor.width - panelWidth) / 2;
    } else {
        top = align === "start" ? anchor.top : align === "end" ? anchor.top + anchor.height - panelHeight : anchor.top + (anchor.height - panelHeight) / 2;
    }
    const maxHeight = Math.max(80, viewportHeight - padding * 2);
    return {
        top: Math.max(padding, Math.min(top, viewportHeight - Math.min(panelHeight, maxHeight) - padding)),
        left: Math.max(padding, Math.min(left, viewportWidth - panelWidth - padding)),
        maxHeight,
        placement: resolved,
    };
}
