import { useCallback, useMemo } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import {
  createDefaultGeoLibreProject,
} from "./projectBridge";
import { hydratePowerBiLayers, featureIdsForSourceRows } from "./powerBiBridge";
import { sanitizePersistedGeoLibreProject } from "./securityPolicy";
import { resolveGeoLibreRuntime } from "./securityPolicy";
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
  const availability = runtimeAccess && !runtimeAccess.allowed
    ? { state: "denied" as const, message: runtimeAccess.reason ?? "Power BI denied WebAccess to the GeoLibre runtime." }
    : context.providerAccess && !context.webAccessAvailable && !runtimeAccess
      ? { state: "checking" as const, message: "Waiting for the Power BI WebAccess capability check." }
      : undefined;

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
