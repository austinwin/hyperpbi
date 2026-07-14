export function StudioTabs<T extends string>({
  label,
  value,
  items,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  items: readonly { id: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div class={`hp-studio-tablist ${className}`.trim()} role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
