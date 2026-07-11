import { useCallback, useEffect, useMemo, useReducer } from "preact/hooks";
import { calculateAggregates } from "../data/aggregations";
import { normalizeMapBindings } from "../data/normalizeMapBindings";
import { filterRows } from "../data/filtering";
import { NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { sanitizeCss } from "../security/sanitizeCss";
import { RuntimeSettings } from "../settings";
import { HyperPbiConfig, defaultConfig } from "../config/hyperpbiConfig";
import { themeVariables } from "../styles/tokens";
import { FieldDictionaryPanel } from "../components/system/FieldDictionaryPanel";
import { DashboardRenderer } from "./DashboardRenderer";
import { RenderContext, RenderContextValue } from "./RenderContext";
import { dashboardReducer, initialDashboardState } from "./stateStore";
import { calculateDerivedMetrics } from "../calculations/derivedMetrics";
import { ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails } from "../powerbi/interactionDiagnostics";
import { ExternalFilterResult } from "../powerbi/externalFilters";
import { FilterOperator } from "../schema/hyperpbiSchema";
import { componentRows as selectedComponentRows, rowsForComponent } from "../interactions/componentInteraction";
import { executeUiAction, executeUiActions } from "../actions/uiActions";
import type { UiAction, UiActionResult } from "../actions/uiActionTypes";
import { resolveAppShell } from "../components/app/appShellResolver";
import { AppShell } from "../components/app/AppShell";
import { OverlayHost } from "../components/overlays/OverlayHost";
import { ToastHost } from "../components/overlays/ToastHost";
import { evaluateDatasets } from "../data/datasets";

const notSent = (): ExternalSelectionResult => ({ sent: false, reason: "component did not call selectExternal" });
const filterNotSent = (): ExternalFilterResult => ({ sent:false, reason:"component did not call selectExternal" });
export function HyperPbiRoot({ instanceId, schema, data, settings, renderMs, referenceWarnings = [], config = defaultConfig, selectExternal = notSent, clearExternal = notSent, applyExternalFilter = filterNotSent, clearExternalFilter = filterNotSent, reportInteraction = () => undefined, webAccessAvailable = false }: { instanceId: string; schema: HyperPbiSchema; data: NormalizedData; settings: RuntimeSettings; renderMs: number; referenceWarnings?: string[]; config?: HyperPbiConfig; selectExternal?: (rowIndices: number[], multiSelect?: boolean, details?: InteractionDetails) => ExternalSelectionResult; clearExternal?: (details?: InteractionDetails) => ExternalSelectionResult; applyExternalFilter?:(field:string,operator:FilterOperator,value:unknown,details?:InteractionDetails)=>ExternalFilterResult;clearExternalFilter?:(details?:InteractionDetails)=>ExternalFilterResult; reportInteraction?: (details: InteractionDetails, reason?: ExternalSelectionFailureReason, rowIndices?: number[]) => void; webAccessAvailable?: boolean }) {
    const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState(schema.state?.search, schema.state?.activeTab));
    const rowKeySignature = useMemo(
        () => JSON.stringify(data.rowKeys),
        [data.rowKeys]
    );
    useEffect(() => {
        dispatch({
            type: "reconcileRowKeys",
            rowKeys: data.rowKeys
        });
    }, [rowKeySignature]);
    const rows = useMemo(() => filterRows(data.rows, state.filters, state.search), [data.rows, state.filters, state.search]);
    const filteredRowKeys = useMemo(() => {
        const sourceIndexByRow = new Map(
            data.rows.map((row, index) => [row, index] as const)
        );

        return rows
            .map(row => {
                const index = sourceIndexByRow.get(row);
                return index === undefined
                    ? undefined
                    : data.rowKeys[index];
            })
            .filter((key): key is string => Boolean(key));
    }, [data.rows, data.rowKeys, rows]);
    const filteredData = useMemo<NormalizedData>(() => ({ ...data, rows, rowKeys: filteredRowKeys, aggregates: calculateAggregates(rows), calculatedMetrics: calculateDerivedMetrics(rows, schema.calculations?.metrics), map: normalizeMapBindings(rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries, filteredRowKeys) }), [data, rows, filteredRowKeys, schema.calculations?.metrics, config.bindings?.map, config.providers?.geocoder?.cacheEntries]);
    const datasetEvaluation=useMemo(()=>{const sourceIndexByKey=new Map(data.rowKeys.map((key,index)=>[key,index] as const));return evaluateDatasets(filteredData,schema.data?.datasets??{},new Map(),{sourceIndices:filteredRowKeys.map(key=>sourceIndexByKey.get(key)??-1),sourceRowKeys:data.rowKeys});},[filteredData,schema.data?.datasets,filteredRowKeys,data.rowKeys]);
    const scope = `#${instanceId}`; const cssMode = config.security?.cssMode ?? "scoped"; const sanitizedCss = useMemo(() => sanitizeCss(`${schema.styles?.globalCss ?? ""}\n${schema.css ?? ""}\n${settings.customCss}`, scope, { mode: cssMode }), [schema.styles?.globalCss, schema.css, settings.customCss, scope, cssMode]);
    const getRowsForComponent = useCallback((componentId:string) => rowsForComponent(data.rows, data.rowKeys, rows, componentId, { state }), [data.rows, data.rowKeys, rows, state]);
    const componentRows = useCallback((componentId:string) => selectedComponentRows(componentId, { state }), [state]);
    const isOverlayOpen = useCallback((id: string) => state.openOverlays.includes(id), [state.openOverlays]);

    // Build a context object that executeUiAction can read from
    const execUiAction = useCallback((action: UiAction | UiAction[], event?: Event): UiActionResult => {
        const ctx: RenderContextValue = {
            data: filteredData, rows, sourceRows: data.rows, sourceRowKeys: data.rowKeys,
            getRowsForComponent, componentRows, schema, settings, state, dispatch,
            warnings: sanitizedCss.warnings,
            selectExternal, clearExternal, applyExternalFilter, clearExternalFilter, reportInteraction,
            config, webAccessAvailable, datasets:datasetEvaluation.datasets,
            executeUiAction: (null as any), isOverlayOpen: (null as any),
        };
        return executeUiActions(action, ctx, event);
    }, [filteredData, rows, data.rows, data.rowKeys, getRowsForComponent, componentRows, schema, settings, state, dispatch, sanitizedCss.warnings, selectExternal, clearExternal, applyExternalFilter, clearExternalFilter, reportInteraction, config, webAccessAvailable]);

    const context = useMemo((): RenderContextValue => ({
        data: filteredData, rows, sourceRows: data.rows, sourceRowKeys: data.rowKeys,
        getRowsForComponent, componentRows, schema, settings, state, dispatch,
        warnings: sanitizedCss.warnings,
        selectExternal, clearExternal, applyExternalFilter, clearExternalFilter, reportInteraction,
        config, webAccessAvailable, datasets:datasetEvaluation.datasets,
        executeUiAction: execUiAction,
        isOverlayOpen,
    }), [filteredData, rows, data.rows, data.rowKeys, getRowsForComponent, componentRows, schema, settings, state, sanitizedCss.warnings, selectExternal, clearExternal, applyExternalFilter,clearExternalFilter,reportInteraction, config, webAccessAvailable, execUiAction, isOverlayOpen,datasetEvaluation.datasets]);
    const style = themeVariables(schema.theme, settings);
    const hasSidePanel = Boolean(schema.leftPanel?.length); const panelWidth = schema.layout?.leftPanel?.width ?? settings.layout.leftPanelWidth; const sideCollapsible = schema.layout?.leftPanel?.collapsible === true; const collapsedState = state.collapsed.__leftPanel; const sideCollapsed = sideCollapsible && (collapsedState === undefined ? schema.layout?.leftPanel?.defaultCollapsed === true : collapsedState);
    const resolvedApp = useMemo(() => resolveAppShell(schema, settings, state), [schema, settings, state]);

    return <div id={instanceId} class={`hyperpbi-root hp-density-${schema.theme?.density ?? settings.layout.density} hp-theme-${schema.theme?.mode ?? settings.theme.mode} ${settings.layout.internalScrolling ? "hp-scroll" : "hp-no-scroll"}`} style={style}>
        <style>{sanitizedCss.css}</style>
        <RenderContext.Provider value={context}>
            {resolvedApp.enabled ? (
                <>
                    <AppShell app={resolvedApp} schema={schema} settings={settings} state={state} dispatch={dispatch}>
                        {schema.toolbar?.length ? <div class={`hp-toolbar ${settings.layout.stickyToolbar ? "hp-sticky" : ""}`}><DashboardRenderer components={schema.toolbar} /></div> : null}
                        <div class="hp-grid"><DashboardRenderer components={schema.components} /></div>
                        {schema.rightPanel?.length ? <aside class="hp-right-panel"><DashboardRenderer components={schema.rightPanel} /></aside> : null}
                    </AppShell>
                </>
            ) : (
                <>
                    {config.renderer?.showHeader === true && <header class="hp-header"><div>{schema.title && <h1>{schema.title}</h1>}{config.renderer?.showRowCount === true && <span>{rows.length.toLocaleString()} of {data.rows.length.toLocaleString()} rows</span>}</div></header>}
                    {schema.toolbar?.length ? <div class={`hp-toolbar ${settings.layout.stickyToolbar ? "hp-sticky" : ""}`}><DashboardRenderer components={schema.toolbar} /></div> : null}
                    {hasSidePanel && sideCollapsible && <button type="button" class="hp-sidebar-toggle" onClick={() => dispatch({ type: "collapse", id: "__leftPanel", value: !sideCollapsed })}>{sideCollapsed ? "Show filters" : "Hide filters"}</button>}
                    <div class={`hp-shell ${hasSidePanel && !sideCollapsed ? "hp-with-sidebar" : ""}`} style={{ "--hp-panel-width": `${panelWidth}px` }}>
                        {hasSidePanel && !sideCollapsed && <aside class="hp-sidebar"><DashboardRenderer components={schema.leftPanel ?? []} /></aside>}
                        <main class="hp-main"><div class="hp-grid"><DashboardRenderer components={schema.components} /></div>{schema.rightPanel?.length ? <aside class="hp-right-panel"><DashboardRenderer components={schema.rightPanel} /></aside> : null}</main>
                    </div>
                </>
            )}
            <OverlayHost />
            <ToastHost />
            {settings.debug.showSchemaErrors && referenceWarnings.length > 0 && <details class="hp-reference-warning"><summary>{referenceWarnings.length} schema field warning(s)</summary><ul>{referenceWarnings.map(warning => <li>{warning}</li>)}</ul><div>Valid field keys: {Object.keys(data.fields).join(", ") || "No fields are bound."}</div></details>}
            {settings.debug.showFieldDictionary && <FieldDictionaryPanel data={filteredData} />}
            {settings.debug.showDataSample && <details class="hp-debug"><summary>Normalized data sample</summary><pre>{JSON.stringify(filteredData.rows.slice(0, 10), null, 2)}</pre></details>}
            {settings.debug.showPerformance && <div class="hp-performance">Render preparation: {renderMs.toFixed(1)} ms · Loaded {data.rows.length.toLocaleString()} rows{data.loadStatus?.moreRowsAvailable ? " · more available" : ""}{datasetEvaluation.diagnostics.map(item=>` · ${item.name}: ${item.outputRowCount} rows/${item.evaluationMs.toFixed(1)}ms/${item.cacheStatus}`)}</div>}
            {config.security?.showSanitizerWarnings === true && settings.showWarnings && sanitizedCss.warnings.length > 0 && <details class="hp-debug"><summary>CSS sanitizer warnings ({sanitizedCss.warnings.length})</summary><ul>{sanitizedCss.warnings.map(warning => <li>{warning}</li>)}</ul></details>}
        </RenderContext.Provider>
    </div>;
}
