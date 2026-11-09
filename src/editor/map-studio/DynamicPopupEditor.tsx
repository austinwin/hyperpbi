import type { NormalizedField } from "../../data/normalizeData";
import type { MapAttributeSource } from "../../maps/attributes/mapFeatureAttributes";
import type { MapPopupDefinition } from "../../schema/mapSchema";
import type { RemoteFragmentRequest } from "../../fragments/fragmentTypes";
import { DraftInput } from "./MapDraftInput";

export function DynamicPopupEditor({ popup, fieldSets, onChange }: {
    popup: MapPopupDefinition;
    fieldSets: Record<MapAttributeSource, NormalizedField[]>;
    onChange: (change: Partial<MapPopupDefinition>) => void;
}) {
    const request = popup.request ?? { endpoint: "" };
    const patch = (change: Partial<RemoteFragmentRequest>) => onChange({ request: { ...request, ...change } });
    const fields = new Map([...fieldSets.service, ...fieldSets.powerbi, ...fieldSets.joined].map(field => [field.key, field]));
    return <fieldset class="hp-remote-popup-editor"><legend>Dynamic Content</legend>
        <DraftInput label="HTTPS endpoint" value={request.endpoint} onCommit={endpoint => patch({ endpoint })} />
        <p>Use a public MiniUp URL or a host approved by this build. The endpoint returns a HyperPBI fragment.</p>
        <label><span>Insert feature binding</span><select aria-label="Insert feature binding" value="" onChange={event => {
            const field = event.currentTarget.value;
            if (field) patch({ endpoint: `${request.endpoint}{{context.${field}}}` });
        }}><option value="">Choose an attribute</option>{[...fields.values()].map(field => <option key={field.key} value={field.key}>{field.displayName}</option>)}</select></label>
        <small>Example: https://functions.miniup.app/hyperpbi-dynamic-demo/sensor?id={"{{context.site_id}}"}</small>
        <details><summary>Request, fallback and size</summary>
            <label>Timeout (ms)<input type="number" min="1000" max="15000" value={request.timeoutMs ?? 10000} onChange={event => patch({ timeoutMs: Number(event.currentTarget.value) })} /></label>
            <label>Cache TTL (seconds)<input type="number" min="0" max="3600" value={request.cacheTtlSeconds ?? 30} onChange={event => patch({ cacheTtlSeconds: Number(event.currentTarget.value) })} /></label>
            <DraftInput label="Fallback message" value={request.fallbackMessage ?? ""} onCommit={fallbackMessage => patch({ fallbackMessage })} />
            <label>Popup width (px)<input type="number" min="280" max="1000" value={popup.width ?? 520} onChange={event => onChange({ width: Number(event.currentTarget.value) })} /></label>
            <label>Maximum height (px)<input type="number" min="200" max="1000" value={popup.maxHeight ?? 560} onChange={event => onChange({ maxHeight: Number(event.currentTarget.value) })} /></label>
        </details>
    </fieldset>;
}
