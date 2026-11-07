import { RemoteFragmentHost, type FragmentEnvironment } from "../../fragments/RemoteFragmentHost";
import { MapPopupDetails } from "../../components/maps/MapPopupDetails";
import { resolveMapPopupViewModel } from "../../components/maps/ResolvedMapPopup";
import type { ResolvedMapFeature } from "../../maps/model/resolvedMapTypes";
import type { MapLayerDefinition } from "../../schema/mapSchema";

export function MapPopupPreview({ layer, feature, environment }: { layer: MapLayerDefinition; feature?: ResolvedMapFeature; environment?: FragmentEnvironment }) {
  const popup = layer.popup;
  const resolved = popup ? { ...popup, fields: (popup.fields ?? []).map(field => ({ ...field, display: field.display ?? "text", fieldSource: field.fieldSource ?? popup.defaultFieldSource ?? (layer.source.type === "powerbi" ? "powerbi" : "service") })), actions: popup.actions ?? [] } : undefined;
  const view = feature && resolved ? resolveMapPopupViewModel(resolved, feature) : undefined;
  return <details class="hp-map-popup-preview" open><summary>Live feature preview</summary>
    {!feature ? <p>Click a feature on this layer to preview its actual values. Close the drawer to reach features underneath it.</p> : <div aria-label="Popup preview">
      {popup?.mode === "none" && <small>Popup is disabled for this layer.</small>}
      <strong>{view?.title || layer.name}</strong>
      {popup?.mode === "remote" && popup.remote && <RemoteFragmentHost environment={environment} request={popup.remote} feature={feature} />}
      {resolved && <MapPopupDetails popup={resolved} feature={feature} executeAction={() => undefined} actionsEnabled={false} />}
      <small>Selected feature · {feature.id}. Actions are inactive in this preview.</small>
    </div>}
  </details>;
}
