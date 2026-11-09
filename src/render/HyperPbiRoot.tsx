import { useCallback, useEffect, useMemo, useReducer, useState } from "preact/hooks";
import { calculateAggregates } from "../data/aggregations";
import { normalizeMapBindings } from "../data/normalizeMapBindings";
import { filterRows } from "../data/filtering";
import { NormalizedData } from "../data/normalizeData";
import type { DataWorkspace } from "../data/dataWorkspace";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { sanitizeCss } from "../security/sanitizeCss";
import { RuntimeSettings } from "../runtime/runtimeSettings";
import { HyperPbiConfig, defaultConfig } from "../config/hyperpbiConfig";
import { resolveSchemaRuntimeSettings, themeVariables } from "../styles/tokens";
import { FieldDictionaryPanel } from "../components/system/FieldDictionaryPanel";
import { DashboardRenderer } from "./DashboardRenderer";
import { RenderContext, RenderContextValue } from "./RenderContext";
import { dashboardReducer, initialDashboardState } from "./stateStore";
import { calculateDerivedMetrics } from "../calculations/derivedMetrics";
import {
  ExternalSelectionFailureReason,
  ExternalSelectionResult,
  InteractionDetails,
} from "../powerbi/interactionDiagnostics";
import { ExternalFilterResult } from "../powerbi/externalFilters";
import { FilterOperator } from "../schema/hyperpbiSchema";
import {
  componentRows as selectedComponentRows,
  rowsForComponent,
} from "../interactions/componentInteraction";
import { executeUiAction, executeUiActions } from "../actions/uiActions";
import type { UiAction, UiActionResult } from "../actions/uiActionTypes";
import { resolveAppShell } from "../components/app/appShellResolver";
import { AppShell } from "../components/app/AppShell";
import { OverlayHost } from "../components/overlays/OverlayHost";
import { createOverlayRuntime } from "../components/overlays/overlayRuntime";
import { ToastHost } from "../components/overlays/ToastHost";
import type { ProviderAccessState } from "../providers/providerTypes";
import { prepareLogicalDatasets } from "../editor/prepareAuthoringData";
import type { MapViewportState } from "../components/maps/MapBlock";
import { componentListRequestsFill } from "../components/layout/responsiveLayout";
import { useRemoteDataWorkspace } from "../data/useRemoteDataWorkspace";
import { IsolatedVisual } from "../security/IsolatedVisual";
import { visitSpecificationComponents } from "../catalog/componentTraversal";
import { dynamicEventKey, type DynamicEvent } from "../fragments/fragmentTypes";

const notSent = (): ExternalSelectionResult => ({
  sent: false,
  reason: "component did not call selectExternal",
});
const filterNotSent = (): ExternalFilterResult => ({
  sent: false,
  reason: "component did not call selectExternal",
});
export function HyperPbiRoot({
  instanceId,
  schema,
  data,
  dataWorkspace,
  settings,
  renderMs,
  referenceWarnings = [],
  config = defaultConfig,
  selectExternal = notSent,
  clearExternal = notSent,
  applyExternalFilter = filterNotSent,
  clearExternalFilter = filterNotSent,
  reportInteraction = () => undefined,
  webAccessAvailable = false,
  providerAccess,
  ownerByRuntimeId,
  componentPathById,
  onMapViewportChange,
  mapCommands,
  remoteSourceHost = "web",
  executionMode = "dashboard",
}: {
  executionMode?: "dashboard" | "fragment";
  instanceId: string;
  schema: HyperPbiSchema;
  data: NormalizedData;
  dataWorkspace?: DataWorkspace;
  settings: RuntimeSettings;
  renderMs: number;
  referenceWarnings?: string[];
  config?: HyperPbiConfig;
  selectExternal?: (
    rowIndices: number[],
    multiSelect?: boolean,
    details?: InteractionDetails,
  ) => ExternalSelectionResult;
  clearExternal?: (details?: InteractionDetails) => ExternalSelectionResult;
  applyExternalFilter?: (
    field: string,
    operator: FilterOperator,
    value: unknown,
    details?: InteractionDetails,
  ) => ExternalFilterResult;
  clearExternalFilter?: (details?: InteractionDetails) => ExternalFilterResult;
  reportInteraction?: (
    details: InteractionDetails,
    reason?: ExternalSelectionFailureReason,
    rowIndices?: number[],
  ) => void;
  webAccessAvailable?: boolean;
  providerAccess?: ProviderAccessState;
  ownerByRuntimeId?: Readonly<Record<string, string>>;
  componentPathById?: Readonly<Record<string, string>>;
  mapCommands?: import("../maps/interactions/mapStudioCommands").MapCommandChannel;
  onMapViewportChange?: (mapId: string, viewport: MapViewportState) => void;
  remoteSourceHost?: "web" | "powerbi";
}) {
  const effectiveSettings = useMemo(
    () => resolveSchemaRuntimeSettings(schema.theme, settings),
    [schema.theme, settings],
  );
  const effectiveProviderAccess = providerAccess ?? {
    tiles: { allowed: webAccessAvailable },
    geocoder: { allowed: webAccessAvailable },
  };
  const [state, dispatch] = useReducer(
    dashboardReducer,
    initialDashboardState(schema.state?.search, schema.state?.activeTab),
  );
  const overlayRuntime = useMemo(() => executionMode === "dashboard" ? createOverlayRuntime(instanceId) : undefined, [instanceId, executionMode]);
  const { keys: dynamicEventKeys, defaults: dynamicDefaults } = useMemo(() => {
    const keys = new Set<string>();
    const defaults: Record<string, unknown> = {};
    if (executionMode === "dashboard") visitSpecificationComponents(schema, ({ component }) => {
      if (typeof component.id === "string" && component.defaultValue !== undefined) Object.defineProperty(defaults, component.id, { value: component.defaultValue, enumerable: true });
      if (component.type !== "dynamicContent") return;
      const trigger = (component as unknown as import("../schema/hyperpbiSchema").DynamicContentComponent).trigger;
      if (trigger) keys.add(dynamicEventKey(trigger.source, trigger.event));
    });
    return { keys, defaults };
  }, [schema, executionMode]);
  const dynamicState = useMemo(() => ({ ...dynamicDefaults, ...state.values }), [dynamicDefaults, state.values]);
  const [dynamicEvents, setDynamicEvents] = useState<Record<string, DynamicEvent>>({});
  const emitDynamicEvent = useCallback<NonNullable<RenderContextValue["emitDynamicEvent"]>>((source, event, values) => {
    const key = dynamicEventKey(source, event);
    if (!dynamicEventKeys.has(key)) return;
    setDynamicEvents(previous => ({ ...previous, [key]: { context: values, revision: (previous[key]?.revision ?? 0) + 1 } }));
  }, [dynamicEventKeys]);
  const remoteData = useRemoteDataWorkspace(schema, dataWorkspace, data, state.values, remoteSourceHost, providerAccess, webAccessAvailable);
  const rowKeySignature = useMemo(
    () => JSON.stringify(executionMode === "fragment" && dataWorkspace
      ? Object.values(dataWorkspace.sources).flatMap(source => source.data.rowKeys)
      : data.rowKeys),
    [data.rowKeys, dataWorkspace, executionMode],
  );
  useEffect(() => {
    dispatch({
      type: "reconcileRowKeys",
      rowKeys: JSON.parse(rowKeySignature),
    });
  }, [rowKeySignature]);
  const rows = useMemo(
    () => filterRows(data.rows, state.filters, state.search),
    [data.rows, state.filters, state.search],
  );
  const filteredRowKeys = useMemo(() => {
    const sourceIndexByRow = new Map(
      data.rows.map((row, index) => [row, index] as const),
    );

    return rows
      .map((row) => {
        const index = sourceIndexByRow.get(row);
        return index === undefined ? undefined : data.rowKeys[index];
      })
      .filter((key): key is string => Boolean(key));
  }, [data.rows, data.rowKeys, rows]);
  const filteredData = useMemo<NormalizedData>(
    () => ({
      ...data,
      rows,
      rowKeys: filteredRowKeys,
      aggregates: calculateAggregates(rows),
      calculatedMetrics: calculateDerivedMetrics(
        rows,
        schema.calculations?.metrics,
      ),
      map: normalizeMapBindings(
        rows,
        data.fields,
        config.bindings?.map,
        config.providers?.geocoder?.cacheEntries,
        filteredRowKeys,
      ),
    }),
    [
      data,
      rows,
      filteredRowKeys,
      schema.calculations?.metrics,
      config.bindings?.map,
      config.providers?.geocoder?.cacheEntries,
    ],
  );
  const datasetEvaluation = useMemo(() => {
    const sourceIndexByKey = new Map(
      data.rowKeys.map((key, index) => [key, index] as const),
    );
    return prepareLogicalDatasets(filteredData, schema, {
      sourceIndices: filteredRowKeys.map(
        (key) => sourceIndexByKey.get(key) ?? -1,
      ),
      sourceRowKeys: data.rowKeys,
    }, remoteData.workspace);
  }, [filteredData, schema, filteredRowKeys, data.rowKeys, remoteData.workspace]);
  const runtimeWarnings = useMemo(
    () =>
      Array.from(
        new Set([
          ...referenceWarnings,
          ...datasetEvaluation.errors.map((item) => item.message),
          ...Object.entries(remoteData.statuses).flatMap(([id, status]) =>
            status.status === "error" && status.error ? [`Remote source “${id}”: ${status.error}`] : []
          ),
        ]),
      ),
    [referenceWarnings, datasetEvaluation.errors, remoteData.statuses],
  );
  const scope = `#${instanceId}`;
  const cssMode = config.security?.cssMode ?? "scoped";
  const sanitizedCss = useMemo(
    () =>
      sanitizeCss(
        `${schema.styles?.globalCss ?? ""}\n${schema.css ?? ""}\n${settings.customCss}`,
        scope,
        { mode: cssMode },
      ),
    [schema.styles?.globalCss, schema.css, settings.customCss, scope, cssMode],
  );
  const getRowsForComponent = useCallback(
    (componentId: string) =>
      rowsForComponent(data.rows, data.rowKeys, rows, componentId, { state }),
    [data.rows, data.rowKeys, rows, state],
  );
  const componentRows = useCallback(
    (componentId: string) => selectedComponentRows(componentId, { state }),
    [state],
  );
  const getDatasetView = useCallback(
    (name = "powerbi", componentId?: string) => {
      const result = datasetEvaluation.datasets.get(name);
      if (!result) return undefined;
      const datasetRows = result.data.rows;
      const selectedRows = componentId
        ? rowsForComponent(
            datasetRows,
            result.data.rowKeys,
            datasetRows,
            componentId,
            {
              state,
              datasetLineage: result.lineage,
              powerBiSourceRowKeys: result.rootRowKeys ?? data.rowKeys,
            },
          )
        : datasetRows;
      const indexByRow = new Map(
        datasetRows.map((row, index) => [row, index] as const),
      );
      const rowIndices = selectedRows
        .map((row) => indexByRow.get(row) ?? -1)
        .filter((index) => index >= 0);
      return {
        name,
        sourceId: result.sourceId ?? "powerbi",
        rows: rowIndices.map((index) => datasetRows[index]),
        fields: result.data.fields,
        rowIndices,
        rowKeys: rowIndices.map(
          (index) => result.data.rowKeys[index] ?? `${name}:${index}`,
        ),
        sourceRowIndices: rowIndices.map((index) => [
          ...(result.lineage[index] ?? []),
        ]),
        sourceRowKeys: rowIndices.map((index) =>
          (result.lineage[index] ?? []).map(
            (sourceIndex) => (result.rootRowKeys ?? data.rowKeys)[sourceIndex] ?? String(sourceIndex),
          ),
        ),
        totalRows: datasetRows.length,
      };
    },
    [datasetEvaluation.datasets, state, data.rowKeys],
  );
  const isOverlayOpen = useCallback(
    (id: string) => state.openOverlays.includes(id),
    [state.openOverlays],
  );

  // Build a context object that executeUiAction can read from
  const execUiAction = useCallback(
    (action: UiAction | UiAction[], event?: Event): UiActionResult => {
      if (executionMode === "fragment" && (Array.isArray(action) ? action : [action]).some(item => !["setTab", "setState", "toggleState", "clearFilters", "setStep", "nextStep", "previousStep"].includes(item.type))) return { success: false, message: "This action is unavailable in remote fragments." };
      const ctx: RenderContextValue = {
        instanceId,
        executionMode,
        remoteSourceHost,
        data: filteredData,
        rows,
        sourceRows: data.rows,
        sourceRowKeys: data.rowKeys,
        powerBiSourceRows: data.rows,
        powerBiSourceRowKeys: data.rowKeys,
        interactionIndexSpace: "powerbi",
        getRowsForComponent,
        getDatasetView,
        componentRows,
        schema,
        settings: effectiveSettings,
        state,
        dispatch,
        warnings: sanitizedCss.warnings,
        selectExternal,
        selectSourceRows: selectExternal,
        clearExternal,
        applyExternalFilter,
        clearExternalFilter,
        reportInteraction,
        config,
        webAccessAvailable,
        providerAccess: effectiveProviderAccess,
        ownerByRuntimeId,
        componentPathById,
        datasets: datasetEvaluation.datasets,
        remoteSources: remoteData.statuses,
        dynamicEventKeys,
        emitDynamicEvent,
        onMapViewportChange,
  mapCommands,
        executeUiAction: null as any,
        isOverlayOpen: null as any,
        overlayRuntime,
      };
      return executeUiActions(action, ctx, event);
    },
    [
      instanceId,
      executionMode,
      remoteSourceHost,
      filteredData,
      rows,
      data.rows,
      data.rowKeys,
      getRowsForComponent,
      getDatasetView,
      componentRows,
      schema,
      effectiveSettings,
      state,
      dispatch,
      sanitizedCss.warnings,
      selectExternal,
      clearExternal,
      applyExternalFilter,
      clearExternalFilter,
      reportInteraction,
      config,
      webAccessAvailable,
      effectiveProviderAccess,
      ownerByRuntimeId,
      componentPathById,
      datasetEvaluation.datasets,
      remoteData.statuses,
      dynamicEventKeys,
      emitDynamicEvent,
      overlayRuntime,
      onMapViewportChange,
  mapCommands,
    ],
  );

  const context = useMemo(
    (): RenderContextValue => ({
      instanceId,
      executionMode,
      remoteSourceHost,
      data: filteredData,
      rows,
      sourceRows: data.rows,
      sourceRowKeys: data.rowKeys,
      powerBiSourceRows: data.rows,
      powerBiSourceRowKeys: data.rowKeys,
      interactionIndexSpace: "powerbi",
      getRowsForComponent,
      getDatasetView,
      componentRows,
      schema,
      settings: effectiveSettings,
      state,
      dispatch,
      warnings: sanitizedCss.warnings,
      selectExternal,
      selectSourceRows: selectExternal,
      clearExternal,
      applyExternalFilter,
      clearExternalFilter,
      reportInteraction,
      config,
      webAccessAvailable,
      providerAccess: effectiveProviderAccess,
      ownerByRuntimeId,
      componentPathById,
      datasets: datasetEvaluation.datasets,
      remoteSources: remoteData.statuses,
      dynamicEvents,
      dynamicState,
      dynamicEventKeys,
      emitDynamicEvent,
      onMapViewportChange,
  mapCommands,
      executeUiAction: execUiAction,
      isOverlayOpen,
      overlayRuntime,
    }),
    [
      instanceId,
      remoteSourceHost,
      executionMode,
      filteredData,
      rows,
      data.rows,
      data.rowKeys,
      getRowsForComponent,
      getDatasetView,
      componentRows,
      schema,
      effectiveSettings,
      state,
      sanitizedCss.warnings,
      selectExternal,
      clearExternal,
      applyExternalFilter,
      clearExternalFilter,
      reportInteraction,
      config,
      webAccessAvailable,
      effectiveProviderAccess,
      ownerByRuntimeId,
      componentPathById,
      execUiAction,
      isOverlayOpen,
      overlayRuntime,
      datasetEvaluation.datasets,
      remoteData.statuses,
      dynamicEvents,
      dynamicState,
      dynamicEventKeys,
      emitDynamicEvent,
      onMapViewportChange,
  mapCommands,
    ],
  );
  const style = themeVariables(schema.theme, effectiveSettings);
  const hasSidePanel = Boolean(schema.leftPanel?.length);
  const panelWidth =
    schema.layout?.leftPanel?.width ?? effectiveSettings.layout.leftPanelWidth;
  const sideCollapsible = schema.layout?.leftPanel?.collapsible === true;
  const collapsedState = state.collapsed.__leftPanel;
  const sideCollapsed =
    sideCollapsible &&
    (collapsedState === undefined
      ? schema.layout?.leftPanel?.defaultCollapsed === true
      : collapsedState);
  const resolvedApp = useMemo(
    () => resolveAppShell(schema, effectiveSettings, state),
    [schema, effectiveSettings, state],
  );
  const rootComponentsFill = componentListRequestsFill(schema.components);
  const hasRightPanel = Boolean(schema.rightPanel?.length);
  const rightPanelFill = componentListRequestsFill(schema.rightPanel ?? []);

  return (
    <IsolatedVisual enabled={cssMode === "trusted"}><div
      id={instanceId}
      class={`hyperpbi-root hp-density-${effectiveSettings.layout.density} hp-theme-${effectiveSettings.theme.mode} ${effectiveSettings.layout.internalScrolling ? "hp-scroll" : "hp-no-scroll"}`}
      style={style}
    >
      <style>{sanitizedCss.css}</style>
      <RenderContext.Provider value={context}>
        {resolvedApp.enabled ? (
          <>
            <AppShell
              app={resolvedApp}
              schema={schema}
              settings={effectiveSettings}
              state={state}
              dispatch={dispatch}
            >
              {schema.toolbar?.length ? (
                <div
                  class={`hp-toolbar ${settings.layout.stickyToolbar ? "hp-sticky" : ""}`}
                >
                  <DashboardRenderer components={schema.toolbar} />
                </div>
              ) : null}
              <div class={`hp-dashboard-layout ${hasRightPanel ? "hp-with-right-panel" : ""} ${rootComponentsFill ? "hp-layout-fill" : ""}`}>
                <div class={`hp-grid hp-dashboard-primary ${rootComponentsFill ? "hp-layout-fill" : ""}`}>
                  <DashboardRenderer components={schema.components} />
                </div>
                {hasRightPanel ? (
                  <aside class={`hp-right-panel ${rightPanelFill ? "hp-layout-fill" : ""}`} aria-label="Dashboard details">
                    <DashboardRenderer components={schema.rightPanel ?? []} />
                  </aside>
                ) : null}
              </div>
            </AppShell>
          </>
        ) : (
          <>
            {config.renderer?.showHeader === true && (
              <header class="hp-header">
                <div>
                  {schema.title && <h1>{schema.title}</h1>}
                  {config.renderer?.showRowCount === true && (
                    <span>
                      {rows.length.toLocaleString()} of{" "}
                      {data.rows.length.toLocaleString()} rows
                    </span>
                  )}
                </div>
              </header>
            )}
            {schema.toolbar?.length ? (
              <div
                class={`hp-toolbar ${settings.layout.stickyToolbar ? "hp-sticky" : ""}`}
              >
                <DashboardRenderer components={schema.toolbar} />
              </div>
            ) : null}
            {hasSidePanel && sideCollapsible && (
              <button
                type="button"
                class="hp-sidebar-toggle"
                onClick={() =>
                  dispatch({
                    type: "collapse",
                    id: "__leftPanel",
                    value: !sideCollapsed,
                  })
                }
              >
                {sideCollapsed ? "Show filters" : "Hide filters"}
              </button>
            )}
            <div
              class={`hp-shell ${hasSidePanel && !sideCollapsed ? "hp-with-sidebar" : ""}`}
              style={{ "--hp-panel-width": `${panelWidth}px` }}
            >
              {hasSidePanel && !sideCollapsed && (
                <aside class="hp-sidebar">
                  <DashboardRenderer components={schema.leftPanel ?? []} />
                </aside>
              )}
              <div class="hp-main">
                <div class={`hp-dashboard-layout ${hasRightPanel ? "hp-with-right-panel" : ""} ${rootComponentsFill ? "hp-layout-fill" : ""}`}>
                  <div class={`hp-grid hp-dashboard-primary ${rootComponentsFill ? "hp-layout-fill" : ""}`}>
                    <DashboardRenderer components={schema.components} />
                  </div>
                  {hasRightPanel ? (
                    <aside class={`hp-right-panel ${rightPanelFill ? "hp-layout-fill" : ""}`} aria-label="Dashboard details">
                      <DashboardRenderer components={schema.rightPanel ?? []} />
                    </aside>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}
        {executionMode === "dashboard" && <><OverlayHost /><ToastHost /></>}
        {settings.debug.showSchemaErrors && runtimeWarnings.length > 0 && (
          <details class="hp-reference-warning">
            <summary>{runtimeWarnings.length} schema field warning(s)</summary>
            <ul>
              {runtimeWarnings.map((warning) => (
                <li>{warning}</li>
              ))}
            </ul>
            <div>
              Valid field keys:{" "}
              {Object.keys(data.fields).join(", ") || "No fields are bound."}
            </div>
          </details>
        )}
        {settings.debug.showFieldDictionary && (
          <FieldDictionaryPanel data={filteredData} />
        )}
        {settings.debug.showDataSample && (
          <details class="hp-debug">
            <summary>Normalized data sample</summary>
            <pre>{JSON.stringify(filteredData.rows.slice(0, 10), null, 2)}</pre>
          </details>
        )}
        {settings.debug.showPerformance && (
          <div class="hp-performance">
            Render preparation: {renderMs.toFixed(1)} ms · Loaded{" "}
            {data.rows.length.toLocaleString()} rows
            {data.loadStatus?.moreRowsAvailable ? " · more available" : ""}
            {datasetEvaluation.diagnostics.map(
              (item) =>
                ` · ${item.name}: ${item.outputRowCount} rows/${item.evaluationMs.toFixed(1)}ms/${item.cacheStatus}`,
            )}
          </div>
        )}
        {config.security?.showSanitizerWarnings === true &&
          settings.showWarnings &&
          sanitizedCss.warnings.length > 0 && (
            <details class="hp-debug">
              <summary>
                CSS sanitizer warnings ({sanitizedCss.warnings.length})
              </summary>
              <ul>
                {sanitizedCss.warnings.map((warning) => (
                  <li>{warning}</li>
                ))}
              </ul>
            </details>
          )}
      </RenderContext.Provider>
    </div></IsolatedVisual>
  );
}
