import type { ComponentChildren, RefObject } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { ExternalMount } from "../../render/ExternalMount";

/** Keep editor popovers inside the visual, including short embedded visuals. */
export function MapStudioPopover({ anchor, title, onClose, children }: {
  anchor: RefObject<HTMLButtonElement>; title: string; onClose: () => void; children: ComponentChildren;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 6, top: 6 });
  const root = anchor.current?.closest<HTMLElement>(".hp-map-studio");
  useLayoutEffect(() => {
    if (!root || !panel.current || !anchor.current) return;
    const update = () => {
      const frame = root.getBoundingClientRect(), button = anchor.current!.getBoundingClientRect();
      const bounds = panel.current!.getBoundingClientRect();
      setPosition({
        left: Math.max(6, Math.min(button.right - frame.left - bounds.width, frame.width - bounds.width - 6)),
        top: Math.max(6, Math.min(button.bottom - frame.top + 4, frame.height - bounds.height - 6)),
      });
    };
    update();
    panel.current.querySelector<HTMLElement>('input,button,select')?.focus({ preventScroll: true });
    const observer = new ResizeObserver(update);
    observer.observe(root); observer.observe(panel.current);
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target) && !anchor.current?.contains(event.target)) onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation(); onClose(); anchor.current?.focus();
    };
    root.addEventListener("scroll", update, true);
    document.addEventListener("pointerdown", outside);
    panel.current.addEventListener("keydown", escape);
    const current = panel.current;
    return () => {
      observer.disconnect(); root.removeEventListener("scroll", update, true);
      document.removeEventListener("pointerdown", outside); current.removeEventListener("keydown", escape);
    };
  }, [root]);
  if (!root) return null;
  return <ExternalMount container={root}><div ref={panel} class="hp-map-studio-popover" role="dialog" aria-label={title} style={position}>{children}</div></ExternalMount>;
}
