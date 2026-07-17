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
  const moveFocus = (event: KeyboardEvent, currentIndex: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
      return;
    event.preventDefault();
    const enabled = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled);
    const enabledIndex = enabled.findIndex(({ index }) => index === currentIndex);
    const next =
      event.key === "Home"
        ? enabled[0]
        : event.key === "End"
          ? enabled[enabled.length - 1]
          : enabled[
              (enabledIndex + (event.key === "ArrowRight" ? 1 : -1) +
                enabled.length) %
                enabled.length
            ];
    if (!next) return;
    const tablist = (event.currentTarget as HTMLElement).parentElement;
    onChange(next.item.id);
    requestAnimationFrame(() => {
      const buttons = Array.from(
        tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
          [],
      );
      buttons[next.index]?.focus();
    });
  };
  return (
    <div class={`hp-studio-tablist ${className}`.trim()} role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          tabIndex={value === item.id ? 0 : -1}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => moveFocus(event, index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
