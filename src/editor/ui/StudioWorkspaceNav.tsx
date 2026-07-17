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

export const studioWorkspaceDetails: Record<
  StudioWorkspaceId,
  { label: string; description: string }
> = {
  ai: {
    label: "AI Builder",
    description: "Create or revise a dashboard with a guided AI workflow.",
  },
  inspector: {
    label: "Visual Inspector",
    description: "Select components and edit supported properties safely.",
  },
  mapStudio: {
    label: "Map Studio",
    description: "Configure map layers, styling, joins, and interactions.",
  },
  settings: {
    label: "Field mapping",
    description: "Map report fields and aliases used by the dashboard.",
  },
  calculations: {
    label: "Calculations",
    description: "Create calculated values without changing the data model.",
  },
  interactions: {
    label: "Interaction testing",
    description: "Review Power BI selection and filter behavior.",
  },
  mapServices: {
    label: "Map services",
    description: "Configure providers and test geocoding access.",
  },
  config: {
    label: "Runtime settings",
    description: "Edit advanced renderer, provider, and security settings.",
  },
  specification: {
    label: "JSON editor",
    description: "Edit the complete dashboard specification directly.",
  },
  help: {
    label: "Documentation",
    description: "Learn the authoring workflow and supported features.",
  },
  skill: {
    label: "AI skill guide",
    description: "Copy the complete HyperPBI authoring reference for AI.",
  },
};

export const studioWorkspaceGroups: readonly {
  label: string;
  items: readonly { id: StudioWorkspaceId; label: string }[];
}[] = [
  {
    label: "Create",
    items: [
      { id: "ai", label: studioWorkspaceDetails.ai.label },
      { id: "inspector", label: studioWorkspaceDetails.inspector.label },
      { id: "mapStudio", label: studioWorkspaceDetails.mapStudio.label },
    ],
  },
  {
    label: "Data & logic",
    items: [
      { id: "settings", label: studioWorkspaceDetails.settings.label },
      { id: "calculations", label: studioWorkspaceDetails.calculations.label },
    ],
  },
  {
    label: "Test",
    items: [
      { id: "interactions", label: studioWorkspaceDetails.interactions.label },
      { id: "mapServices", label: studioWorkspaceDetails.mapServices.label },
    ],
  },
  {
    label: "Advanced",
    items: [
      { id: "config", label: studioWorkspaceDetails.config.label },
      { id: "specification", label: studioWorkspaceDetails.specification.label },
    ],
  },
  {
    label: "Learn",
    items: [
      { id: "help", label: studioWorkspaceDetails.help.label },
      { id: "skill", label: studioWorkspaceDetails.skill.label },
    ],
  },
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
    : [
        {
          label: "Start",
          items: [
            { id: "ai" as const, label: "Guided Builder" },
            { id: "help" as const, label: "How it works" },
          ],
        },
      ];
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
  const moveMenuFocus = (event: KeyboardEvent, groupLabel: string) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenGroup("");
      root.current
        ?.querySelector<HTMLButtonElement>(
          `[data-workspace-trigger="${groupLabel}"]`,
        )
        ?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
      return;
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
            <div key={group.label} class="hp-studio-workspace-group">
              <button
                type="button"
                data-workspace-trigger={group.label}
                class={active ? "is-active" : ""}
                aria-haspopup="menu"
                aria-expanded={openGroup === group.label}
                aria-label={active ? `${group.label}: ${active.label}` : group.label}
                onClick={() => setOpenGroup((current) => current === group.label ? "" : group.label)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const openAtEnd = event.key === "ArrowUp";
                    setOpenGroup(group.label);
                    requestAnimationFrame(() => {
                      const menuItems = Array.from(
                        root.current?.querySelectorAll<HTMLButtonElement>(
                          `[data-workspace-group="${group.label}"] [role="menuitem"]`,
                        ) ?? [],
                      );
                      const target = openAtEnd
                        ? menuItems[menuItems.length - 1]
                        : menuItems[0];
                      target?.focus();
                    });
                  }
                }}
              >
                <span>{group.label}</span>
                {active && <small>{active.label}</small>}
                <span class="hp-studio-workspace-chevron" aria-hidden="true">⌄</span>
              </button>
              {openGroup === group.label && (
                <div data-workspace-group={group.label} class="hp-studio-workspace-menu" role="menu" onKeyDown={(event) => moveMenuFocus(event, group.label)}>
                  {group.items.map((item) => (
                    <button key={item.id} type="button" role="menuitem" aria-current={value === item.id ? "page" : undefined} onClick={() => select(item.id)}>
                      <span>{item.label}</span>
                      <small>{studioWorkspaceDetails[item.id].description}</small>
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
