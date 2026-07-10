import { h, type ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Icon } from "../icons/Icon";

export function MapToolbarPopover({
    id,
    title,
    subtitle,
    onClose,
    children,
    footer,
    headerAction,
}: {
    id: string;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ComponentChildren;
    footer?: ComponentChildren;
    headerAction?: ComponentChildren;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    const horizontalOffsetRef = useRef(0);
    const [placementStyle, setPlacementStyle] = useState<{ maxHeight?: string; transform?: string }>({});
    onCloseRef.current = onClose;

    useEffect(() => {
        const handlePointer = (event: PointerEvent) => {
            if (ref.current && event.target instanceof Node && !ref.current.contains(event.target)) onCloseRef.current();
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCloseRef.current();
            }
        };
        document.addEventListener("pointerdown", handlePointer);
        document.addEventListener("keydown", handleKey);
        const frame = ref.current?.closest(".hp-map-frame");
        const updatePlacement = () => {
            if (!ref.current || !(frame instanceof HTMLElement)) return;
            const frameRect = frame.getBoundingClientRect();
            const popoverRect = ref.current.getBoundingClientRect();
            if (frameRect.width <= 0 || frameRect.height <= 0 || popoverRect.width <= 0) return;
            const rawLeft = popoverRect.left - horizontalOffsetRef.current;
            const rawRight = popoverRect.right - horizontalOffsetRef.current;
            const safeLeft = frameRect.left + 6;
            const safeRight = frameRect.right - 6;
            const horizontalOffset = rawLeft < safeLeft ? safeLeft - rawLeft : rawRight > safeRight ? safeRight - rawRight : 0;
            horizontalOffsetRef.current = horizontalOffset;
            const availableHeight = Math.max(120, Math.min(420, frameRect.bottom - popoverRect.top - 7));
            setPlacementStyle({ maxHeight: `${availableHeight}px`, transform: horizontalOffset ? `translateX(${horizontalOffset}px)` : undefined });
        };
        updatePlacement();
        const observer = frame instanceof HTMLElement && typeof ResizeObserver !== "undefined" ? new ResizeObserver(updatePlacement) : undefined;
        if (frame instanceof HTMLElement) observer?.observe(frame);
        window.addEventListener("resize", updatePlacement);
        return () => {
            document.removeEventListener("pointerdown", handlePointer);
            document.removeEventListener("keydown", handleKey);
            observer?.disconnect();
            window.removeEventListener("resize", updatePlacement);
        };
    }, []);

    const stop = (event: Event) => event.stopPropagation();
    return (
        <div
            ref={ref}
            id={id}
            class="hp-map-toolbar-popover"
            role="dialog"
            aria-modal="false"
            aria-labelledby={`${id}-title`}
            style={placementStyle}
            onPointerDown={stop}
            onClick={stop}
            onDblClick={stop}
            onWheel={stop}
        >
            <header class="hp-map-popover-header">
                <div class="hp-map-popover-heading">
                    <strong id={`${id}-title`}>{title}</strong>
                    {subtitle && <span>{subtitle}</span>}
                </div>
                {headerAction && <div class="hp-map-popover-header-action">{headerAction}</div>}
                <button type="button" class="hp-map-popover-close" aria-label={`Close ${title}`} title={`Close ${title}`} onClick={onClose}>
                    <Icon name="close" size="xs" decorative />
                </button>
            </header>
            <div class="hp-map-popover-body">{children}</div>
            {footer && <footer class="hp-map-popover-footer">{footer}</footer>}
        </div>
    );
}
