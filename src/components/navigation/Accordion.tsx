import { h } from "preact";
import { useMemo } from "preact/hooks";
import type { AccordionComponent } from "../../schema/hyperpbiSchema";
import { DashboardComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";
import { DashboardRenderer } from "../../render/DashboardRenderer";

export function Accordion({
    component,
    renderChildren,
}: {
    component: AccordionComponent;
    renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren;
}) {
    const context = useRenderContext();
    const { state, dispatch } = context;
    const accordionId = component.id ?? component.type;
    const openItems = state.accordionOpenItems[accordionId] ?? component.defaultOpenItems ?? [];
    const multiple = component.multiple ?? false;

    const toggleItem = (itemId: string) => {
        let next: string[];
        if (multiple) {
            next = openItems.includes(itemId)
                ? openItems.filter(id => id !== itemId)
                : [...openItems, itemId];
        } else {
            next = openItems.includes(itemId) ? [] : [itemId];
        }
        dispatch({ type: "accordion", id: accordionId, items: next });
    };

    const handleKeyDown = (e: KeyboardEvent, itemIndex: number) => {
        const headers = component.items.filter(item => !item.disabled);
        let newIndex = itemIndex;
        if (e.key === "ArrowDown") newIndex = Math.min(itemIndex + 1, headers.length - 1);
        else if (e.key === "ArrowUp") newIndex = Math.max(itemIndex - 1, 0);
        else if (e.key === "Home") newIndex = 0;
        else if (e.key === "End") newIndex = headers.length - 1;
        else return;

        e.preventDefault();
        const el = document.querySelector(`[data-accordion-header="${headers[newIndex].id}"]`) as HTMLElement;
        el?.focus();
    };

    if (!component.items || component.items.length === 0) {
        // Legacy accordion with only children — create one item
        if (component.children && component.children.length > 0) {
            const legacyItemId = `${accordionId}_item`;
            const isOpen = openItems.includes(legacyItemId);

            return (
                <div class="hp-accordion">
                    <div class={`hp-accordion-item ${isOpen ? "is-open" : ""}`}>
                        <button
                            type="button"
                            class="hp-accordion-header"
                            aria-expanded={isOpen}
                            data-accordion-header={legacyItemId}
                            onClick={() => toggleItem(legacyItemId)}
                        >
                            <span class="hp-accordion-title">{component.title ?? "Section"}</span>
                            <Icon name={isOpen ? "chevron-up" : "chevron-down"} size="xs" decorative />
                        </button>
                        {isOpen && (
                            <div class="hp-accordion-body" role="region" aria-labelledby={legacyItemId}>
                                {renderChildren(component.children)}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div class="hp-accordion">
            {component.items.map((item, index) => {
                const isOpen = openItems.includes(item.id);
                const isDisabled = item.disabled ?? false;

                return (
                    <div key={item.id} class={`hp-accordion-item ${isOpen ? "is-open" : ""} ${isDisabled ? "hp-accordion-disabled" : ""}`}>
                        <button
                            type="button"
                            class="hp-accordion-header"
                            aria-expanded={isOpen}
                            aria-disabled={isDisabled}
                            data-accordion-header={item.id}
                            onClick={() => !isDisabled && toggleItem(item.id)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        >
                            <div class="hp-accordion-header-start">
                                {item.icon && <Icon name={item.icon} size="sm" decorative />}
                                <div>
                                    <span class="hp-accordion-title">{item.title}</span>
                                    {item.subtitle && <span class="hp-accordion-subtitle">{item.subtitle}</span>}
                                </div>
                            </div>
                            <Icon name={isOpen ? "chevron-up" : "chevron-down"} size="xs" decorative />
                        </button>
                        {isOpen && (
                            <div class="hp-accordion-body" role="region" aria-labelledby={item.id}>
                                {renderChildren(item.children ?? [])}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
