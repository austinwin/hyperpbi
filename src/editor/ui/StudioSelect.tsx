import type { ComponentChildren, JSX } from "preact";
import { StudioField } from "./StudioField";

export function StudioSelect({
  label,
  help,
  children,
  ...props
}: Omit<JSX.HTMLAttributes<HTMLSelectElement>, "label"> & {
  label: ComponentChildren;
  help?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <StudioField label={label} help={help}>
      <select class="hp-studio-select" {...props}>
        {children}
      </select>
    </StudioField>
  );
}
