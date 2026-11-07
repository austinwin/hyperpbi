import { MapPopupContent } from "./MapPopupContent";
import { resolveMapPopupViewModel } from "./ResolvedMapPopup";
import type { ResolvedMapFeature, ResolvedMapPopup, ResolvedMapPopupAction } from "../../maps/model/resolvedMapTypes";
import type { UiAction } from "../../schema/uiSchema";

/** Shared built-in popup body for the map, authoring preview and tests. */
export function MapPopupDetails({ popup, feature, executeAction, executePopupAction, showActions = true, actionsEnabled = true }: { popup: ResolvedMapPopup; feature: ResolvedMapFeature; executeAction: (action: UiAction | UiAction[], event?: Event) => void; executePopupAction?: (action: ResolvedMapPopupAction, feature: ResolvedMapFeature, event: Event) => void; showActions?: boolean; actionsEnabled?: boolean }) {
    const view = resolveMapPopupViewModel(popup, feature);
    return <>
        <MapPopupContent blocks={popup.mode === "custom" ? popup.content ?? [] : []} feature={feature} executeAction={executeAction} actionsEnabled={actionsEnabled} />
        {view.html && <div class="hp-map-feature-details-html" dangerouslySetInnerHTML={{ __html: view.html }} />}
        {view.fields.length > 0 && <dl class="hp-map-feature-details-fields">{view.fields.map((field, index) => <div key={`${field.label}-${index}`}><dt>{field.label}</dt><dd>{field.display === "badge" ? <span class="hp-badge">{field.value}</span> : field.value}</dd></div>)}</dl>}
        {showActions && view.actions.length > 0 && <div class="hp-map-popup-actions">{view.actions.map(action => <button type="button" key={action.id} disabled={!actionsEnabled} onClick={event => { event.stopPropagation(); executePopupAction?.(action, feature, event); if (action.uiAction) executeAction(action.uiAction, event); }}>{action.label}</button>)}</div>}
    </>;
}
