import { useRef } from "preact/hooks";

export function MapDrawerResize({ width, onChange }: { width: number; onChange: (width: number) => void }) {
  const start = useRef({ x: 0, width });
  const clamp = (element: HTMLElement, next: number) => {
    const body = element.closest<HTMLElement>(".hp-map-studio-body");
    const maximum = Math.max(0, (body?.clientWidth ?? 360) - 64);
    onChange(Math.max(Math.min(240, maximum), Math.min(maximum, next)));
  };
  return <div class="hp-map-drawer-resize" role="separator" aria-label="Resize configuration drawer" aria-orientation="vertical" aria-valuenow={width} tabIndex={0}
    onPointerDown={event => { const drawer = event.currentTarget.parentElement!; start.current = { x: event.clientX, width: drawer.getBoundingClientRect().width }; event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
    onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) clamp(event.currentTarget, start.current.width + event.clientX - start.current.x); }}
    onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); clamp(event.currentTarget, event.currentTarget.parentElement!.getBoundingClientRect().width + (event.key === "ArrowLeft" ? -20 : 20)); } }} />;
}
