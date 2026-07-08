import type { DataRow } from "../data/normalizeData";
import type { RenderContextValue } from "../render/RenderContext";
import type { FilterOperator } from "../schema/hyperpbiSchema";
import { claimInteractionEvent, payloadValueIsEmpty } from "./interactionPayload";
import type { InteractionExecutionResult, InteractionModifiers, InteractionPayload, InteractionSelectionMode, ResolvedInteractionPolicy } from "./interactionTypes";

export function resolveInteractionSelection(current: number[], matching: number[], mode: InteractionSelectionMode = "replace", modifier = false): number[] {
    const selected = new Set(current); const matches = Array.from(new Set(matching));
    const effective = modifier && mode === "replace" ? "toggle" : mode;
    if (effective === "replace") return matches;
    if (effective === "add") { matches.forEach(index => selected.add(index)); return Array.from(selected); }
    const remove = matches.length > 0 && matches.every(index => selected.has(index));
    matches.forEach(index => remove ? selected.delete(index) : selected.add(index));
    return Array.from(selected);
}

function signature(payload: InteractionPayload): string {
    return JSON.stringify([payload.field, payload.operator, payload.value, payload.rowIndices]);
}

function details(payload: InteractionPayload, externalMode?:"filter"|"selection") {
    return { componentId: payload.componentId, componentType: payload.componentType, field: payload.field, value: payload.value, filterOperator: payload.operator, matchedRowCount: payload.rowIndices.length,externalMode };
}

export function componentRows(componentId: string, context: Pick<RenderContextValue, "state">): number[] {
    const rows=new Set<number>();for(const [origin,selected] of Object.entries(context.state.componentSelectedRows)){if(context.state.componentSelectionModes[origin]!=="highlight")continue;const scope=context.state.componentSelectionScopes[origin]??"self";const applies=origin===componentId?scope!=="others":scope!=="self";if(applies)selected.forEach(index=>rows.add(index));}return Array.from(rows);
}

export function clearComponentInteraction(policy: ResolvedInteractionPolicy, componentId: string, context: RenderContextValue): InteractionExecutionResult {
    const previous = context.state.componentSelectedRows[componentId]??[];
    context.dispatch({ type: "selectComponentRows", id: componentId, rows: [] });
    context.dispatch({ type: "componentSelectionScope", id: componentId });
    context.dispatch({ type: "componentSelectionMode", id: componentId });
    context.dispatch({ type: "selectRows", rows: [] });
    context.dispatch({ type: "clearInteractionFilter", id: componentId });
    context.dispatch({ type: "interactionSignature", id: componentId });
    let externalSent = false;
    const interactionDetails = { componentId };
    if (context.config.interactions?.crossFilter !== false) {
        if (policy.externalMode === "selection") externalSent = context.clearExternal(interactionDetails).sent;
        if (policy.externalMode === "filter") externalSent = context.clearExternalFilter(interactionDetails).sent;
    } else if(policy.externalMode!=="none")context.reportInteraction(interactionDetails,"interactions disabled",previous);
    return { executed: true, cleared: true, selectedRows: previous, internalApplied: policy.internalMode !== "none", externalSent };
}

export function executeComponentInteraction(policy: ResolvedInteractionPolicy, payload: InteractionPayload, context: RenderContextValue, modifiers: InteractionModifiers): InteractionExecutionResult {
    if (!policy.enabled) return { executed: false, cleared: false, selectedRows: componentRows(payload.componentId, context), internalApplied: false, externalSent: false, reason: "interaction disabled" };
    if (policy.trigger !== modifiers.trigger) return { executed: false, cleared: false, selectedRows: componentRows(payload.componentId, context), internalApplied: false, externalSent: false, reason: "trigger mismatch" };
    if (!claimInteractionEvent(modifiers.event)) return { executed: false, cleared: false, selectedRows: componentRows(payload.componentId, context), internalApplied: false, externalSent: false, reason: "interaction event already handled" };
    let effectivePayload: InteractionPayload = {
        ...payload,
        field: policy.field ?? payload.field,
        value: policy.value !== undefined ? policy.value : payload.value,
        operator: policy.operator ?? payload.operator
    };
    const nextSignature = signature(effectivePayload);
    if (policy.clearOnSecondClick && context.state.interactionSignatures[payload.componentId] === nextSignature) return clearComponentInteraction(policy, payload.componentId, context);
    const current = context.state.componentSelectedRows[payload.componentId]??[];
    const selectedRows = resolveInteractionSelection(current, effectivePayload.rowIndices, policy.selectionMode, modifiers.multiSelect === true);
    if (effectivePayload.field && policy.value === undefined && selectedRows.length && (policy.componentKind === "dataPoint" || policy.componentKind === "custom")) {
        const values=Array.from(new Set(selectedRows.map(index=>context.sourceRows[index]?.[effectivePayload.field as string]).filter(value=>value!==undefined)));
        if(values.length)effectivePayload={...effectivePayload,value:values.length>1?values:values[0],operator:values.length>1?"in":effectivePayload.operator};
    }
    context.dispatch({ type: "selectComponentRows", id: payload.componentId, rows: selectedRows });
    context.dispatch({ type: "componentSelectionScope", id: payload.componentId, scope: policy.internalMode==="highlight"?policy.internalScope:"self" });
    context.dispatch({ type: "componentSelectionMode", id: payload.componentId, mode: policy.internalMode });
    if(policy.internalMode!=="none")context.dispatch({ type: "selectRows", rows: selectedRows });
    context.dispatch({ type: "interactionSignature", id: payload.componentId, value: nextSignature });

    let internalApplied = false;
    if (policy.internalMode === "filter") {
        const field = effectivePayload.field ?? "__source_row_index__";
        const value = effectivePayload.field ? effectivePayload.value : selectedRows;
        if (!payloadValueIsEmpty(value)) {
            context.dispatch({ type: "interactionFilter", filter: { originComponentId: payload.componentId, field, operator: effectivePayload.field ? effectivePayload.operator : "in", value, scope: policy.internalScope } });
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

export function rowsForComponent(sourceRows: DataRow[], dashboardRows: DataRow[], componentId: string, context: Pick<RenderContextValue, "state">): DataRow[] {
    const sourceIndex = new Map(sourceRows.map((row, index) => [row, index] as const));
    return context.state.interactionFilters.reduce((rows, filter) => {
        const applies = filter.scope === "all" || filter.scope === "self" && filter.originComponentId === componentId || filter.scope === "others" && filter.originComponentId !== componentId;
        if (!applies) return rows;
        if (filter.field === "__source_row_index__") { const allowed = new Set(Array.isArray(filter.value) ? filter.value : []); return rows.filter(row => allowed.has(sourceIndex.get(row))); }
        const compare = (left: unknown, operator: FilterOperator, right: unknown) => operator === "in" && Array.isArray(right) ? right.some(value => value === left) : operator === "=" ? left === right : operator === "!=" ? left !== right : operator === "contains" ? String(left ?? "").toLowerCase().includes(String(right ?? "").toLowerCase()) : operator === ">" ? Number(left) > Number(right) : operator === ">=" ? Number(left) >= Number(right) : operator === "<" ? Number(left) < Number(right) : operator === "<=" ? Number(left) <= Number(right) : operator === "between" && Array.isArray(right) ? String(left ?? "") >= String(right[0] ?? "") && String(left ?? "") <= String(right[1] ?? "") : false;
        return rows.filter(row => compare(row[filter.field], filter.operator, filter.value));
    }, dashboardRows);
}
