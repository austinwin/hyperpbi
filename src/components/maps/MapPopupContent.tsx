import type { MapPopupContentBlock } from "../../maps/popup/mapPopupContent";
import { popupConditionMatches, popupContentTemplate, popupContentUrl } from "../../maps/popup/mapPopupContent";
import { featureAttribute } from "../../maps/attributes/mapFeatureAttributes";
import type { ResolvedMapFeature } from "../../maps/model/resolvedMapTypes";
import type { UiAction } from "../../schema/uiSchema";

export function MapPopupContent({ blocks, feature, executeAction, actionsEnabled = true }: { blocks: MapPopupContentBlock[]; feature: ResolvedMapFeature; executeAction: (action: UiAction | UiAction[], event?: Event) => void; actionsEnabled?: boolean }) {
    return <div class="hp-map-popup-content">{blocks.filter(block => popupConditionMatches(block.when, feature)).map(block => {
        const source = block.fieldSource ?? "service", text = (value: string | undefined) => popupContentTemplate(value ?? "", feature, source);
        const label = text(block.label), color = block.colorWhen && popupConditionMatches(block.colorWhen, feature) ? block.colorWhen.color : block.color;
        if (block.type === "section") return <section key={block.id} class="hp-map-popup-section"><h4>{label}</h4><MapPopupContent blocks={block.children ?? []} feature={feature} executeAction={executeAction} actionsEnabled={actionsEnabled} /></section>;
        if (block.type === "text") return <p key={block.id} style={{ color }}>{text(block.text)}</p>;
        if (block.type === "field") {
            const value = featureAttribute(feature, block.field ?? "", source);
            let formatted = value == null ? "—" : String(value);
            if (block.dateFormat && value != null) { const date = new Date(String(value)); if (!Number.isNaN(date.getTime())) formatted = block.dateFormat === "iso" ? date.toISOString().slice(0, 10) : date.toLocaleDateString(undefined, { dateStyle: block.dateFormat === "long" ? "long" : "short" }); }
            else if (value !== null && value !== "" && value !== undefined && Number.isFinite(Number(value))) formatted = Number(value).toLocaleString(undefined, { minimumFractionDigits: block.decimals ?? 0, maximumFractionDigits: block.decimals ?? 4 });
            return <dl key={block.id} class="hp-map-popup-value"><dt>{label || block.field}</dt><dd style={{ color }}>{formatted}{block.units && <small> {block.units}</small>}</dd></dl>;
        }
        if (block.type === "image") { const url = popupContentUrl(text(block.url)); return url ? <figure key={block.id}><img src={url} alt={label} loading="lazy" referrerPolicy="no-referrer" />{label && <figcaption>{label}</figcaption>}</figure> : <p class="hp-map-popup-unavailable">Image needs a public HTTPS URL.</p>; }
        if (block.type === "link") { const url = popupContentUrl(text(block.url)); return url ? <a key={block.id} href={url} target="_blank" rel="noopener noreferrer">{label || "Open link"} ↗</a> : <p class="hp-map-popup-unavailable">Link needs a public HTTPS URL.</p>; }
        if (block.type === "button") return <button key={block.id} type="button" disabled={!actionsEnabled} onClick={event => { event.stopPropagation(); if (block.uiAction) executeAction(block.uiAction, event); }}>{label || "Action"}</button>;
        const values = (block.series ?? []).map(item => ({ label: item.label ?? item.field, value: featureAttribute(feature, item.field, item.fieldSource ?? source) })).filter(item => item.value !== null && item.value !== "" && item.value !== undefined && Number.isFinite(Number(item.value)));
        const max = Math.max(1, ...values.map(item => Math.abs(Number(item.value))));
        return <section key={block.id} class="hp-map-popup-chart" aria-label={label || "Feature chart"}><strong>{label}</strong>{values.map(item => <div><span>{item.label}</span><meter min={0} max={max} value={Math.abs(Number(item.value))} style={{ accentColor: color ?? "#0f766e" }} /><small>{Number(item.value).toLocaleString()}</small></div>)}</section>;
    })}</div>;
}
