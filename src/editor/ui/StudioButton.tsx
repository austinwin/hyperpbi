import type { ComponentChildren, JSX } from "preact";

export type StudioButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "icon"
  | "compact";

export function StudioButton({
  variant = "secondary",
  class: className = "",
  children,
  ...props
}: JSX.HTMLAttributes<HTMLButtonElement> & {
  variant?: StudioButtonVariant;
  children?: ComponentChildren;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      class={`hp-studio-button hp-studio-button-${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
