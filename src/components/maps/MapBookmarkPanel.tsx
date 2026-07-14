import { useEffect, useRef } from "preact/hooks";
import type { MapViewBookmarkDefinition } from "../../schema/mapSchema";
import { Icon } from "../icons/Icon";

export function MapBookmarkPanel({
  bookmarks,
  activeBookmarkId,
  onActivate,
}: {
  bookmarks: readonly MapViewBookmarkDefinition[];
  activeBookmarkId?: string;
  onActivate: (bookmarkId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);

  const moveFocus = (event: KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    if (!buttons.length) return;
    event.preventDefault();
    const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : event.key === "ArrowDown"
            ? (current + 1) % buttons.length
            : (current - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  };

  return (
    <div
      ref={ref}
      class="hp-map-bookmark-list"
      role="listbox"
      aria-label="View bookmarks"
      onKeyDown={moveFocus}
    >
      {bookmarks.map((bookmark) => {
        const active = bookmark.id === activeBookmarkId;
        return (
          <button
            key={bookmark.id}
            type="button"
            role="option"
            aria-selected={active}
            class={active ? "is-current" : ""}
            title={bookmark.label}
            onClick={() => onActivate(bookmark.id)}
          >
            <span>{bookmark.label}</span>
            {active && <Icon name="check" size="xs" decorative />}
          </button>
        );
      })}
    </div>
  );
}
