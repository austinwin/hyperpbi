import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "preact/hooks";
import { lazyAggregates } from "../data/aggregations";
import { lazyMapBindings } from "../data/normalizeMapBindings";
import { createDashboardRowSelector } from "../data/filtering";
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
import { dashboardReducer, initialDashboardState, type DashboardAction, type DashboardState } from "./stateStore";
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
  createComponentRowRouter,
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
import { samplePreviewRows } from "../data/samplePreviewRows";
import { indexRows } from "../data/rowIndex";
import type { DatasetResult } from "../data/datasets";
import { DataLoadNotice } from "../components/system/DataLoadNotice";
import { RuntimePerformancePanel } from "../components/system/RuntimePerformancePanel";
import { RuntimeProfiler } from "./RuntimeProfiler";
import { dynamicEventKey, type DynamicEvent } from "../fragments/fragmentTypes";

// Keep callbacks that survive source refreshes out of the render's lexical
// scope. Otherwise they can retain its entire data snapshot and other memoized
// callbacks, which in turn retain their older snapshots.
function useDynamicEventEmitter(keys: Set<string>, setEvents: (update: (events: Record<string, DynamicEvent>) => Record<string, DynamicEvent>) => void) {
  return useCallback<NonNullable<RenderContextValue["emitDynamicEvent"]>>((source, event, values) => {
    const key = dynamicEventKey(source, event);
    if (!keys.has(key)) return;
    setEvents(previous => ({ ...previous, [key]: { context: values, revision: (previous[key]?.revision ?? 0) + 1 } }));
  }, [keys, setEvents]);
}

function useScopedRowLookup(route: ReturnType<typeof createComponentRowRouter>, filters: DashboardState["interactionFilters"]) {
  return useCallback((id: string) => route(id, filters), [route, filters]);
}

function useHighlightLookup(state: DashboardState) {
  const { componentSelectedRows, componentSelectionScopes, componentSelectionModes, componentSelectionTargets } = state;
  return useMemo(() => {
    const highlights = new Map<string, number[]>();
    return (componentId: string) => {
      const cached = highlights.get(componentId);
      if (cached) return cached;
      const selection = selectedComponentRows(componentId, { state });
      highlights.set(componentId, selection);
      return selection;
    };
  }, [componentSelectedRows, componentSelectionScopes, componentSelectionModes, componentSelectionTargets]);
}

function useOverlayLookup(openOverlays: DashboardState["openOverlays"]) {
  return useCallback((id: string) => openOverlays.includes(id), [openOverlays]);
}

const ignoreInteraction = () => undefined;
const notSent = (): ExternalSelectionResult => ({
  sent: false,
  reason: "component did not call selectExternal",
});
const filterNotSent = (): ExternalFilterResult => ({
  sent: false,
  reason: "component did not call selectExternal",
});
interface HyperPbiRootProps {
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
}

export function HyperPbiRoot(props: HyperPbiRootProps) {
  const { schema, data, config, remoteSourceHost, executionMode } = props;
  const [state, dispatch] = useReducer(
    dashboardReducer,
    initialDashboardState(schema.state?.search, schema.state?.activeTab),
  );
  // Keep report controls and selection state across native slicer refreshes,
  // while releasing the previous dataset and mounted dashboard resources.
  if (remoteSourceHost === "powerbi" && executionMode !== "fragment" && data.loadStatus?.completeness === "loading") {
    return <div class="hp-dashboard-loading" aria-busy={config?.renderer?.showDataLoadProgress === false || undefined}>
      <DataLoadNotice status={data.loadStatus} showProgress={config?.renderer?.showDataLoadProgress} />
    </div>;
  }
  return <EvaluatedDashboard {...props} state={state} dispatch={dispatch} />;
}

function EvaluatedDashboard({
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
  reportInteraction = ignoreInteraction,
  webAccessAvailable = false,
  providerAccess,
  ownerByRuntimeId,
  componentPathById,
  onMapViewportChange,
  mapCommands,
  remoteSourceHost = "web",
  executionMode = "dashboard",
  state,
  dispatch,
}: HyperPbiRootProps & { state: DashboardState; dispatch: (action: DashboardAction) => void }) {
  const profiling = executionMode === "dashboard" && (settings.debug.showPerformance || config.renderer?.profilePerformance === true);
  const profiler = useMemo(() => profiling ? new RuntimeProfiler() : undefined, [profiling]);
  useEffect(() => {
    profiler?.start();
    return () => profiler?.dispose();
  }, [profiler]);
  const totalComponents = useMemo(() => {
    let total = 0;
    if (profiling) visitSpecificationComponents(schema, () => { total++; });
    return total;
  }, [schema, profiling]);
  const effectiveSettings = useMemo(
    () => resolveSchemaRuntimeSettings(schema.theme, settings),
    [schema.theme, settings],
  );
  const effectiveProviderAccess = useMemo(() => providerAccess ?? {
    tiles: { allowed: webAccessAvailable },
    geocoder: { allowed: webAccessAvailable },
  }, [providerAccess, webAccessAvailable]);
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
  const emitDynamicEvent = useDynamicEventEmitter(dynamicEventKeys, setDynamicEvents);
  const remoteData = useRemoteDataWorkspace(schema, dataWorkspace, data, state.values, remoteSourceHost, providerAccess, webAccessAvailable);
  const renderStarted = performance.now();
  useLayoutEffect(() => data.performance?.record("render", renderStarted));

  const reconciliationKeys = useMemo(
    () => executionMode === "fragment" && dataWorkspace
      ? Object.values(dataWorkspace.sources).flatMap(source => source.data.rowKeys)
      : data.rowKeys,
    [data.rowKeys, dataWorkspace, executionMode],
  );
  const loading = data.loadStatus?.completeness === "loading";
  useEffect(() => {
    if (!loading) dispatch({ type: "reconcileRowKeys", rowKeys: reconciliationKeys });
  }, [reconciliationKeys, loading]);

  const selectDashboardRows = useMemo(() => createDashboardRowSelector(data.rows, Object.keys(data.fields)), [data.rows, data.fields]);
  const { rows, sourceIndices } = useMemo(() => {
    const started = performance.now();
    const result = selectDashboardRows(state.filters, state.search);
    data.performance?.record("filtering", started);
    return result;
  }, [selectDashboardRows, state.filters, state.search]);
  const filteredRowKeys = useMemo(
    () => sourceIndices ? sourceIndices.map(index => data.rowKeys[index]) : data.rowKeys,
    [data.rowKeys, sourceIndices],
  );
  const filteredData = useMemo<NormalizedData>(() => {
    const started = performance.now();
    const metrics = schema.calculations?.metrics;
    const calculatedMetrics = rows === data.rows && data.calculatedMetrics
      ? data.calculatedMetrics
      : metrics?.length ? calculateDerivedMetrics(rows, metrics) : undefined;
    if (metrics?.length && calculatedMetrics !== data.calculatedMetrics) data.performance?.record("calculations", started);
    return {
      ...data, rows, rowKeys: filteredRowKeys, calculatedMetrics,
      aggregates: rows === data.rows ? data.aggregates : lazyAggregates(rows),
      map: rows === data.rows ? data.map : lazyMapBindings(rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries, filteredRowKeys),
    };
  }, [
    data.rows, data.fields, data.aggregates, data.calculatedMetrics, data.map, rows, filteredRowKeys,
    schema.calculations?.metrics, config.bindings?.map, config.providers?.geocoder?.cacheEntries,
  ]);
  const getCalculatedMetrics = useMemo(() => {
    const configured = schema.calculations?.metrics;
    const memo = new WeakMap<NormalizedData["rows"], NonNullable<NormalizedData["calculatedMetrics"]>>();
    return (input: NormalizedData["rows"]) => {
      if (input === rows) return filteredData.calculatedMetrics;
      if (input === data.rows && data.calculatedMetrics) return data.calculatedMetrics;
      if (!configured?.length) return undefined;
      let result = memo.get(input);
      if (!result) {
        const started = performance.now();
        result = calculateDerivedMetrics(input, configured);
        memo.set(input, result);
        data.performance?.record("calculations", started);
      }
      return result;
    };
  }, [rows, filteredData.calculatedMetrics, data.rows, data.calculatedMetrics, data.performance, schema.calculations?.metrics]);
  const datasetCache = useRef(new Map<string, DatasetResult>());
  const datasetEvaluation = useMemo(() => prepareLogicalDatasets(filteredData, schema, {
    sourceIndices,
    sourceRowKeys: data.rowKeys,
    hostData: data,
  }, remoteData.workspace, datasetCache.current, true), [
    filteredData, schema.data, sourceIndices, data, remoteData.workspace,
  ]);
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
  const routeRows = useMemo(() => createComponentRowRouter(data.rows, data.rowKeys, rows), [data.rows, data.rowKeys, rows]);
  const getRowsForComponent = useScopedRowLookup(routeRows, state.interactionFilters);
  const componentRows = useHighlightLookup(state);
  const datasetRouters = useMemo(() => new WeakMap<DatasetResult, ReturnType<typeof createComponentRowRouter>>(), [datasetEvaluation.datasets]);
  const getDatasetView = useMemo(() => {
    const views = new Map<string, ReturnType<NonNullable<RenderContextValue["getDatasetView"]>>>();
    return (name = "powerbi", componentId?: string) => {
      const cacheKey = JSON.stringify([name, componentId]);
      if (views.has(cacheKey)) return views.get(cacheKey);
      const result = datasetEvaluation.datasets.get(name);
      if (!result) return undefined;
      const datasetRows = result.data.rows;
      const rootKeys = result.rootRowKeys ?? data.rowKeys;
      let selectedRows = datasetRows;
      if (componentId && state.interactionFilters.length) {
        let routeDataset = datasetRouters.get(result);
        if (!routeDataset) {
          routeDataset = createComponentRowRouter(datasetRows, result.data.rowKeys, datasetRows, result.lineage, rootKeys);
          datasetRouters.set(result, routeDataset);
        }
        selectedRows = routeDataset(componentId, state.interactionFilters);
      }
      const indices = selectedRows === datasetRows ? undefined : indexRows(datasetRows);
      let rowIndices: number[] | undefined;
      let rowKeys: string[] | undefined;
      let sourceIndices: number[][] | undefined;
      let sourceKeys: string[][] | undefined;
      const rowIndexAt = (index: number) => indices?.get(selectedRows[index]) ?? index;
      const sourceRowIndicesAt = (index: number) => {
        const position = rowIndexAt(index);
        return result.lineageAt?.(position) ?? result.lineage[position] ?? [];
      };
      const sourceRowKeysAt = (index: number) => sourceRowIndicesAt(index).map(source => rootKeys[source] ?? String(source));
      const view = {
        rowIndexAt, sourceRowIndicesAt, sourceRowKeysAt,
        name, sourceId: result.sourceId ?? "powerbi", rows: selectedRows, fields: result.data.fields,
        get rowIndices() { return rowIndices ??= selectedRows.map((row, index) => indices?.get(row) ?? index); },
        get rowKeys() {
          return rowKeys ??= indices ? this.rowIndices.map(index => result.data.rowKeys[index] ?? `${name}:${index}`) : result.data.rowKeys;
        },
        get sourceRowIndices() {
          return sourceIndices ??= indices
            ? this.rowIndices.map(index => result.lineageAt?.(index) ?? result.lineage[index] ?? [])
            : result.lineage;
        },
        get sourceRowKeys() {
          return sourceKeys ??= this.sourceRowIndices.map(lineage => lineage.map(index => rootKeys[index] ?? String(index)));
        },
        totalRows: datasetRows.length,
      };
      views.set(cacheKey, view);
      return view;
    };
  }, [datasetEvaluation.datasets, datasetRouters, state.interactionFilters, data.rowKeys]);
  const isOverlayOpen = useOverlayLookup(state.openOverlays);

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
        getCalculatedMetrics,
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
      getCalculatedMetrics,
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
      profiler,
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
      getCalculatedMetrics,
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
      profiler,
      remoteSourceHost,
      executionMode,
      filteredData,
      rows,
      data.rows,
      data.rowKeys,
      getRowsForComponent,
      getCalculatedMetrics,
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
      <DataLoadNotice status={data.loadStatus} showProgress={config.renderer?.showDataLoadProgress} />
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
            <pre>{JSON.stringify(samplePreviewRows(filteredData, 10), null, 2)}</pre>
          </details>
        )}
        {profiling && (
          <RuntimePerformancePanel data={data} filteredCount={rows.length} renderMs={renderMs} datasets={datasetEvaluation.diagnostics} profiler={profiler} totalComponents={totalComponents} />
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
