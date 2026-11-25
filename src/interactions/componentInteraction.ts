import { indexRows } from "../data/rowIndex";
import { compileFilter, scalarFilterKey } from "../data/filtering";
import type { DataRow } from "../data/normalizeData";
import type { RenderContextValue } from "../render/RenderContext";
import type { FilterOperator } from "../schema/hyperpbiSchema";
import { claimInteractionEvent, payloadValueIsEmpty } from "./interactionPayload";
import type { InteractionExecutionResult, InteractionModifiers, InteractionPayload, InteractionSelectionMode, InternalInteractionFilter, ResolvedInteractionPolicy } from "./interactionTypes";
import { dynamicEventKey } from "../fragments/fragmentTypes";

export function resolveInteractionSelection<T>(current: T[], matching: T[], mode: InteractionSelectionMode = "replace", modifier = false): T[] {
    const matches = Array.from(new Set(matching));
    const effective = modifier && mode === "replace" ? "toggle" : mode;
    if (effective === "replace") return matches;
    const selected = new Set(current);
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

export function executeComponentInteraction(policy: ResolvedInteractionPolicy, payload: InteractionPayload, context: RenderContextValue, modifiers: InteractionModifiers): InteractionExecutionResult {
    if (!context.profiler) return runComponentInteraction(policy, payload, context, modifiers);
    const started = performance.now();
    try {
        return runComponentInteraction(policy, payload, context, modifiers);
    } finally {
        context.profiler.record("Interaction dispatch", started);
    }
}

function runComponentInteraction(inputPolicy: ResolvedInteractionPolicy, inputPayload: InteractionPayload, inputContext: RenderContextValue, modifiers: InteractionModifiers): InteractionExecutionResult {
    const skipped = (reason: string): InteractionExecutionResult => ({ executed: false, cleared: false, selectedRows: componentRows(inputPayload.componentId, inputContext), internalApplied: false, externalSent: false, reason });
    const dynamicEvent = modifiers.dynamicEvent ?? modifiers.trigger;
    const candidates = new Set(Object.keys(modifiers.dynamicContexts ?? {}) as import("../fragments/fragmentTypes").DynamicTrigger["event"][]);
    if (dynamicEvent) candidates.add(dynamicEvent);
    const observed = [...candidates].filter(event => inputContext.dynamicEventKeys?.has(dynamicEventKey(inputPayload.componentId, event)));
    const skipReason = !inputPolicy.enabled ? "interaction disabled" : inputPolicy.trigger !== modifiers.trigger ? "trigger mismatch" : undefined;
    if (skipReason && !observed.length) return skipped(skipReason);
    if (!claimInteractionEvent(modifiers.event)) return skipped("interaction event already handled");
    if (observed.length) {
        const rows = inputPayload.contextRows ?? inputPayload.rowIndices.map(index => inputContext.sourceRows[index]).filter(Boolean);
        const sharedFields = Object.entries(rows[0] ?? {}).filter(([field, value]) => rows.every(row => Object.is(row[field], value)));
        const values = { ...Object.fromEntries(sharedFields), $field: inputPayload.field,
            $value: Object.hasOwn(modifiers, "contextValue") ? modifiers.contextValue : inputPayload.value };
        for (const event of observed) inputContext.emitDynamicEvent?.(inputPayload.componentId, event, { ...values, ...modifiers.dynamicContexts?.[event] });
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
    const nextSignature = policy.clearOnSecondClick ? signature(effectivePayload) : undefined;
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

        const matching = effectivePayload.rowIndices;
        if (matching.length === selectedRowKeys.length &&
            matching.every((index, position) => context.sourceRowKeys[index] === selectedRowKeys[position])) {
            selectedRows = matching;
        } else {
            const knownIndices = new Map(matching.map(index => [context.sourceRowKeys[index], index] as const));
            const missing = new Set(selectedRowKeys.filter(key => !knownIndices.has(key)));
            if (missing.size) {
                for (let index = 0; index < context.sourceRowKeys.length && missing.size; index++) {
                    const key = context.sourceRowKeys[index];
                    if (missing.delete(key)) knownIndices.set(key, index);
                }
            }
            selectedRows = selectedRowKeys.map(key => knownIndices.get(key)).filter((index): index is number => index !== undefined);
        }
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

    const incompleteRange = effectivePayload.operator === "between" && (
        !Array.isArray(inputValue) || inputValue.length < 2 || inputValue.some(payloadValueIsEmpty)
    );
    const sharedValue = inputValue ?? effectivePayload.value;
    const scalar = (value: unknown) => value === null || typeof value === "string" ||
        typeof value === "boolean" || typeof value === "number" && Number.isFinite(value);
    const writableState = policy.stateKey && (payloadValueIsEmpty(sharedValue) || scalar(sharedValue) ||
        Array.isArray(sharedValue) && sharedValue.every(scalar));
    const filterId = writableState ? `@state:${policy.stateKey}` : payload.componentId;
    if (writableState) context.dispatch({ type: "value", id: policy.stateKey!, value: payloadValueIsEmpty(sharedValue) ? "" : sharedValue });
    const useSourceIdentity = Boolean(modifiers.rowIdentityFilter) || !writableState &&
        (normalized.translated || context.interactionUsesSourceIdentity === true || !effectivePayload.field);
    const filterField = useSourceIdentity ? (hasSourceKeys ? "__source_row_key__" : "__source_row_index__") : effectivePayload.field!;
    const filterValue = useSourceIdentity ? (hasSourceKeys ? selectedRowKeys : selectedRows) : writableState ? sharedValue : effectivePayload.value;
    const internalApplied = policy.internalMode === "filter" && (!policy.stateKey || Boolean(writableState)) &&
        !incompleteRange && Boolean(filterField) && !payloadValueIsEmpty(filterValue);
    if (internalApplied) {
        context.dispatch({ type: "interactionFilter", filter: {
            originComponentId: filterId,
            sourceComponentId: payload.componentId,
            field: filterField, operator: useSourceIdentity ? "in" : effectivePayload.operator, value: filterValue,
            scope: policy.internalScope, targets: policy.targets,
        } });
    } else context.dispatch({ type: "clearInteractionFilter", id: filterId });

    let externalSent = false;
    if (policy.externalMode === "none") context.reportInteraction(details(effectivePayload), "external interaction disabled", selectedRows);
    else if (context.config.interactions?.crossFilter === false) context.reportInteraction(details(effectivePayload,policy.externalMode), "interactions disabled", selectedRows);
    else if (policy.externalMode === "selection") {
        externalSent = selectedRows.length ? context.selectExternal(selectedRows, policy.selectionMode !== "replace" || policy.multiSelect && modifiers.multiSelect === true, details(effectivePayload,"selection")).sent : context.clearExternal(details(effectivePayload,"selection")).sent;
    } else if (!effectivePayload.field) context.reportInteraction(details(effectivePayload,"filter"), "field has no Power BI filter target", selectedRows);
    else {
        externalSent = (policy.componentKind === "dataPoint" || policy.componentKind === "custom") && selectedRows.length === 0 || incompleteRange || payloadValueIsEmpty(effectivePayload.value)
            ? context.clearExternalFilter(details(effectivePayload,"filter")).sent
            : context.applyExternalFilter(effectivePayload.field, effectivePayload.operator as FilterOperator, effectivePayload.value, details(effectivePayload,"filter")).sent;
    }
    return { executed: true, cleared: false, selectedRows, internalApplied, externalSent };
}

type ComponentRowFilterContext = Pick<RenderContextValue, "state"> & Partial<Pick<RenderContextValue, "datasetLineage" | "powerBiSourceRowKeys">>;

export function createComponentRowRouter(
    sourceRows: DataRow[],
    sourceRowKeys: string[],
    dashboardRows: DataRow[],
    datasetLineage?: number[][],
    powerBiSourceRowKeys?: string[],
) {
    // Filters and row arrays are immutable snapshots. A single matching pass
    // can serve every component reached by the same ordered filter chain.
    const results = new WeakMap<InternalInteractionFilter, WeakMap<DataRow[], DataRow[]>>();
    const repeatedResults = new WeakMap<DataRow[], Map<string, DataRow[]>>();
    const predicateFor = (filter: InternalInteractionFilter): ((row: DataRow) => boolean) => {
        if (filter.field !== "__source_row_key__" && filter.field !== "__source_row_index__") {
            const match = compileFilter(filter.operator, filter.value, "component");
            return row => match(row[filter.field]);
        }
        const allowed = new Set<unknown>(Array.isArray(filter.value) ? filter.value : []);
        const matchSource = filter.field === "__source_row_index__"
            ? (index: number) => allowed.has(index)
            : (index: number, localIndex: number) => allowed.has(powerBiSourceRowKeys?.[index] ?? sourceRowKeys[localIndex]);
        const sourceIndex = indexRows(sourceRows);
        return row => {
            const localIndex = sourceIndex.get(row);
            if (localIndex === undefined) return false;
            const lineage = datasetLineage?.[localIndex];
            return lineage ? lineage.some(index => matchSource(index, localIndex)) : matchSource(localIndex, localIndex);
        };
    };

    return (componentId: string, filters: readonly InternalInteractionFilter[]): DataRow[] => {
        let rows = dashboardRows;
        for (const filter of filters) {
            const origin = filter.sourceComponentId ?? filter.originComponentId;
            const applies = filter.targets?.length ? filter.targets.includes(componentId)
                : filter.scope === "all" || filter.scope === "self" && origin === componentId ||
                    filter.scope === "others" && origin !== componentId;
            if (!applies) continue;
            let cached = results.get(filter);
            if (!cached) {
                cached = new WeakMap();
                results.set(filter, cached);
            }
            let filtered = cached.get(rows);
            if (!filtered) {
                const key = filter.field === "__source_row_key__" || filter.field === "__source_row_index__"
                    ? undefined : scalarFilterKey(filter.field, filter.operator, filter.value);
                let repeated = key !== undefined ? repeatedResults.get(rows) : undefined;
                filtered = key !== undefined ? repeated?.get(key) : undefined;
                if (!filtered) {
                    const result = rows.filter(predicateFor(filter));
                    filtered = result.length === rows.length ? rows : result;
                    if (key !== undefined && result.length <= 100_000) {
                        if (!repeated) repeatedResults.set(rows, repeated = new Map());
                        if (repeated.size === 3) repeated.delete(repeated.keys().next().value!);
                        repeated.set(key, filtered);
                    }
                }
                cached.set(rows, filtered);
            }
            rows = filtered;
        }
        return rows;
    };
}

export function rowsForComponent(sourceRows: DataRow[], sourceRowKeys: string[], dashboardRows: DataRow[], componentId: string, context: ComponentRowFilterContext): DataRow[] {
    return createComponentRowRouter(sourceRows, sourceRowKeys, dashboardRows, context.datasetLineage, context.powerBiSourceRowKeys)(componentId, context.state.interactionFilters);
}
