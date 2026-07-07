import { useEffect, useMemo, useState } from "preact/hooks";
import { ControlComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveSourceRowIndicesForFilter } from "../../data/filtering";

export function ControlBlock({ component }: { component: ControlComponent }) {
    const { data, sourceRows, state, dispatch, selectExternal, clearExternal } = useRenderContext();
    const id = component.id ?? component.type;
    const initial = state.values[id] ?? component.defaultValue ?? (component.type === "toggle" ? false : component.min ?? "");
    const [value, setValue] = useState<unknown>(initial);
    const options = useMemo(() => component.options ?? (component.field ? Array.from(new Set(data.rows.map(row => row[component.field!]).filter(item => item != null))).map(String).sort() : []), [component.options, component.field, data.rows]);
    const multiple = component.type === "multiSelect" || component.multiple === true;
    const operator = component.filter?.operator ?? (multiple ? "in" : component.type === "searchBox" || component.type === "textInput" ? "contains" : "=");
    const changeValue = (next: unknown) => {
        setValue(next);
        if (component.external !== true) return;
        const hasValue = next !== "" && next !== null && (!Array.isArray(next) || next.length > 0);
        const details = { componentId: id, componentType: component.type, field: component.field, value: next };
        if (hasValue) {
            const indices = resolveSourceRowIndicesForFilter(component.field, operator, next, sourceRows, data.rows);
            dispatch({ type: "selectComponentRows", id, rows: indices }); selectExternal(indices, multiple, details);
        } else { dispatch({ type: "selectComponentRows", id, rows: [] }); clearExternal(details); }
    };

    useEffect(() => {
        const handle = window.setTimeout(() => {
            dispatch({ type: "value", id, value });
            const hasValue = value !== "" && value !== null && (!Array.isArray(value) || value.length > 0);
            if (component.field && hasValue && component.internal !== false) {
                dispatch({ type: "filter", filter: { id, field: component.field, operator, value } });
            }
            else if (component.field && component.internal !== false) dispatch({ type: "removeFilter", id });
            if (component.type === "searchBox" && component.internal !== false) dispatch({ type: "search", value: String(value ?? "") });
        }, component.type === "slider" || component.type === "searchBox" ? 180 : 0);
        return () => window.clearTimeout(handle);
    }, [value]);

    if (component.type === "button") return <button class="btn btn-sm hp-button" type="button" onClick={() => component.action === "clearFilters" ? dispatch({ type: "clearFilters" }) : component.action === "setTab" && dispatch({ type: "tab", id: "mainTabs", value: component.actionValue ?? "" })}>{component.title ?? component.label ?? "Action"}</button>;
    if (component.type === "buttonGroup") return <div class="btn-group">{component.buttons?.map(button => <button type="button" class="btn btn-sm" onClick={() => changeValue(button.value ?? button.id)}>{button.label}</button>)}</div>;
    if (component.type === "filterChips") return <div class="hp-chips">{state.filters.map(filter => <button type="button" class="badge hp-chip" onClick={() => dispatch({ type: "removeFilter", id: filter.id })}>{filter.field}: {String(filter.value)} ×</button>)}{state.filters.length > 0 && <button type="button" class="btn btn-sm btn-ghost-secondary" onClick={() => dispatch({ type: "clearFilters" })}>Clear</button>}</div>;
    if (component.type === "segmentedControl") {
        const choose=(next:unknown)=>changeValue(next);
        return <fieldset class="hp-segmented"><legend>{component.label??component.title}</legend><div><button type="button" class={value===""?"is-selected":""} onClick={()=>choose("")}>All</button>{options.slice(0,20).map(option=>{const item=typeof option==="string"?{label:option,value:option}:option;return <button type="button" class={String(value)===String(item.value)?"is-selected":""} onClick={()=>choose(item.value)}>{item.label}</button>;})}</div></fieldset>;
    }

    const label = component.label ?? component.title;
    if (component.type === "toggle") return <label class="form-check form-switch hp-control"><input class="form-check-input" type="checkbox" checked={Boolean(value)} onChange={event => changeValue(event.currentTarget.checked)} /><span class="form-check-label">{label}</span></label>;
    if (component.type === "select" || component.type === "multiSelect") {
        const multiple = component.type === "multiSelect" || component.multiple;
        return <label class="hp-control">{label && <span>{label}</span>}<select class="form-select form-select-sm" multiple={multiple} value={multiple ? undefined : String(value ?? "")} onChange={event => changeValue(multiple ? Array.from(event.currentTarget.selectedOptions).map(option => option.value) : event.currentTarget.value)}><option value="">All</option>{options.map(option => { const item = typeof option === "string" ? { label: option, value: option } : option; return <option value={String(item.value)} selected={multiple && Array.isArray(value) && value.includes(String(item.value))}>{item.label}</option>; })}</select></label>;
    }
    if (component.type === "slider") return <label class="hp-control">{label && <span>{label}: <strong>{String(value)}</strong></span>}<input class="form-range" type="range" min={component.min} max={component.max} step={component.step} value={Number(value)} onInput={event => changeValue(Number(event.currentTarget.value))} /></label>;
    if (component.type === "dateRange") return <div class="hp-control hp-date-range"><span>{label}</span><input class="form-control form-control-sm" type="date" onChange={event => changeValue([event.currentTarget.value, Array.isArray(value) ? value[1] : ""])} /><input class="form-control form-control-sm" type="date" onChange={event => changeValue([Array.isArray(value) ? value[0] : "", event.currentTarget.value])} /></div>;
    const inputType = component.type === "numberInput" ? "number" : component.type === "searchBox" ? "search" : "text";
    return <label class="hp-control">{label && <span>{label}</span>}<input class="form-control form-control-sm" type={inputType} placeholder={component.placeholder} min={component.min} max={component.max} step={component.step} value={String(value ?? "")} onInput={event => changeValue(component.type === "numberInput" ? Number(event.currentTarget.value) : event.currentTarget.value)} /></label>;
}
