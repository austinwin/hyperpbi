import type { DataRow, NormalizedData } from "../data/normalizeData";
import type { ComponentBase, FilterOperator } from "../schema/hyperpbiSchema";
import type { InteractionPayload } from "./interactionTypes";

const handledEvents = new WeakSet<Event>();

export function claimInteractionEvent(event?: Event): boolean {
    if (!event) return true;
    if (handledEvents.has(event)) return false;
    handledEvents.add(event);
    event.stopPropagation();
    return true;
}

export function payloadValueIsEmpty(value: unknown): boolean {
    return value === "" || value === null || value === undefined || Array.isArray(value) && value.length === 0;
}

export function sourceRowIndex(sourceRows: DataRow[], row: DataRow | undefined): number | undefined {
    if (!row) return undefined;
    const index = sourceRows.indexOf(row);
    return index >= 0 ? index : undefined;
}

export function createInteractionPayload(component: ComponentBase, options: {
    rowIndices?: number[];
    rowKeys?: string[];
    sourceRowKeys?: string[];
    field?: string;
    value?: unknown;
    operator?: FilterOperator;
} = {}): InteractionPayload {
    const field = component.interaction?.field ?? options.field;
    const value = component.interaction?.value !== undefined ? component.interaction.value : options.value;
    const rowIndices = Array.from(
        new Set(options.rowIndices ?? [])
    ).filter(
        index =>
            Number.isInteger(index) &&
            index >= 0
    );

    const rowKeys = Array.from(
        new Set(
            options.rowKeys ??
            (options.sourceRowKeys
                ? rowIndices
                    .map(index => options.sourceRowKeys![index])
                    .filter(
                        (key): key is string =>
                            Boolean(key)
                    )
                : [])
        )
    );

    return {
        componentId: component.id ?? component.type,
        componentType: component.type,
        rowIndices,
        rowKeys,
        field,
        value,
        operator: component.interaction?.operator ?? options.operator ?? (Array.isArray(value) ? "in" : "=")
    };
}

export function deriveBoundPayload(component: ComponentBase, data: NormalizedData, sourceRows: DataRow[], sourceRowKeys: string[], value?: unknown): InteractionPayload {
    const field = component.interaction?.field ?? ("field" in component && typeof component.field === "string" ? component.field : undefined);
    const row = sourceRows[0];
    const resolved = component.interaction?.value !== undefined ? component.interaction.value : value !== undefined ? value : field ? row?.[field] : undefined;
    const rowIndices = field && row && resolved !== undefined ? sourceRows.map((candidate, index) => candidate[field] === resolved ? index : -1).filter(index => index >= 0) : [];
    void data;
    return createInteractionPayload(component, { field, value: resolved, rowIndices, sourceRowKeys });
}
