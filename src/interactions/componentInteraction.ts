import type { DataRow } from "../data/normalizeData";
import type { RenderContextValue } from "../render/RenderContext";
import type { FilterOperator } from "../schema/hyperpbiSchema";
import { claimInteractionEvent, payloadValueIsEmpty } from "./interactionPayload";
import type { InteractionExecutionResult, InteractionModifiers, InteractionPayload, InteractionSelectionMode, ResolvedInteractionPolicy } from "./interactionTypes";
import { dynamicEventKey } from "../fragments/fragmentTypes";

export function resolveInteractionSelection<T>(current: T[], matching: T[], mode: InteractionSelectionMode = "replace", modifier = false): T[] {
    const selected = new Set(current); const matches = Array.from(new Set(matching));
    const effective = modifier && mode === "replace" ? "toggle" : mode;
    if (effective === "replace") return matches;
    if (effective === "add") { matches.forEach(item => selected.add(item)); return Array.from(selected); }
    const remove = matches.length > 0 && matches.every(item => selected.has(item));
    matches.forEach(item => remove ? selected.delete(item) : selected.add(item));
    return Array.from(selected);
}

function stableValueSerializer(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(stableValueSerializer);
    return value;
}

function signature(payload: InteractionPayload): string {
    return JSON.stringify([
        payload.componentId,
        payload.field,
        payload.operator,
        stableValueSerializer(payload.value),
        [...payload.rowKeys].sort()
    ]);
}

function details(payload: InteractionPayload, externalMode?:"filter"|"selection") {
    return { componentId: payload.componentId, componentType: payload.componentType, field: payload.field, value: payload.value, filterOperator: payload.operator, matchedRowCount: payload.rowIndices.length,externalMode };
}

function highlighted<T>(componentId: string, { state }: Pick<RenderContextValue, "state">, selections: Record<string, T[]>): T[] {
    const rows=new Set<T>();
    for(const [origin,selected] of Object.entries(selections)){
        if(state.componentSelectionModes[origin]!=="highlight")continue;
        const scope=state.componentSelectionScopes[origin]??"self";
        const targets=state.componentSelectionTargets[origin];
        const applies=targets?.length?targets.includes(componentId):origin===componentId?scope!=="others":scope!=="self";
        if(applies)selected.forEach(index=>rows.add(index));
    }
    return Array.from(rows);
}

export function componentRows(componentId: string, context: Pick<RenderContextValue, "state">): number[] {
    return highlighted(componentId, context, context.state.componentSelectedRows);
}

export function componentRowKeys(componentId: string, context: Pick<RenderContextValue, "state">): string[] {
    return highlighted(componentId, context, context.state.componentSelectedRowKeys);
}

/** Clear this component's own selection without clearing another component's host selection. */
export function clearLocalComponentSelection(componentId: string, context: RenderContextValue): void {
    context.dispatch({ type: "selectComponentRows", id: componentId, rows: [] });
    context.dispatch({ type: "selectComponentRowKeys", id: componentId, keys: [] });
    context.dispatch({ type: "componentSelectionScope", id: componentId });
    context.dispatch({ type: "componentSelectionMode", id: componentId });
    context.dispatch({ type: "componentSelectionTargets", id: componentId });
    context.dispatch({ type: "clearInteractionFilter", id: componentId });
    context.dispatch({ type: "interactionSignature", id: componentId });
}

export function clearSharedInteractionState(stateKey: string, context: RenderContextValue): void {
    context.dispatch({ type: "value", id: stateKey, value: "" });
    context.dispatch({ type: "clearInteractionFilter", id: `@state:${stateKey}` });
}

export function clearComponentInteraction(policy: ResolvedInteractionPolicy, componentId: string, context: RenderContextValue): InteractionExecutionResult {
    const previous = context.state.componentSelectedRows[componentId]??[];
    clearLocalComponentSelection(componentId, context);
    if (policy.stateKey) clearSharedInteractionState(policy.stateKey, context);
    context.dispatch({ type: "selectRows", rows: [] });
    context.dispatch({ type: "selectRowKeys", keys: [] });
    let externalSent = false;
    const interactionDetails = { componentId };
    if (context.config.interactions?.crossFilter !== false) {
        if (policy.externalMode === "selection") externalSent = context.clearExternal(interactionDetails).sent;
        if (policy.externalMode === "filter") externalSent = context.clearExternalFilter(interactionDetails).sent;
    } else if(policy.externalMode!=="none")context.reportInteraction(interactionDetails,"interactions disabled",previous);
    return { executed: true, cleared: true, selectedRows: previous, internalApplied: policy.internalMode !== "none", externalSent };
}

function normalizeDatasetInteraction(
    policy: ResolvedInteractionPolicy,
    payload: InteractionPayload,
    context: RenderContextValue,
): { policy: ResolvedInteractionPolicy; payload: InteractionPayload; context: RenderContextValue; translated: boolean } {
    const lineage = context.datasetLineage;
    const sourceRows = context.powerBiSourceRows;
    const sourceRowKeys = context.powerBiSourceRowKeys;
    if (context.interactionIndexSpace !== "component" || !lineage || !sourceRows || !sourceRowKeys) return { policy, payload, context, translated: false };
    const localIndexByKey = new Map(context.sourceRowKeys.map((key, index) => [key, index] as const));
    const localIndices = new Set(payload.rowIndices);
    payload.rowKeys.forEach(key => { const index = localIndexByKey.get(key);if(index !== undefined)localIndices.add(index); });
    if (!localIndices.size) return { policy, payload, context, translated: false };
    const sourceIndices = Array.from(new Set([...localIndices].flatMap(index => lineage[index] ?? []))).sort((left, right) => left - right);
    return {
        policy,
        payload: {
            ...payload,
            rowIndices: sourceIndices,
            rowKeys: sourceIndices.map(index => sourceRowKeys[index]).filter((key): key is string => Boolean(key)),
        },
        context: {
            ...context,
            sourceRows,
            sourceRowKeys,
            datasetLineage: undefined,
            interactionIndexSpace: "powerbi",
            selectExternal: context.selectSourceRows ?? context.selectExternal,
        },
        translated: true,
    };
}

export function executeComponentInteraction(inputPolicy: ResolvedInteractionPolicy, inputPayload: InteractionPayload, inputContext: RenderContextValue, modifiers: InteractionModifiers): InteractionExecutionResult {
    const skipped = (reason: string): InteractionExecutionResult => ({ executed: false, cleared: false, selectedRows: componentRows(inputPayload.componentId, inputContext), internalApplied: false, externalSent: false, reason });
    const dynamicEvent = modifiers.dynamicEvent ?? modifiers.trigger;
    const observed = dynamicEvent && inputContext.dynamicEventKeys?.has(dynamicEventKey(inputPayload.componentId, dynamicEvent));
    const skipReason = !inputPolicy.enabled ? "interaction disabled" : inputPolicy.trigger !== modifiers.trigger ? "trigger mismatch" : undefined;
    if (skipReason && !observed) return skipped(skipReason);
    if (!claimInteractionEvent(modifiers.event)) return skipped("interaction event already handled");
    if (observed && dynamicEvent) {
        const rows = inputPayload.contextRows ?? inputPayload.rowIndices.map(index => inputContext.sourceRows[index]).filter(Boolean);
        const sharedFields = Object.entries(rows[0] ?? {}).filter(([field, value]) => rows.every(row => Object.is(row[field], value)));
        inputContext.emitDynamicEvent?.(inputPayload.componentId, dynamicEvent, {
            ...Object.fromEntries(sharedFields), $field: inputPayload.field,
            $value: Object.hasOwn(modifiers, "contextValue") ? modifiers.contextValue : inputPayload.value,
        });
    }
    if (skipReason) return skipped(skipReason);
    const normalized = normalizeDatasetInteraction(inputPolicy, inputPayload, inputContext);
    const { policy, payload, context } = normalized;
    let effectivePayload: InteractionPayload = {
        ...payload,
        field: policy.field ?? payload.field,
        value: policy.value !== undefined ? policy.value : payload.value,
        operator: policy.operator ?? payload.operator
    };
    const nextSignature = signature(effectivePayload);
    if (policy.clearOnSecondClick && context.state.interactionSignatures[payload.componentId] === nextSignature &&
        (!policy.stateKey || context.state.values[policy.stateKey] === effectivePayload.value)) return clearComponentInteraction(policy, payload.componentId, context);
    const inputValue = effectivePayload.value;

    const hasSourceKeys = context.sourceRowKeys && context.sourceRowKeys.length > 0;

    let selectedRows: number[];
    let selectedRowKeys: string[];

    if (hasSourceKeys && effectivePayload.rowKeys.length) {
        const currentKeys = context.state.componentSelectedRowKeys[payload.componentId] ?? [];
        selectedRowKeys = resolveInteractionSelection(
            currentKeys,
            effectivePayload.rowKeys,
            policy.selectionMode,
            modifiers.multiSelect === true
        );

        const indexByKey = new Map(
            context.sourceRowKeys.map((key, index) => [key, index] as const)
        );

        selectedRows = selectedRowKeys
            .map(key => indexByKey.get(key))
            .filter((index): index is number => index !== undefined);
    } else {
        // Backward-compatible path: use rowIndices directly
        const current = context.state.componentSelectedRows[payload.componentId] ?? [];
        selectedRows = resolveInteractionSelection(
            current,
            effectivePayload.rowIndices,
            policy.selectionMode,
            modifiers.multiSelect === true
        );
        selectedRowKeys = effectivePayload.rowKeys.length
            ? effectivePayload.rowKeys
            : selectedRows.map(index => context.sourceRowKeys[index] ?? `index:${index}`).filter(Boolean);
    }

    if (effectivePayload.field && policy.value === undefined && selectedRows.length && (policy.componentKind === "dataPoint" || policy.componentKind === "custom")) {
        const values=Array.from(new Set(selectedRows.map(index=>context.sourceRows[index]?.[effectivePayload.field as string]).filter(value=>value!==undefined)));
        if(values.length)effectivePayload={...effectivePayload,value:values.length>1?values:values[0],operator:values.length>1?"in":effectivePayload.operator};
    }
    context.dispatch({ type: "selectComponentRows", id: payload.componentId, rows: selectedRows });
    context.dispatch({ type: "selectComponentRowKeys", id: payload.componentId, keys: selectedRowKeys });
    context.dispatch({ type: "componentSelectionScope", id: payload.componentId, scope: policy.internalMode==="highlight"?policy.internalScope:"self" });
    context.dispatch({ type: "componentSelectionMode", id: payload.componentId, mode: policy.internalMode });
    context.dispatch({ type: "componentSelectionTargets", id: payload.componentId, targets: policy.targets });
    if(policy.internalMode!=="none") {
        context.dispatch({ type: "selectRows", rows: selectedRows });
        context.dispatch({ type: "selectRowKeys", keys: selectedRowKeys });
    }
    context.dispatch({ type: "interactionSignature", id: payload.componentId, value: nextSignature });

    let internalApplied = false;
    const sharedValue = inputValue ?? effectivePayload.value;
    if (policy.stateKey && (payloadValueIsEmpty(sharedValue) || typeof sharedValue === "string" ||
        typeof sharedValue === "boolean" || typeof sharedValue === "number" && Number.isFinite(sharedValue))) {
        const filterId = `@state:${policy.stateKey}`;
        context.dispatch({ type: "value", id: policy.stateKey, value: payloadValueIsEmpty(sharedValue) ? "" : sharedValue });
        if (!payloadValueIsEmpty(sharedValue) && policy.internalMode === "filter" && effectivePayload.field) {
            context.dispatch({ type: "interactionFilter", filter: {
                originComponentId: filterId,
                sourceComponentId: payload.componentId,
                field: effectivePayload.field,
                operator: effectivePayload.operator,
                value: sharedValue,
                scope: policy.internalScope,
                targets: policy.targets,
            } });
            internalApplied = true;
        } else context.dispatch({ type: "clearInteractionFilter", id: filterId });
    } else if (!policy.stateKey && policy.internalMode === "filter") {
        // A logical dataset may rename or aggregate fields. Fan linked filtering out by
        // original row identity while retaining the semantic field for an external filter.
        const useSourceIdentity = normalized.translated || context.interactionUsesSourceIdentity === true || !effectivePayload.field;
        const field = useSourceIdentity ? (hasSourceKeys ? "__source_row_key__" : "__source_row_index__") : effectivePayload.field!;
        const value = useSourceIdentity ? (hasSourceKeys ? selectedRowKeys : selectedRows) : effectivePayload.value;
        if (!payloadValueIsEmpty(value)) {
            context.dispatch({ type: "interactionFilter", filter: { originComponentId: payload.componentId, field, operator: useSourceIdentity ? "in" : effectivePayload.operator, value, scope: policy.internalScope, targets: policy.targets } });
            internalApplied = true;
        } else context.dispatch({ type: "clearInteractionFilter", id: payload.componentId });
    } else context.dispatch({ type: "clearInteractionFilter", id: payload.componentId });

    let externalSent = false;
    if (policy.externalMode === "none") context.reportInteraction(details(effectivePayload), "external interaction disabled", selectedRows);
    else if (context.config.interactions?.crossFilter === false) context.reportInteraction(details(effectivePayload,policy.externalMode), "interactions disabled", selectedRows);
    else if (policy.externalMode === "selection") {
        externalSent = selectedRows.length ? context.selectExternal(selectedRows, policy.selectionMode !== "replace" || policy.multiSelect && modifiers.multiSelect === true, details(effectivePayload,"selection")).sent : context.clearExternal(details(effectivePayload,"selection")).sent;
    } else if (!effectivePayload.field) context.reportInteraction(details(effectivePayload,"filter"), "field has no Power BI filter target", selectedRows);
    else {
        externalSent = (policy.componentKind === "dataPoint" || policy.componentKind === "custom") && selectedRows.length === 0 || payloadValueIsEmpty(effectivePayload.value)
            ? context.clearExternalFilter(details(effectivePayload,"filter")).sent
            : context.applyExternalFilter(effectivePayload.field, effectivePayload.operator as FilterOperator, effectivePayload.value, details(effectivePayload,"filter")).sent;
    }
    return { executed: true, cleared: false, selectedRows, internalApplied, externalSent };
}

type ComponentRowFilterContext = Pick<RenderContextValue, "state"> & Partial<Pick<RenderContextValue, "datasetLineage" | "powerBiSourceRowKeys">>;

export function rowsForComponent(sourceRows: DataRow[], sourceRowKeys: string[], dashboardRows: DataRow[], componentId: string, context: ComponentRowFilterContext): DataRow[] {
    const sourceIndex = new Map(sourceRows.map((row, index) => [row, index] as const));
    const sourceIndicesForRow = (row: DataRow): number[] => {
        const index = sourceIndex.get(row);
        if (index === undefined) return [];
        return context.datasetLineage?.[index] ?? [index];
    };
    return context.state.interactionFilters.reduce((rows, filter) => {
        const origin = filter.sourceComponentId ?? filter.originComponentId;
        const applies = filter.targets?.length ? filter.targets.includes(componentId) : filter.scope === "all" || filter.scope === "self" && origin === componentId || filter.scope === "others" && origin !== componentId;
        if (!applies) return rows;
        if (filter.field === "__source_row_key__") {
            const allowed = new Set(
                Array.isArray(filter.value)
                    ? filter.value as string[]
                    : []
            );
            return rows.filter(row => {
                const localIndex = sourceIndex.get(row);
                if (localIndex === undefined) return false;
                const originalKeys = context.powerBiSourceRowKeys;
                return sourceIndicesForRow(row).some(index => allowed.has(originalKeys?.[index] ?? sourceRowKeys[localIndex]));
            });
        }
        if (filter.field === "__source_row_index__") {
            const allowed = new Set(Array.isArray(filter.value) ? filter.value as number[] : []);
            return rows.filter(row => sourceIndicesForRow(row).some(index => allowed.has(index)));
        }
        const compare = (left: unknown, operator: FilterOperator, right: unknown) => operator === "in" && Array.isArray(right) ? right.some(value => value === left) : operator === "=" ? left === right : operator === "!=" ? left !== right : operator === "contains" ? String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase()) : operator === ">" ? Number(left) > Number(right) : operator === ">=" ? Number(left) >= Number(right) : operator === "<" ? Number(left) < Number(right) : operator === "<=" ? Number(left) <= Number(right) : operator === "between" && Array.isArray(right) ? String(left ?? "") >= String(right[0] ?? "") && String(left ?? "") <= String(right[1] ?? "") : false;
        return rows.filter(row => compare(row[filter.field], filter.operator, filter.value));
    }, dashboardRows);
}
