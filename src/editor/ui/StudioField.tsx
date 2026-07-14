import type { ComponentChildren } from "preact";

export function StudioField({
  label,
  help,
  error,
  className = "",
  children,
}: {
  label: ComponentChildren;
  help?: ComponentChildren;
  error?: ComponentChildren;
  className?: string;
  children: ComponentChildren;
}) {
  return (
    <label class={`hp-studio-field ${error ? "is-invalid" : ""} ${className}`.trim()}>
      <span class="hp-studio-field-label">{label}</span>
      {children}
      {error ? (
        <small class="hp-studio-field-error">{error}</small>
      ) : help ? (
        <small class="hp-studio-field-help">{help}</small>
      ) : null}
    </label>
  );
}
