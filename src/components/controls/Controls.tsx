import { useEffect, useMemo, useState } from "preact/hooks";
import { ControlComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";

export function ControlBlock({ component }: { component: ControlComponent }) {
    const { data, state, dispatch } = useRenderContext();
    const id = component.id ?? component.type;
    const initial = state.values[id] ?? component.defaultValue ?? (component.type === "toggle" ? false : component.min ?? "");
    const [value, setValue] = useState<unknown>(initial);
    const options = useMemo(() => component.options ?? (component.field ? Array.from(new Set(data.rows.map(row => row[component.field!]).filter(item => item != null))).map(String).sort() : []), [component.options, component.field, data.rows]);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            dispatch({ type: "value", id, value });
            const hasValue = value !== "" && value !== null && (!Array.isArray(value) || value.length > 0);
            if (component.field && hasValue) {
                const defaultOperator = component.type === "multiSelect" || component.multiple ? "in" : component.type === "searchBox" || component.type === "textInput" ? "contains" : "=";
                dispatch({ type: "filter", filter: { id, field: component.field, operator: component.filter?.operator ?? defaultOperator, value } });
            }
            else if (component.field) dispatch({ type: "removeFilter", id });
            if (component.type === "searchBox") dispatch({ type: "search", value: String(value ?? "") });
        }, component.type === "slider" || component.type === "searchBox" ? 180 : 0);
        return () => window.clearTimeout(handle);
    }, [value]);

    if (component.type === "button") return <button class="btn btn-sm hp-button" type="button" onClick={() => component.action === "clearFilters" ? dispatch({ type: "clearFilters" }) : component.action === "setTab" && dispatch({ type: "tab", id: "mainTabs", value: component.actionValue ?? "" })}>{component.title ?? component.label ?? "Action"}</button>;
    if (component.type === "buttonGroup") return <div class="btn-group">{component.buttons?.map(button => <button type="button" class="btn btn-sm" onClick={() => setValue(button.value ?? button.id)}>{button.label}</button>)}</div>;
    if (component.type === "filterChips") return <div class="hp-chips">{state.filters.map(filter => <button type="button" class="badge hp-chip" onClick={() => dispatch({ type: "removeFilter", id: filter.id })}>{filter.field}: {String(filter.value)} ×</button>)}{state.filters.length > 0 && <button type="button" class="btn btn-sm btn-ghost-secondary" onClick={() => dispatch({ type: "clearFilters" })}>Clear</button>}</div>;

    const label = component.label ?? component.title;
    if (component.type === "toggle") return <label class="form-check form-switch hp-control"><input class="form-check-input" type="checkbox" checked={Boolean(value)} onChange={event => setValue(event.currentTarget.checked)} /><span class="form-check-label">{label}</span></label>;
    if (component.type === "select" || component.type === "multiSelect") {
        const multiple = component.type === "multiSelect" || component.multiple;
        return <label class="hp-control">{label && <span>{label}</span>}<select class="form-select form-select-sm" multiple={multiple} value={multiple ? undefined : String(value ?? "")} onChange={event => setValue(multiple ? Array.from(event.currentTarget.selectedOptions).map(option => option.value) : event.currentTarget.value)}><option value="">All</option>{options.map(option => { const item = typeof option === "string" ? { label: option, value: option } : option; return <option value={String(item.value)} selected={multiple && Array.isArray(value) && value.includes(String(item.value))}>{item.label}</option>; })}</select></label>;
    }
    if (component.type === "slider") return <label class="hp-control">{label && <span>{label}: <strong>{String(value)}</strong></span>}<input class="form-range" type="range" min={component.min} max={component.max} step={component.step} value={Number(value)} onInput={event => setValue(Number(event.currentTarget.value))} /></label>;
    if (component.type === "dateRange") return <div class="hp-control hp-date-range"><span>{label}</span><input class="form-control form-control-sm" type="date" onChange={event => setValue([event.currentTarget.value, Array.isArray(value) ? value[1] : ""])} /><input class="form-control form-control-sm" type="date" onChange={event => setValue([Array.isArray(value) ? value[0] : "", event.currentTarget.value])} /></div>;
    const inputType = component.type === "numberInput" ? "number" : component.type === "searchBox" ? "search" : "text";
    return <label class="hp-control">{label && <span>{label}</span>}<input class="form-control form-control-sm" type={inputType} placeholder={component.placeholder} min={component.min} max={component.max} step={component.step} value={String(value ?? "")} onInput={event => setValue(component.type === "numberInput" ? Number(event.currentTarget.value) : event.currentTarget.value)} /></label>;
}
