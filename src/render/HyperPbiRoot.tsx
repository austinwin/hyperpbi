import { useEffect, useMemo, useReducer, useRef } from "preact/hooks";
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

export function HyperPbiRoot({ instanceId, schema, data, settings, renderMs, referenceWarnings = [], config = defaultConfig, selectExternal = () => undefined, clearExternal = () => undefined, webAccessAvailable = false, onOpenStudio }: { instanceId: string; schema: HyperPbiSchema; data: NormalizedData; settings: RuntimeSettings; renderMs: number; referenceWarnings?: string[]; config?: HyperPbiConfig; selectExternal?: (rowIndices: number[], multiSelect?: boolean) => void; clearExternal?: () => void; webAccessAvailable?: boolean; onOpenStudio?: () => void }) {
    const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState(schema.state?.search, schema.state?.activeTab));
    const rows = useMemo(() => filterRows(data.rows, state.filters, state.search), [data.rows, state.filters, state.search]);
    const filteredData = useMemo<NormalizedData>(() => ({ ...data, rows, aggregates: calculateAggregates(rows), calculatedMetrics: calculateDerivedMetrics(rows, schema.calculations?.metrics), map: normalizeMapBindings(rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries) }), [data, rows, schema.calculations?.metrics, config.bindings?.map, config.providers?.geocoder?.cacheEntries]);
    const scope = `#${instanceId}`; const sanitizedCss = useMemo(() => sanitizeCss(`${schema.styles?.globalCss ?? ""}\n${schema.css ?? ""}\n${settings.customCss}`, scope), [schema.styles?.globalCss, schema.css, settings.customCss, scope]);
    const context = useMemo(() => ({ data: filteredData, rows, sourceRows: data.rows, schema, settings, state, dispatch, warnings: sanitizedCss.warnings, selectExternal, clearExternal, config, webAccessAvailable }), [filteredData, rows, data.rows, schema, settings, state, sanitizedCss.warnings, selectExternal, clearExternal, config, webAccessAvailable]);
    const hadExternalFilter = useRef(false); const filterActive = Boolean(state.search.trim() || state.filters.length);
    useEffect(() => {
        if (!settings.enableInteractions || config.interactions?.crossFilter === false) return;
        if (filterActive) { hadExternalFilter.current = true; selectExternal(rows.map(row => data.rows.indexOf(row)).filter(index => index >= 0)); }
        else if (hadExternalFilter.current) { hadExternalFilter.current = false; clearExternal(); }
    }, [filterActive, rows, data.rows, settings.enableInteractions, config.interactions?.crossFilter]);
    const style = themeVariables(schema.theme, settings);
    const hasSidePanel = Boolean(schema.leftPanel?.length); const panelWidth = schema.layout?.leftPanel?.width ?? settings.layout.leftPanelWidth; const sideCollapsible = schema.layout?.leftPanel?.collapsible === true; const collapsedState = state.collapsed.__leftPanel; const sideCollapsed = sideCollapsible && (collapsedState === undefined ? schema.layout?.leftPanel?.defaultCollapsed === true : collapsedState);
    return <div id={instanceId} class={`hyperpbi-root hp-density-${schema.theme?.density ?? settings.layout.density} hp-theme-${schema.theme?.mode ?? settings.theme.mode} ${settings.layout.internalScrolling ? "hp-scroll" : "hp-no-scroll"}`} style={style}>
        <style>{sanitizedCss.css}</style>
        <RenderContext.Provider value={context}>
            {onOpenStudio && config.renderer?.showStudioButton !== false && <button type="button" class="hp-open-studio" onClick={onOpenStudio} title="Design this dashboard with AI">Design with AI</button>}
            {config.renderer?.showHeader !== false && <header class="hp-header"><div><h1>{schema.title ?? "HyperPBI"}</h1>{config.renderer?.showRowCount !== false && <span>{rows.length.toLocaleString()} of {data.rows.length.toLocaleString()} rows</span>}</div></header>}
            {schema.toolbar?.length ? <div class={`hp-toolbar ${settings.layout.stickyToolbar ? "hp-sticky" : ""}`}><DashboardRenderer components={schema.toolbar} /></div> : null}
            {hasSidePanel && sideCollapsible && <button type="button" class="hp-sidebar-toggle" onClick={() => dispatch({ type: "collapse", id: "__leftPanel", value: !sideCollapsed })}>{sideCollapsed ? "Show filters" : "Hide filters"}</button>}
            <div class={`hp-shell ${hasSidePanel && !sideCollapsed ? "hp-with-sidebar" : ""}`} style={{ "--hp-panel-width": `${panelWidth}px` }}>
                {hasSidePanel && !sideCollapsed && <aside class="hp-sidebar"><DashboardRenderer components={schema.leftPanel ?? []} /></aside>}
                <main class="hp-main"><div class="hp-grid"><DashboardRenderer components={schema.components} /></div>{schema.rightPanel?.length ? <aside class="hp-right-panel"><DashboardRenderer components={schema.rightPanel} /></aside> : null}</main>
            </div>
            {settings.debug.showSchemaErrors && referenceWarnings.length > 0 && <details class="hp-reference-warning"><summary>{referenceWarnings.length} schema field warning(s)</summary><ul>{referenceWarnings.map(warning => <li>{warning}</li>)}</ul><div>Valid field keys: {Object.keys(data.fields).join(", ") || "No fields are bound."}</div></details>}
            {settings.debug.showFieldDictionary && <FieldDictionaryPanel data={filteredData} />}
            {settings.debug.showDataSample && <details class="hp-debug"><summary>Normalized data sample</summary><pre>{JSON.stringify(filteredData.rows.slice(0, 10), null, 2)}</pre></details>}
            {settings.debug.showPerformance && <div class="hp-performance">Render preparation: {renderMs.toFixed(1)} ms</div>}
            {settings.showWarnings && sanitizedCss.warnings.length > 0 && <details class="hp-debug"><summary>CSS sanitizer warnings ({sanitizedCss.warnings.length})</summary><ul>{sanitizedCss.warnings.map(warning => <li>{warning}</li>)}</ul></details>}
        </RenderContext.Provider>
    </div>;
}
