import type { ComponentChildren } from "preact";

export function StudioCheckbox({
  label,
  help,
  checked,
  disabled,
  onChange,
  className = "",
}: {
  label: ComponentChildren;
  help?: ComponentChildren;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label class={`hp-studio-check ${className}`.trim()}>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span>
        <strong>{label}</strong>
        {help && <small>{help}</small>}
      </span>
    </label>
  );
}
