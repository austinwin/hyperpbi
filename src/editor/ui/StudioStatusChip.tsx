import type { ComponentChildren } from "preact";

export type StudioStatusTone =
  | "valid"
  | "invalid"
  | "warning"
  | "loading"
  | "experimental"
  | "service"
  | "powerbi"
  | "joined"
  | "neutral";

export function StudioStatusChip({
  tone = "neutral",
  children,
  announce = false,
}: {
  tone?: StudioStatusTone;
  children: ComponentChildren;
  announce?: boolean;
}) {
  return (
    <span
      class={`hp-studio-status-chip is-${tone}`}
      role={announce ? "status" : undefined}
    >
      {children}
    </span>
  );
}
