import { useEffect, useRef, useState } from "preact/hooks";

export type StudioWorkspaceId =
  | "specification"
  | "inspector"
  | "mapStudio"
  | "config"
  | "ai"
  | "skill"
  | "calculations"
  | "mapServices"
  | "settings"
  | "interactions"
  | "help";

export const studioWorkspaceGroups: readonly {
  label: string;
  items: readonly { id: StudioWorkspaceId; label: string }[];
}[] = [
  { label: "Build", items: [{ id: "ai", label: "AI Builder" }, { id: "inspector", label: "Inspector" }, { id: "mapStudio", label: "Map Studio" }] },
  { label: "Data", items: [{ id: "calculations", label: "Calculations" }, { id: "settings", label: "Field Mapping" }, { id: "config", label: "Runtime Config" }] },
  { label: "Test", items: [{ id: "interactions", label: "Interactions" }, { id: "mapServices", label: "Map Services" }] },
  { label: "Code", items: [{ id: "specification", label: "JSON" }, { id: "skill", label: "AI Skill" }] },
  { label: "Help", items: [{ id: "help", label: "Documentation" }] },
];

export function StudioWorkspaceNav({
  value,
  advanced,
  onChange,
}: {
  value: StudioWorkspaceId;
  advanced: boolean;
  onChange: (value: StudioWorkspaceId) => void;
}) {
  const [openGroup, setOpenGroup] = useState("");
  const root = useRef<HTMLElement>(null);
  const groups = advanced
    ? studioWorkspaceGroups
    : [{ label: "Build", items: [{ id: "ai" as const, label: "Guided Builder" }, { id: "help" as const, label: "How it works" }] }];
  useEffect(() => {
    if (!openGroup) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenGroup("");
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGroup("");
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [openGroup]);
  const select = (id: StudioWorkspaceId) => {
    setOpenGroup("");
    onChange(id);
  };
  const moveMenuFocus = (event: KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    );
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
      (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };
  return (
    <nav ref={root} class="hp-studio-workspace-nav" aria-label="Builder workspace">
      <label class="hp-studio-workspace-select">
        <span>Workspace</span>
        <select value={value} onChange={(event) => select(event.currentTarget.value as StudioWorkspaceId)}>
          {groups.map((group) => (
            <optgroup label={group.label}>
              {group.items.map((item) => <option value={item.id}>{item.label}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <div class="hp-studio-workspace-groups">
        {groups.map((group) => {
          const active = group.items.find((item) => item.id === value);
          return (
            <div class="hp-studio-workspace-group">
              <button
                type="button"
                class={active ? "is-active" : ""}
                aria-haspopup="menu"
                aria-expanded={openGroup === group.label}
                onClick={() => setOpenGroup((current) => current === group.label ? "" : group.label)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setOpenGroup(group.label);
                    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-workspace-group="${group.label}"] [role="menuitem"]`)?.focus());
                  }
                }}
              >
                <span>{group.label}</span>
                {active && <small>{active.label}</small>}
              </button>
              {openGroup === group.label && (
                <div data-workspace-group={group.label} class="hp-studio-workspace-menu" role="menu" onKeyDown={moveMenuFocus}>
                  {group.items.map((item) => (
                    <button type="button" role="menuitem" aria-current={value === item.id ? "page" : undefined} onClick={() => select(item.id)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
