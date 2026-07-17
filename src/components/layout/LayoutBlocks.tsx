import { ComponentChildren } from "preact";

export function Card({ title, children, className = "" }: { title?: string; children?: ComponentChildren; className?: string }) {
    return <section class={`hp-card ${className}`}>{title && <header class="hp-card-header"><h3>{title}</h3></header>}<div class="hp-card-body">{children}</div></section>;
}
export function GridLayout({ children, columns = 12, gap, fill = false }: { children?: ComponentChildren; columns?: number; gap?: number; fill?: boolean }) { return <div class={`hp-grid ${fill ? "hp-layout-fill" : ""}`} style={{ "--hp-grid-columns": columns, gap: gap ? `${gap}px` : undefined }}>{children}</div>; }
export function FlexLayout({ children, direction = "row", gap, fill = false }: { children?: ComponentChildren; direction?: "row" | "column"; gap?: number; fill?: boolean }) { return <div class={`hp-flex ${fill ? "hp-layout-fill" : ""}`} style={{ "--hp-layout-direction-authored": direction, gap: gap ? `${gap}px` : undefined }}>{children}</div>; }
export function Section({ title, children }: { title?: string; children?: ComponentChildren }) { return <section class="hp-section">{title && <h3 class="hp-section-title">{title}</h3>}{children}</section>; }
export function Divider() { return <hr class="hp-divider" />; }
export function Spacer() { return <div class="hp-spacer" aria-hidden="true" />; }
