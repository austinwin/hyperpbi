import { useMemo, useReducer } from "preact/hooks";
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
import { RenderContext } from "./RenderContext";
import { dashboardReducer, initialDashboardState } from "./stateStore";
import { calculateDerivedMetrics } from "../calculations/derivedMetrics";
import { ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails } from "../powerbi/interactionDiagnostics";
import { ExternalFilterResult } from "../powerbi/externalFilters";
import { FilterOperator } from "../schema/hyperpbiSchema";

const notSent = (): ExternalSelectionResult => ({ sent: false, reason: "component did not call selectExternal" });
const filterNotSent = (): ExternalFilterResult => ({ sent:false, reason:"component did not call selectExternal" });
export function HyperPbiRoot({ instanceId, schema, data, settings, renderMs, referenceWarnings = [], config = defaultConfig, selectExternal = notSent, clearExternal = notSent, applyExternalFilter = filterNotSent, clearExternalFilter = filterNotSent, reportInteraction = () => undefined, webAccessAvailable = false }: { instanceId: string; schema: HyperPbiSchema; data: NormalizedData; settings: RuntimeSettings; renderMs: number; referenceWarnings?: string[]; config?: HyperPbiConfig; selectExternal?: (rowIndices: number[], multiSelect?: boolean, details?: InteractionDetails) => ExternalSelectionResult; clearExternal?: (details?: InteractionDetails) => ExternalSelectionResult; applyExternalFilter?:(field:string,operator:FilterOperator,value:unknown,details?:InteractionDetails)=>ExternalFilterResult;clearExternalFilter?:(details?:InteractionDetails)=>ExternalFilterResult; reportInteraction?: (details: InteractionDetails, reason?: ExternalSelectionFailureReason, rowIndices?: number[]) => void; webAccessAvailable?: boolean }) {
    const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState(schema.state?.search, schema.state?.activeTab));
    const rows = useMemo(() => filterRows(data.rows, state.filters, state.search), [data.rows, state.filters, state.search]);
    const filteredData = useMemo<NormalizedData>(() => ({ ...data, rows, aggregates: calculateAggregates(rows), calculatedMetrics: calculateDerivedMetrics(rows, schema.calculations?.metrics), map: normalizeMapBindings(rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries) }), [data, rows, schema.calculations?.metrics, config.bindings?.map, config.providers?.geocoder?.cacheEntries]);
    const scope = `#${instanceId}`; const cssMode = config.security?.cssMode ?? "scoped"; const sanitizedCss = useMemo(() => sanitizeCss(`${schema.styles?.globalCss ?? ""}\n${schema.css ?? ""}\n${settings.customCss}`, scope, { mode: cssMode }), [schema.styles?.globalCss, schema.css, settings.customCss, scope, cssMode]);
    const gatedApplyExternalFilter = (field:string,operator:FilterOperator,value:unknown,details:InteractionDetails={}):ExternalFilterResult=>{if(config.interactions?.crossFilter===false){reportInteraction(details,"interactions disabled");return{sent:false,reason:"interactions disabled"};}return applyExternalFilter(field,operator,value,details);};
    const gatedClearExternalFilter = (details:InteractionDetails={}):ExternalFilterResult=>{if(config.interactions?.crossFilter===false){reportInteraction(details,"interactions disabled");return{sent:false,reason:"interactions disabled"};}return clearExternalFilter(details);};
    const gatedSelectExternal = (indices: number[], multiSelect = false, details: InteractionDetails = {}): ExternalSelectionResult => { if (config.interactions?.crossFilter === false) { reportInteraction(details, "interactions disabled", indices); return { sent: false, reason: "interactions disabled" }; }if(config.interactions?.externalMode==="filter"){if(!details.field){reportInteraction(details,"field has no Power BI filter target",indices);return{sent:false,reason:"field has no Power BI filter target"};}const operator=details.filterOperator??(Array.isArray(details.value)?"in":"=");return gatedApplyExternalFilter(details.field,operator,details.value,details);} return selectExternal(indices, config.interactions?.multiSelect!==false&&multiSelect, details); };
    const gatedClearExternal = (details: InteractionDetails = {}): ExternalSelectionResult => { if (config.interactions?.crossFilter === false) { reportInteraction(details, "interactions disabled"); return { sent: false, reason: "interactions disabled" }; }return config.interactions?.externalMode==="filter"?gatedClearExternalFilter(details):clearExternal(details); };
    const context = useMemo(() => ({ data: filteredData, rows, sourceRows: data.rows, schema, settings, state, dispatch, warnings: sanitizedCss.warnings, selectExternal: gatedSelectExternal, clearExternal: gatedClearExternal, applyExternalFilter:gatedApplyExternalFilter,clearExternalFilter:gatedClearExternalFilter, reportInteraction, config, webAccessAvailable }), [filteredData, rows, data.rows, schema, settings, state, sanitizedCss.warnings, selectExternal, clearExternal, applyExternalFilter,clearExternalFilter,reportInteraction, config, webAccessAvailable]);
    const style = themeVariables(schema.theme, settings);
    const hasSidePanel = Boolean(schema.leftPanel?.length); const panelWidth = schema.layout?.leftPanel?.width ?? settings.layout.leftPanelWidth; const sideCollapsible = schema.layout?.leftPanel?.collapsible === true; const collapsedState = state.collapsed.__leftPanel; const sideCollapsed = sideCollapsible && (collapsedState === undefined ? schema.layout?.leftPanel?.defaultCollapsed === true : collapsedState);
    return <div id={instanceId} class={`hyperpbi-root hp-density-${schema.theme?.density ?? settings.layout.density} hp-theme-${schema.theme?.mode ?? settings.theme.mode} ${settings.layout.internalScrolling ? "hp-scroll" : "hp-no-scroll"}`} style={style}>
        <style>{sanitizedCss.css}</style>
        <RenderContext.Provider value={context}>
            {config.renderer?.showHeader === true && <header class="hp-header"><div>{schema.title && <h1>{schema.title}</h1>}{config.renderer?.showRowCount === true && <span>{rows.length.toLocaleString()} of {data.rows.length.toLocaleString()} rows</span>}</div></header>}
            {schema.toolbar?.length ? <div class={`hp-toolbar ${settings.layout.stickyToolbar ? "hp-sticky" : ""}`}><DashboardRenderer components={schema.toolbar} /></div> : null}
            {hasSidePanel && sideCollapsible && <button type="button" class="hp-sidebar-toggle" onClick={() => dispatch({ type: "collapse", id: "__leftPanel", value: !sideCollapsed })}>{sideCollapsed ? "Show filters" : "Hide filters"}</button>}
            <div class={`hp-shell ${hasSidePanel && !sideCollapsed ? "hp-with-sidebar" : ""}`} style={{ "--hp-panel-width": `${panelWidth}px` }}>
                {hasSidePanel && !sideCollapsed && <aside class="hp-sidebar"><DashboardRenderer components={schema.leftPanel ?? []} /></aside>}
                <main class="hp-main"><div class="hp-grid"><DashboardRenderer components={schema.components} /></div>{schema.rightPanel?.length ? <aside class="hp-right-panel"><DashboardRenderer components={schema.rightPanel} /></aside> : null}</main>
            </div>
            {settings.debug.showSchemaErrors && referenceWarnings.length > 0 && <details class="hp-reference-warning"><summary>{referenceWarnings.length} schema field warning(s)</summary><ul>{referenceWarnings.map(warning => <li>{warning}</li>)}</ul><div>Valid field keys: {Object.keys(data.fields).join(", ") || "No fields are bound."}</div></details>}
            {settings.debug.showFieldDictionary && <FieldDictionaryPanel data={filteredData} />}
            {settings.debug.showDataSample && <details class="hp-debug"><summary>Normalized data sample</summary><pre>{JSON.stringify(filteredData.rows.slice(0, 10), null, 2)}</pre></details>}
            {settings.debug.showPerformance && <div class="hp-performance">Render preparation: {renderMs.toFixed(1)} ms · Loaded {data.rows.length.toLocaleString()} rows{data.loadStatus?.moreRowsAvailable ? " · more available" : ""}</div>}
            {config.security?.showSanitizerWarnings === true && settings.showWarnings && sanitizedCss.warnings.length > 0 && <details class="hp-debug"><summary>CSS sanitizer warnings ({sanitizedCss.warnings.length})</summary><ul>{sanitizedCss.warnings.map(warning => <li>{warning}</li>)}</ul></details>}
        </RenderContext.Provider>
    </div>;
}
