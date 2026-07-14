import type { ComponentChildren } from "preact";

export function StudioSection({
  title,
  open,
  onToggle,
  badge,
  children,
  className = "",
}: {
  title: ComponentChildren;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  badge?: ComponentChildren;
  children: ComponentChildren;
  className?: string;
}) {
  return (
    <details
      class={`hp-studio-section ${className}`.trim()}
      open={open}
      onToggle={(event) => onToggle?.(event.currentTarget.open)}
    >
      <summary>
        <span>{title}</span>
        {badge}
      </summary>
      <div class="hp-studio-section-body">{children}</div>
    </details>
  );
}
