import { RemoteFragmentHost } from "../../fragments/RemoteFragmentHost";
import { boundedFragmentNumber } from "../../fragments/remoteFragmentRequest";
import { mapFeatureDynamicContext, mergedFeatureAttributes, formatFeatureValue } from "../../maps/model/mapFeatureValue";
import { MapPopupDetails } from "./MapPopupDetails";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import type { MapComponent } from "../../schema/hyperpbiSchema";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";
import type { MapInteractionState } from "../../maps/interactions/mapInteractionState";
import { resolveMapPopupViewModel } from "./ResolvedMapPopup";
import type { UiAction } from "../../schema/uiSchema";
import type { ResolvedMapPopup } from "../../maps/model/resolvedMapTypes";
import type { DynamicIdentifyChoice } from "./runtime/dynamicIdentifyRuntime";
import { mapFeatureDisplayValue } from "../../maps/model/mapFeatureValue";

export function MapFeatureDetails({
  mapId,
  component,
  layers,
  interaction,
  onClose,
  executeAction,
  identifyChoices = [],
  onIdentifyChoice,
}: {
  mapId: string;
  component: MapComponent;
  layers: readonly ResolvedMapLayer[];
  interaction?: MapInteractionState;
  onClose: () => void;
  executeAction: (action: UiAction | UiAction[], event?: Event) => void;
  identifyChoices?: readonly DynamicIdentifyChoice[];
  onIdentifyChoice?: (featureKey: string) => void;
}) {
  const active = interaction?.activeFeature;
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const mode = component.featureDetails?.mode ?? "auto";
  const anchor = active?.anchor;
  const [anchoredPosition, setAnchoredPosition] = useState<
    { left: string; top: string } | undefined
  >();
  const resolved = useMemo(() => {
    if (!active) return undefined;
    const layer = layers.find((candidate) => candidate.id === active.layerId);
    const feature = layer?.features.find(
      (candidate) => candidate.featureKey === active.featureKey,
    );
    if (
      !layer ||
      !feature ||
      layer.capabilities?.popup === false ||
      layer.popup?.mode === "none"
    )
      return undefined;
    const popup: ResolvedMapPopup = layer.popup ?? {
      mode: "default",
      fields: [],
      actions: [],
    };
    return { layer, feature, view: resolveMapPopupViewModel(popup, feature) };
  }, [active, layers]);

  useEffect(() => {
    if (!resolved) return;
    panelRef.current?.focus({ preventScroll: true });
  }, [active?.featureKey]);

  useEffect(() => {
    if (!resolved) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      const root = panel?.getRootNode() as Document | ShadowRoot | undefined;
      if (event.key !== "Escape" || event.defaultPrevented || !panel) return;
      const active = root?.activeElement;
      const viewer = panel.closest(".hyperpbi-root");
      if (viewer && !viewer.contains(active ?? null)) return;
      const frame = panel.closest(".hp-map-frame");
      const activeMap = active?.closest(".hp-map-frame");
      const activeOverlay = active?.closest(".hp-overlay-host");
      if (activeMap && activeMap !== frame || activeOverlay && !activeOverlay.contains(panel)) return;
      if (frame?.querySelector(".hp-map-toolbar-popover")) return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [resolved, onClose]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const frame = panel?.closest<HTMLElement>(".hp-map-frame");
    if (
      !panel ||
      !frame ||
      mode === "panel" ||
      anchor?.containerX === undefined ||
      anchor.containerY === undefined
    ) {
      setAnchoredPosition(undefined);
      return;
    }
    const anchorX = anchor.containerX;
    const anchorY = anchor.containerY;
    const update = () => {
      const gap = 12;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      let left = anchorX + 14;
      if (left + width > frame.clientWidth - gap)
        left = anchorX - width - 14;
      let top = anchorY - height - 14;
      if (top < gap) top = anchorY + 14;
      left = Math.max(gap, Math.min(left, frame.clientWidth - width - gap));
      top = Math.max(gap, Math.min(top, frame.clientHeight - height - gap));
      const next = { left: `${left}px`, top: `${top}px` };
      setAnchoredPosition((previous) =>
        previous?.left === next.left && previous.top === next.top
          ? previous
          : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [anchor?.containerX, anchor?.containerY, mode, resolved]);

  if (!resolved) return null;
  const { layer, feature, view } = resolved;
  const selectedCount = interaction?.selectedFeatureKeys.length ?? 0;
  const isIdentify = active?.kind === "identify";
  return (
    <aside
      ref={panelRef}
      class={`hp-map-feature-details is-${mode} ${minimized ? "is-minimized" : ""} ${expanded ? "is-expanded" : ""} ${layer.popup?.mode === "dynamic" ? "has-remote-fragment" : ""}`}
      style={{ ...(!expanded ? anchoredPosition : {}), ...(layer.popup?.mode === "dynamic" && !expanded ? { width: `${boundedFragmentNumber(layer.popup.width, 520, 280, 1000)}px`, maxHeight: `${boundedFragmentNumber(layer.popup.maxHeight, 560, 200, 1000)}px` } : {}) }}
      onWheel={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()} onDblClick={event => event.stopPropagation()}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${mapId}-feature-details-title`}
      tabIndex={-1}
      data-feature-key={feature.featureKey}
    >
      <header class="hp-map-feature-details-header">
        <div>
          <small>{layer.name}</small>
          <h3 id={`${mapId}-feature-details-title`}>
            {view.title ?? mapFeatureDisplayValue(feature) ?? "Feature details"}
          </h3>
          {isIdentify && (
            <span class="hp-map-identify-badge">Temporary identify result</span>
          )}
          {!isIdentify && selectedCount > 1 && (
            <span>{selectedCount.toLocaleString()} features selected</span>
          )}
        </div>
        {layer.popup?.mode === "dynamic" && <button type="button" aria-label={expanded ? "Restore popup size" : "Expand popup"} onClick={() => setExpanded(value => !value)}>{expanded ? "↙" : "↗"}</button>}
        <button type="button" aria-label={minimized ? "Expand feature details" : "Minimize feature details"} onClick={() => setMinimized(!minimized)}>{minimized ? "+" : "−"}</button>
        <button type="button" aria-label="Close feature details" onClick={onClose}>
          ×
        </button>
      </header>
      {isIdentify && identifyChoices.length > 1 && (
        <label class="hp-map-identify-picker">
          <span>Matching feature</span>
          <select
            aria-label="Matching identify result"
            value={active.featureKey}
            onChange={(event) => onIdentifyChoice?.(event.currentTarget.value)}
          >
            {identifyChoices.map((choice) => (
              <option key={choice.featureKey} value={choice.featureKey}>
                {choice.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div class="hp-map-feature-details-body">
        {layer.popup?.mode === "dynamic" && layer.popup.request && <RemoteFragmentHost request={layer.popup.request} values={mapFeatureDynamicContext(feature)} fallback={<dl class="hp-map-feature-details-fields">{Object.entries(mergedFeatureAttributes(feature)).slice(0, 50).map(([field, value]) => <div><dt>{field}</dt><dd>{formatFeatureValue(value)}</dd></div>)}</dl>} />}
        <MapPopupDetails popup={layer.popup ?? { mode: "default", fields: [], actions: [] }} feature={feature} executeAction={executeAction} showActions={false} />
      </div>
      {view.actions.length > 0 && (
        <footer class="hp-map-feature-details-actions">
          {view.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              data-icon={action.icon}
              onClick={(event) => {
                event.stopPropagation();
                if (action.uiAction) executeAction(action.uiAction, event);
              }}
            >
              {action.label}
            </button>
          ))}
        </footer>
      )}
    </aside>
  );
}
