import { ComponentChildren } from "preact";
export function EmptyState({ title, children }: { title: string; children?: ComponentChildren }) {
    return <div class="hp-empty"><div class="hp-empty-icon">◇</div><strong>{title}</strong>{children && <div>{children}</div>}</div>;
}
