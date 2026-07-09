import { useEffect, useMemo, useState } from "preact/hooks";
import { resolveSourceRowIndicesForFilter } from "../../data/filtering";
import { clearComponentInteraction, executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { useRenderContext } from "../../render/RenderContext";
import { ControlComponent } from "../../schema/hyperpbiSchema";
import type { UiAction } from "../../actions/uiActionTypes";

export function ControlBlock({ component }: { component: ControlComponent }) {
    const context = useRenderContext();
    const { data, sourceRows, state, dispatch, getRowsForComponent } = context;
    const id = component.id ?? component.type;
    const policy = resolveInteractionPolicy(component, context.config, "control");
    const rows = getRowsForComponent(id);
    const initial = state.values[id] ?? component.defaultValue ?? (component.type === "toggle" ? false : component.min ?? "");
    const [value, setValue] = useState<unknown>(initial);
    const options = useMemo(() => component.options ?? (component.field ? Array.from(new Set(rows.map(row => row[component.field!]).filter(item => item != null))).map(String).sort() : []), [component.options, component.field, rows]);
    const multiple = component.type === "multiSelect" || component.multiple === true;
    const operator = component.interaction?.operator ?? component.filter?.operator ?? (multiple ? "in" : component.type === "searchBox" || component.type === "textInput" ? "contains" : component.type === "dateRange" ? "between" : "=");
    const interactionField=policy.field??component.field;

    // Normalize legacy action to UiAction
    const legacyUiAction = useMemo((): UiAction | undefined => {
        if (!component.action) return undefined;
        if (component.action === "clearFilters") return { type: "clearFilters" };
        if (component.action === "setTab") return { type: "setTab", target: "mainTabs", value: component.actionValue ?? "" };
        return undefined;
    }, [component.action, component.actionValue]);

    const changeValue = (next: unknown, event?: Event) => {
        setValue(next);
        dispatch({ type: "value", id, value: next });
        const rowIndices = interactionField ? resolveSourceRowIndicesForFilter(interactionField, operator, next, sourceRows, rows) : [];
        executeComponentInteraction(policy, createInteractionPayload(component, { rowIndices, sourceRowKeys: context.sourceRowKeys, field: interactionField, value: next, operator }), context, { trigger: policy.trigger, multiSelect: multiple, event });
    };

    useEffect(() => { setValue(state.values[id] ?? initial); }, [state.values[id]]);

    if (component.type === "button") return <button class="btn btn-sm hp-button" type="button" onClick={event => {
        // Execute UI action (legacy or new)
        if (component.uiAction) {
            context.executeUiAction(component.uiAction, event);
        } else if (legacyUiAction) {
            context.executeUiAction(legacyUiAction, event);
        }
        executeComponentInteraction(policy, createInteractionPayload(component, { value: component.actionValue ?? component.interaction?.value }), context, { trigger: policy.trigger==="click"?"click":"change", event });
    }}>{component.title ?? component.label ?? "Action"}</button>;
    if (component.type === "buttonGroup") return <div class="btn-group">{component.buttons?.map(button => <button type="button" class="btn btn-sm" onClick={event => changeValue(button.value ?? button.id, event)}>{button.label}</button>)}</div>;
    if (component.type === "filterChips") {
        const filters = [...state.filters.map(filter => ({ id: filter.id, field: filter.field, value: filter.value })), ...state.interactionFilters.map(filter => ({ id: filter.originComponentId, field: filter.field, value: filter.value }))];
        return <div class="hp-chips">{filters.map(filter => <button type="button" class="badge hp-chip" onClick={event => { dispatch({ type: "removeFilter", id: filter.id }); dispatch({ type: "clearInteractionFilter", id: filter.id }); executeComponentInteraction(policy, createInteractionPayload(component, { field: filter.field, value: "" }), context, { trigger: "change", event }); }}>{filter.field}: {String(filter.value)} ×</button>)}{filters.length > 0 && <button type="button" class="btn btn-sm btn-ghost-secondary" onClick={event => { dispatch({ type: "clearFilters" }); clearComponentInteraction(policy, id, context); executeComponentInteraction(policy, createInteractionPayload(component, { value: "" }), context, { trigger: "change", event }); }}>Clear</button>}</div>;
    }
    if (component.type === "segmentedControl") return <fieldset class="hp-segmented"><legend>{component.label??component.title}</legend><div><button type="button" class={value===""?"is-selected":""} onClick={event=>changeValue("",event)}>All</button>{options.slice(0,20).map(option=>{const item=typeof option==="string"?{label:option,value:option}:option;return <button type="button" class={String(value)===String(item.value)?"is-selected":""} onClick={event=>changeValue(item.value,event)}>{item.label}</button>;})}</div></fieldset>;

    const label = component.label ?? component.title;
    if (component.type === "toggle") return <label class="form-check form-switch hp-control"><input class="form-check-input" type="checkbox" checked={Boolean(value)} onChange={event => changeValue(event.currentTarget.checked, event)} /><span class="form-check-label">{label}</span></label>;
    if (component.type === "select" || component.type === "multiSelect") return <label class="hp-control">{label && <span>{label}</span>}<select class="form-select form-select-sm" multiple={multiple} value={multiple ? undefined : String(value ?? "")} onChange={event => changeValue(multiple ? Array.from(event.currentTarget.selectedOptions).map(option => option.value) : event.currentTarget.value, event)}><option value="">All</option>{options.map(option => { const item = typeof option === "string" ? { label: option, value: option } : option; return <option value={String(item.value)} selected={multiple && Array.isArray(value) && value.includes(String(item.value))}>{item.label}</option>; })}</select></label>;
    if (component.type === "slider") return <label class="hp-control">{label && <span>{label}: <strong>{String(value)}</strong></span>}<input class="form-range" type="range" min={component.min} max={component.max} step={component.step} value={Number(value)} onInput={event => changeValue(Number(event.currentTarget.value), event)} /></label>;
    if (component.type === "dateRange") return <div class="hp-control hp-date-range"><span>{label}</span><input class="form-control form-control-sm" type="date" onChange={event => changeValue([event.currentTarget.value, Array.isArray(value) ? value[1] : ""], event)} /><input class="form-control form-control-sm" type="date" onChange={event => changeValue([Array.isArray(value) ? value[0] : "", event.currentTarget.value], event)} /></div>;
    const inputType = component.type === "numberInput" ? "number" : component.type === "searchBox" ? "search" : "text";
    return <label class="hp-control">{label && <span>{label}</span>}<input class="form-control form-control-sm" type={inputType} placeholder={component.placeholder} min={component.min} max={component.max} step={component.step} value={String(value ?? "")} onInput={event => changeValue(component.type === "numberInput" ? Number(event.currentTarget.value) : event.currentTarget.value, event)} /></label>;
}
