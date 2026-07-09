import { h } from "preact";
import { useMemo } from "preact/hooks";
import type { ListGroupComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

export function ListGroup({ component }: { component: ListGroupComponent }) {
    const context = useRenderContext();
    const { data, getRowsForComponent, state } = context;
    const id = component.id ?? component.type;
    const policy = resolveInteractionPolicy(component, context.config, "display");
    const rows = getRowsForComponent(id);

    const items = useMemo(() => {
        if (component.source === "rows" && component.primaryField) {
            const selectedKeys = new Set(state.componentSelectedRowKeys[id] ?? []);
            let result = rows.slice(0, component.maxItems ?? 50).map((row, index) => {
                const rowKey = data.rowKeys[index] ?? String(index);
                return {
                    id: rowKey,
                    label: String(row[component.primaryField!] ?? ""),
                    secondary: component.secondaryField ? String(row[component.secondaryField] ?? "") : undefined,
                    badge: component.badgeField ? String(row[component.badgeField] ?? "") : undefined,
                    value: component.valueField ? row[component.valueField] : undefined,
                    icon: component.icon,
                    selected: selectedKeys.has(rowKey),
                };
            });
            return result;
        }
        return (component.items ?? []).map((item, index) => ({
            ...item,
            id: item.id ?? `item_${index}`,
            selected: false,
        }));
    }, [component, rows, data.rowKeys, state.componentSelectedRowKeys, id]);

    const handleItemClick = (itemIndex: number, event: Event) => {
        if (!policy.enabled) return;
        const rowIndices = [itemIndex];
        executeComponentInteraction(
            policy,
            createInteractionPayload(component, { rowIndices, sourceRowKeys: context.sourceRowKeys }),
            context,
            { trigger: "click", event }
        );
    };

    const compactClass = component.compact ? "hp-list-compact" : "";
    if (items.length === 0) {
        return <div class="hp-empty hp-empty-compact">No items to display</div>;
    }

    return (
        <ul class={`hp-list-group ${compactClass}`} role="list">
            {items.map((item, index) => (
                <li
                    key={item.id}
                    class={`hp-list-item ${item.selected ? "hp-list-item-selected" : ""} ${(item as any).disabled ? "hp-list-item-disabled" : ""}`}
                    role={policy.enabled ? "button" : undefined}
                    tabIndex={policy.enabled ? 0 : undefined}
                    aria-selected={item.selected}
                    onClick={policy.enabled ? (e) => handleItemClick(index, e) : undefined}
                    onKeyDown={policy.enabled ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleItemClick(index, e); } } : undefined}
                >
                    <div class="hp-list-item-start">
                        {item.icon && <Icon name={item.icon} size="sm" decorative />}
                        <div class="hp-list-item-text">
                            <span class="hp-list-item-primary">{item.label}</span>
                            {item.secondary && <span class="hp-list-item-secondary">{item.secondary}</span>}
                        </div>
                    </div>
                    <div class="hp-list-item-end">
                        {item.value !== undefined && <span class="hp-list-item-value">{String(item.value)}</span>}
                        {item.badge !== undefined && <span class="badge hp-badge">{item.badge}</span>}
                    </div>
                </li>
            ))}
        </ul>
    );
}
