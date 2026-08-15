import { useCallback, useMemo } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import { MapBlock } from "../maps/MapBlock";
import {
  createDefaultGeoLibreProject,
} from "./projectBridge";
import { hydratePowerBiLayers, featureIdsForSourceRows } from "./powerBiBridge";
import {
  createGeoLibrePowerBiCompatMap,
  isPowerBiVisualSandbox,
} from "./powerBiCompat";
import { sanitizePersistedGeoLibreProject } from "./securityPolicy";
import {
  GEOLIBRE_OFFICIAL_RUNTIME_ORIGIN,
  resolveGeoLibreRuntime,
} from "./securityPolicy";
import { commitGeoLibreSelection } from "./selectionBridge";
import type {
  GeoLibreComponent,
  GeoLibreSelectionEvent,
  PersistedGeoLibreProject,
} from "./types";
import { GeoLibreWorkspaceHost } from "./GeoLibreWorkspaceHost";

export function GeoLibreBlock({ component }: { component: GeoLibreComponent }) {
  const context = useRenderContext();
  const persistedProject = useMemo<PersistedGeoLibreProject>(
    () =>
      component.project
        ? sanitizePersistedGeoLibreProject(component.project)
        : createDefaultGeoLibreProject(component.title ?? "HyperPBI GeoLibre workspace"),
    [component.project, component.title],
  );
  const bridge = useMemo(
    () =>
      hydratePowerBiLayers(
        component,
        persistedProject.document,
        context.getDatasetView,
      ),
    [component, persistedProject, context.getDatasetView],
  );
  const powerBiCompatMap = useMemo(
    () => createGeoLibrePowerBiCompatMap(component, bridge.document),
    [component, bridge.document],
  );
  const resetProject = useMemo(
    () => createDefaultGeoLibreProject(component.title ?? "HyperPBI GeoLibre workspace"),
    [component.title],
  );
  const resetBridge = useMemo(
    () =>
      hydratePowerBiLayers(component, resetProject.document, context.getDatasetView),
    [component, resetProject, context.getDatasetView],
  );
  const selectedSourceRows = context.state.selectedRows;
  const highlightedFeatures = useMemo(
    () =>
      component.powerBi?.selection?.externalHighlight === false
        ? new Map<string, string[]>()
        : featureIdsForSourceRows(bridge, selectedSourceRows),
    [bridge, selectedSourceRows, component.powerBi?.selection?.externalHighlight],
  );
  const onSelection = useCallback(
    (event: GeoLibreSelectionEvent) => {
      commitGeoLibreSelection(component, event, bridge, context);
    },
    [component, bridge, context],
  );
  const onProjectChange = context.onGeoLibreProjectChange
    ? (project: PersistedGeoLibreProject) =>
        context.onGeoLibreProjectChange?.(component.id ?? "geolibre", project)
    : undefined;
  const runtime = resolveGeoLibreRuntime(component);
  const runtimeAccess = context.providerAccess?.services?.[runtime.origin];
  const fallbackAccess = runtime.channel === "managed"
    ? context.providerAccess?.services?.[GEOLIBRE_OFFICIAL_RUNTIME_ORIGIN]
    : undefined;
  const runtimeDeniedWithoutFallback = runtimeAccess && !runtimeAccess.allowed && !fallbackAccess?.allowed;
  const availability = runtimeDeniedWithoutFallback
    ? { state: "denied" as const, message: runtimeAccess.reason ?? "Power BI denied WebAccess to the GeoLibre runtime." }
    : context.providerAccess && !context.webAccessAvailable && !runtimeAccess && !fallbackAccess
      ? { state: "checking" as const, message: "Waiting for the Power BI WebAccess capability check." }
      : undefined;

  // A Power BI custom visual is already hosted in a low-privilege sandboxed
  // iframe. A second remote iframe is blocked by the host's sandbox/CSP in
  // Desktop and Service, so waiting for a GeoLibre postMessage handshake can
  // never become a stable Power BI architecture. Use HyperPBI's bundled map
  // runtime for Power BI while preserving the full native GeoLibre workspace in
  // browser/Playground hosts.
  if (isPowerBiVisualSandbox()) {
    return <MapBlock component={powerBiCompatMap} />;
  }

  return (
    <GeoLibreWorkspaceHost
      component={component}
      persistedProject={persistedProject}
      document={bridge.document}
      dataSignature={bridge.signature}
      highlightedFeatures={highlightedFeatures}
      resetProject={resetProject}
      resetDocument={resetBridge.document}
      warnings={bridge.warnings}
      availability={availability}
      onProjectChange={onProjectChange}
      onSelection={onSelection}
    />
  );
}
