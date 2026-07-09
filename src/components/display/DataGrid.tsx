import { h } from "preact";
import { useMemo } from "preact/hooks";
import type { DataGridComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { selectedSourceRowIndex } from "../../render/selection";
import { Icon } from "../icons/Icon";

export function DataGrid({ component }: { component: DataGridComponent }) {
    const context = useRenderContext();
    const { data, state, sourceRowKeys, sourceRows } = context;
    const columns = component.columns ?? 2;
    const selectedRow = component.selectedRow === true;

    const rowIndex = selectedRow ? selectedSourceRowIndex(state, sourceRowKeys) : undefined;
    const row = rowIndex !== undefined ? sourceRows[rowIndex] : undefined;

    const items = useMemo(() => {
        if (row && component.items) {
            return component.items.map(item => ({
                label: item.label,
                value: item.field ? row[item.field] : item.value,
                format: item.format,
                badge: item.badge,
                copyable: item.copyable,
                icon: item.icon,
            }));
        }
        return (component.items ?? []).map(item => ({
            label: item.label,
            value: item.field ? undefined : item.value,
            format: item.format,
            badge: item.badge,
            copyable: item.copyable,
            icon: item.icon,
        }));
    }, [component.items, row]);

    if (!selectedRow && selectedRow) {
        return <div class="hp-empty hp-empty-compact">Select a row to view details</div>;
    }

    if (items.length === 0) {
        return <div class="hp-empty hp-empty-compact">No data to display</div>;
    }

    return (
        <dl class={`hp-data-grid hp-data-grid-${columns}`}>
            {items.map((item, index) => (
                <div key={index} class="hp-data-grid-item">
                    <dt>
                        {item.icon && <Icon name={item.icon} size="xs" decorative />}
                        {item.label}
                    </dt>
                    <dd>
                        {item.badge ? (
                            <span class="badge hp-badge hp-data-badge">{formatValue(item.value, item.format)}</span>
                        ) : (
                            <span>{formatValue(item.value, item.format)}</span>
                        )}
                        {item.copyable && item.value !== undefined && (
                            <button
                                type="button"
                                class="hp-btn-icon hp-copy-btn"
                                aria-label={`Copy ${item.label}`}
                                onClick={() => {
                                    navigator.clipboard?.writeText(String(item.value ?? ""));
                                }}
                            >
                                <Icon name="copy" size="xs" decorative />
                            </button>
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function formatValue(value: unknown, format?: string): string {
    if (value === undefined || value === null) return "—";
    if (typeof value === "number") {
        if (format === "currency") return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (format === "integer") return value.toLocaleString();
        if (format === "percent") return `${(value * 100).toFixed(1)}%`;
        if (format === "number") return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
        return value.toLocaleString();
    }
    return String(value);
}
