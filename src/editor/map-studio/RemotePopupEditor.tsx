import type { RemoteFragmentRequest } from "../../fragments/fragmentTypes";
import type { NormalizedField } from "../../data/normalizeData";
import type { MapAttributeSource } from "../../maps/attributes/mapFeatureAttributes";
import { DraftInput } from "./MapDraftInput";

export function RemotePopupEditor({ request, fieldSets, onChange }: { request: RemoteFragmentRequest; fieldSets: Record<MapAttributeSource, NormalizedField[]>; onChange: (request: RemoteFragmentRequest) => void }) {
    const patch = (change: Partial<RemoteFragmentRequest>) => onChange({ ...request, ...change });
    return <fieldset class="hp-remote-popup-editor"><legend>Remote Fragment</legend>
        <DraftInput label="HTTPS endpoint" value={request.endpoint} onCommit={endpoint => patch({ endpoint })} />
        <p>Use a public MiniUp .app or .io URL, or a host approved by this build. The endpoint returns a HyperPBI fragment.</p>
        <label><span>Insert feature binding</span><select aria-label="Insert remote feature binding" value="" onChange={event => { if (event.currentTarget.value) patch({ endpoint: request.endpoint + `{{${event.currentTarget.value}}}` }); }}><option value="">Choose an attribute</option>{(["service", "powerbi", "joined"] as const).map(source => <optgroup label={source}>{fieldSets[source].map(field => <option value={`${source}.${field.key}`}>{field.displayName}</option>)}</optgroup>)}</select></label>
        <small>Example: https://my-app.miniup.io/api/sensor?id={"{{service.site_id}}"}</small>
        <details><summary>Request, fallback and size</summary>
            <label>Timeout (ms)<input type="number" min="1000" max="15000" value={request.timeoutMs ?? 10000} onChange={event => patch({ timeoutMs: Number(event.currentTarget.value) })} /></label>
            <label>Cache TTL (seconds)<input type="number" min="0" max="3600" value={request.cacheTtlSeconds ?? 30} onChange={event => patch({ cacheTtlSeconds: Number(event.currentTarget.value) })} /></label>
            <label>Fallback<select value={request.fallback ?? "message"} onChange={event => patch({ fallback: event.currentTarget.value as "message" | "attributes" })}><option value="message">Friendly message</option><option value="attributes">Feature attributes</option></select></label>
            <DraftInput label="Fallback message" value={request.fallbackMessage ?? ""} onCommit={fallbackMessage => patch({ fallbackMessage })} />
            <label>Popup width (px)<input type="number" min="280" max="1000" value={request.width ?? 520} onChange={event => patch({ width: Number(event.currentTarget.value) })} /></label>
            <label>Maximum height (px)<input type="number" min="200" max="1000" value={request.maxHeight ?? 560} onChange={event => patch({ maxHeight: Number(event.currentTarget.value) })} /></label>
        </details>
    </fieldset>;
}
