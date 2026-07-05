import { HyperPbiConfig, parseConfig } from "../config/hyperpbiConfig";
import { NormalizedData } from "../data/normalizeData";

const singleBindings = [
    ["geometry", "Geometry"], ["latitude", "Latitude"], ["longitude", "Longitude"], ["x", "X"], ["y", "Y"], ["address", "Address"], ["city", "City"], ["state", "State"], ["zip", "ZIP"], ["layer", "Layer"], ["type", "Feature type"], ["color", "Color by"], ["size", "Size by"]
] as const;

export function StudioSettings({ data, configuration, onChange }: { data: NormalizedData; configuration: string; onChange: (value: string) => void }) {
    const parsed = parseConfig(configuration); const config = parsed.config; const map = config?.bindings?.map ?? {}; const fields = Object.values(data.fields);
    const update = (key: string, value: string | string[]) => {
        const current: HyperPbiConfig = config ?? { version: "1.0" }; const bindings = { ...(current.bindings?.map ?? {}), [key]: value || undefined };
        onChange(JSON.stringify({ ...current, bindings: { ...current.bindings, map: bindings } }, null, 2));
    };
    return <div class="hp-studio-settings"><section><h3>Map data bindings</h3><p>Assign semantic roles from the fields added to Values. Geometry takes priority over coordinates.</p><div class="hp-settings-grid">{singleBindings.map(([key, label]) => <label><span>{label}</span><select value={String(map[key] ?? "")} onChange={event => update(key, event.currentTarget.value)}><option value="">Not assigned</option>{fields.map(field => <option value={field.key}>{field.displayName} · {field.key}</option>)}</select></label>)}</div><div class="hp-settings-grid hp-settings-grid-wide"><label><span>Tooltip fields</span><select multiple value={undefined} onChange={event => update("tooltip", Array.from(event.currentTarget.selectedOptions).map(option => option.value))}>{fields.map(field => <option value={field.key} selected={map.tooltip?.includes(field.key)}>{field.displayName}</option>)}</select></label><label><span>Detail and popup fields</span><select multiple value={undefined} onChange={event => update("details", Array.from(event.currentTarget.selectedOptions).map(option => option.value))}>{fields.map(field => <option value={field.key} selected={map.details?.includes(field.key)}>{field.displayName}</option>)}</select></label></div></section><section><h3>Report interactions</h3><label class="hp-settings-check"><input type="checkbox" checked={config?.interactions?.crossFilter !== false} onChange={event => onChange(JSON.stringify({ ...config, interactions: { ...config?.interactions, crossFilter: event.currentTarget.checked } }, null, 2))} />Filter and highlight other Power BI visuals</label></section>{parsed.errors.length > 0 && <div class="hp-studio-inline-error">Fix Configuration JSON before using Settings.</div>}</div>;
}
