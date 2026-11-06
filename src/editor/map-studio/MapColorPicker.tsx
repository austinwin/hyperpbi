import { ExternalMount } from "../../render/ExternalMount";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

const presets = ["#0f766e", "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#475569", "#99f6e4", "#bfdbfe", "#ddd6fe", "#fbcfe8", "#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#a5f3fc", "#e2e8f0", "#ffffff", "#cbd5e1", "#64748b", "#334155", "#0f172a"];
let recent: string[] = [];
export function MapColorPicker({ label, value, opacity, onChange, onOpacity, defaultColor = "#2563eb" }: { label: string; value: string; opacity?: number; onChange: (color: string) => void; onOpacity?: (opacity: number) => void; defaultColor?: string }) {
    const anchor = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false), [hex, setHex] = useState(value), [position, setPosition] = useState({ left: 0, top: 0 });
    useEffect(() => setHex(value), [value]);
    const root = anchor.current?.closest<HTMLElement>(".hp-map-studio");
    useLayoutEffect(() => {
        if (!open || !root || !anchor.current) return;
        const update = () => { const parent = root.getBoundingClientRect(), button = anchor.current!.getBoundingClientRect(); const width = panel.current?.offsetWidth ?? 228, height = panel.current?.offsetHeight ?? 280; setPosition({ left: Math.max(6, Math.min(button.left - parent.left, parent.width - width - 6)), top: Math.max(6, Math.min(button.bottom - parent.top + 5, parent.height - height - 6)) }); };
        update(); const observer = new ResizeObserver(update); observer.observe(root); window.addEventListener("resize", update); root.addEventListener("scroll", update, true);
        return () => { observer.disconnect(); window.removeEventListener("resize", update); root.removeEventListener("scroll", update, true); };
    }, [open, root]);
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => { if (event.target instanceof Node && !panel.current?.contains(event.target) && !anchor.current?.contains(event.target)) setOpen(false); };
        const key = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); anchor.current?.focus(); } };
        document.addEventListener("pointerdown", outside); document.addEventListener("keydown", key);
        return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
    }, [open]);
    const choose = (color: string) => { recent = [color, ...recent.filter(item => item !== color)].slice(0, 8); setHex(color); onChange(color); };
    return <div class="hp-map-color-control"><span>{label}</span><button ref={anchor} type="button" class="hp-map-color-swatch" aria-label={`${label} color picker`} aria-expanded={open} onClick={() => setOpen(!open)}><i style={{ background: value || defaultColor }} /><span>{value || defaultColor}</span></button>{open && root && <ExternalMount container={root}><div ref={panel} class="hp-map-color-picker" role="dialog" aria-label={`${label} colors`} style={{ left: position.left, top: position.top }}><header><strong>{label}</strong><button type="button" aria-label="Close color picker" onClick={() => setOpen(false)}>×</button></header><div class="hp-map-color-grid">{presets.map(color => <button type="button" title={color} aria-label={`Color ${color}`} style={{ background: color }} onClick={() => choose(color)} />)}</div><label><span>HEX</span><input aria-label={`${label} HEX`} value={hex} onInput={event => { setHex(event.currentTarget.value); if (/^#[\da-f]{6}$/i.test(event.currentTarget.value)) choose(event.currentTarget.value); }} /></label>{onOpacity && <label><span>Opacity %</span><input type="number" min="0" max="100" aria-label={`${label} opacity`} value={Math.round((opacity ?? 1) * 100)} onChange={event => { const amount = Number(event.currentTarget.value); if (Number.isFinite(amount) && amount >= 0 && amount <= 100) onOpacity(amount / 100); }} /></label>}{recent.length > 0 && <><small>Recent colors</small><div class="hp-map-color-grid">{recent.map(color => <button type="button" title={color} aria-label={`Recent ${color}`} style={{ background: color }} onClick={() => choose(color)} />)}</div></>}<button type="button" onClick={() => { choose(defaultColor); onOpacity?.(1); }}>Reset to default</button></div></ExternalMount>}</div>;
}
