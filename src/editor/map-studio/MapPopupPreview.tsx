import { MapPopupContent } from "../../components/maps/MapPopupContent";
import { resolveMapPopupViewModel } from "../../components/maps/ResolvedMapPopup";
import type { ResolvedMapFeature } from "../../maps/model/resolvedMapTypes";
import type { MapLayerDefinition } from "../../schema/mapSchema";

export function MapPopupPreview({ layer, feature }: { layer: MapLayerDefinition; feature?: ResolvedMapFeature }) {
  const popup = layer.popup;
  const view = feature && popup ? resolveMapPopupViewModel({ ...popup, enabled: popup.enabled !== false, fields: (popup.fields ?? []).map(field => ({ ...field, display: field.display ?? "text", fieldSource: field.fieldSource ?? popup.defaultFieldSource ?? (layer.source.type === "powerbi" ? "powerbi" : "service") })), actions: popup.actions ?? [] }, feature) : undefined;
  return <details class="hp-map-popup-preview" open><summary>Live feature preview</summary>
    {!feature ? <p>Click a feature on this layer to preview its actual values. Close the drawer to reach features underneath it.</p> : <div aria-label="Popup preview">
      {popup?.enabled === false && <small>Popup is disabled for this layer.</small>}
      <strong>{view?.title || layer.name}</strong>
      {view?.html && <div dangerouslySetInnerHTML={{ __html: view.html }} />}
      <MapPopupContent blocks={popup?.content ?? []} feature={feature} executeAction={() => undefined} actionsEnabled={false} />
      {view?.fields.map((field, index) => <dl key={index}><dt>{field.label}</dt><dd>{field.value}</dd></dl>)}
      {popup?.actions?.map(action => <button key={action.id} type="button" disabled>{action.label}</button>)}
      <small>Selected feature · {feature.id}. Actions are inactive in this preview.</small>
    </div>}
  </details>;
}
