import { useMemo, useRef, useState } from "preact/hooks";
import type { MenuItem } from "../../schema/uiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import type { ComponentBase } from "../../schema/hyperpbiSchema";

export function MenuList({ items, overlayId, closeOnSelect = true, onClose, nested = false }: { items: MenuItem[]; overlayId: string; closeOnSelect?: boolean; onClose: () => void; nested?: boolean }) {
    const context = useRenderContext();
    const refs = useRef<Array<HTMLButtonElement | null>>([]);
    const [submenu, setSubmenu] = useState<string>();
    const enabled = useMemo(() => items.map((item, index) => !item.disabled && !item.divider ? index : -1).filter(index => index >= 0), [items]);
    const move = (current: number, direction: 1 | -1) => {
        const position = enabled.indexOf(current); const next = enabled[(position + direction + enabled.length) % enabled.length];
        refs.current[next]?.focus();
    };
    const activate = (item: MenuItem, event: Event) => {
        if (item.disabled || item.divider) return;
        if (item.action) context.executeUiAction(item.action, event);
        if (item.interaction) {
            const component: ComponentBase = { type: "dropdown", id: overlayId, interaction: item.interaction };
            const policy = resolveInteractionPolicy(component, context.config, "control");
            const field = policy.field; const value = policy.value;
            const rowIndices = field && value !== undefined ? context.sourceRows.map((row, index) => row[field] === value ? index : -1).filter(index => index >= 0) : [];
            executeComponentInteraction(policy, createInteractionPayload(component, { field, value, rowIndices, sourceRowKeys: context.sourceRowKeys }), context, { trigger: "click", multiSelect: false, event });
        }
        if (closeOnSelect) onClose();
    };
    return (
        <div class={nested ? "hp-submenu" : "hp-dropdown-menu"} role="menu" aria-label={nested ? "Submenu" : undefined}>
            {items.map((item, index) => item.divider
                ? <div key={item.id} class="hp-menu-separator" role="separator" />
                : <div key={item.id} class="hp-menu-entry">
                    <button
                        ref={element => { refs.current[index] = element; }}
                        type="button"
                        class="hp-menu-item"
                        role="menuitem"
                        disabled={item.disabled}
                        tabIndex={index === enabled[0] ? 0 : -1}
                        aria-haspopup={item.children?.length ? "menu" : undefined}
                        aria-expanded={item.children?.length ? submenu === item.id : undefined}
                        onClick={event => item.children?.length ? setSubmenu(submenu === item.id ? undefined : item.id) : activate(item, event)}
                        onKeyDown={event => {
                            if (event.key === "ArrowDown") { event.preventDefault(); move(index, 1); }
                            else if (event.key === "ArrowUp") { event.preventDefault(); move(index, -1); }
                            else if (event.key === "Home") { event.preventDefault(); refs.current[enabled[0]]?.focus(); }
                            else if (event.key === "End") { event.preventDefault(); refs.current[enabled[enabled.length - 1]]?.focus(); }
                            else if (event.key === "ArrowRight" && item.children?.length) { event.preventDefault(); setSubmenu(item.id); requestAnimationFrame(() => (event.currentTarget.nextElementSibling?.querySelector("button") as HTMLElement | null)?.focus()); }
                            else if (event.key === "ArrowLeft" && nested) { event.preventDefault(); (event.currentTarget.closest(".hp-submenu")?.previousElementSibling as HTMLElement | null)?.focus(); }
                            else if ((event.key === "Enter" || event.key === " ") && !item.children?.length) { event.preventDefault(); activate(item, event); }
                        }}
                    >
                        {item.icon && <Icon name={item.icon} size="xs" decorative />}
                        <span class="hp-menu-label">{item.label ?? item.id}</span>
                        {item.badge !== undefined && <span class="badge hp-badge">{item.badge}</span>}
                        {item.children?.length ? <span aria-hidden="true">›</span> : null}
                    </button>
                    {item.children?.length && submenu === item.id ? <MenuList items={item.children} overlayId={overlayId} closeOnSelect={closeOnSelect} onClose={onClose} nested /> : null}
                </div>)}
        </div>
    );
}
