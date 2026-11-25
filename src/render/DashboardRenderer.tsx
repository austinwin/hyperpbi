import { memo } from "preact/compat";
import { useLayoutEffect, useMemo, useRef } from "preact/hooks";
import { DashboardComponent } from "../schema/hyperpbiSchema";
import { ComponentRegistry, isChartComponent, isDataDisplayComponent } from "./ComponentRegistry";
import { scopeComponentCss } from "../components/custom/componentCssScope";
import { SlotRenderer } from "../components/custom/slotRenderer";
import { sanitizeStyleObject } from "../security/sanitizeCss";
import { RenderContext, useRenderContext, type RenderContextValue } from "./RenderContext";
import { componentRowKeys, componentRows as selectedComponentRows, executeComponentInteraction, rowsForComponent } from "../interactions/componentInteraction";
import { deriveBoundPayload } from "../interactions/interactionPayload";
import { componentKindForType, resolveInteractionPolicy } from "../interactions/interactionPolicy";
import { templateStateKeys } from "./renderTemplate";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";
import { componentOwnsResponsiveLayout, componentSubtreeRequestsFill, responsiveComponentStyle } from "../components/layout/responsiveLayout";
function isFixedCanvasMapComponent(component: DashboardComponent): boolean {
  return component.type === "map";
}
interface NodeProps {
    component: DashboardComponent;
    index: number;
    context: RenderContextValue;
}

const renderChildren = (children: DashboardComponent[]) => <DashboardRenderer components={children} />;

function useLiveContextGetter(value: RenderContextValue) {
    const live = useRef(value);
    useLayoutEffect(() => { live.current = value; }, [value]);
    return useMemo(() => liveContextReader(live), [live]);
}

function liveContextReader(live: { current: RenderContextValue }) {
    return () => live.current;
}

export function DashboardRenderer({ components }: { components: DashboardComponent[] }) {
    const current = useRenderContext();
    const getLatestContext = useLiveContextGetter(current);
    const context = useMemo(() => ({ ...current, getLatestContext }), [current, getLatestContext]);
    return <>{components.filter(component => !component.hidden).map((component, index) => (
        <DashboardNode key={component.id ?? `${component.type}-${index}`} component={component} index={index} context={context} />
    ))}</>;
}

const templateDependencies = new WeakMap<DashboardComponent, string[]>();

function sameRows(left: number[], right: number[]): boolean {
    return left === right || left.length === right.length && left.every((row, index) => row === right[index]);
}

/** Leaf boundaries opt in when all fields read during render are known.
 * Containers and context-dependent authored extensions keep full context. */
function sameNode(previous: NodeProps, next: NodeProps): boolean {
    const { component, index, context } = next;
    const before = previous.context;
    if (previous.component !== component || previous.index !== index) return false;
    if (before === context) return true;
    const chart = isChartComponent(component.type);
    const display = isDataDisplayComponent(component.type) && component.type !== "detailPanel";
    const table = component.type === "table";
    const control = component.type === "segmentedControl" || component.type === "searchBox";
    const text = (component.type === "text" || component.type === "markdown") && !component.interaction && !component.interactions;
    const staticSvg = component.type === "svgMarkup" && "svg" in component &&
        !component.svg?.includes("{{") && component.svgBinding?.mode !== "data";
    if ((!chart && !display && !table && !control && !text && !staticSvg) || component.slots || component.uiAction || context.executionMode === "fragment") return false;
    if (chart && "drill" in component && component.drill) return false;
    if (
        before.profiler !== context.profiler || before.settings !== context.settings || before.config !== context.config ||
        before.data.fields !== context.data.fields || before.sourceRows !== context.sourceRows ||
        before.sourceRowKeys !== context.sourceRowKeys || before.datasetLineage !== context.datasetLineage ||
        before.remoteSources !== context.remoteSources ||
        before.schema.styles?.components !== context.schema.styles?.components ||
        before.schema.data?.datasets !== context.schema.data?.datasets ||
        before.reportInteraction !== context.reportInteraction || before.selectExternal !== context.selectExternal ||
        before.selectSourceRows !== context.selectSourceRows ||
        before.clearExternal !== context.clearExternal || before.applyExternalFilter !== context.applyExternalFilter ||
        before.clearExternalFilter !== context.clearExternalFilter
    ) return false;
    const id = component.id ?? component.type;
    if (before.ownerByRuntimeId?.[id] !== context.ownerByRuntimeId?.[id]) return false;
    if (before.dynamicEventKeys !== context.dynamicEventKeys && ["click", "change", "select", "nodeClick"].some(event =>
        Boolean(before.dynamicEventKeys?.has(`${id}:${event}`)) !== Boolean(context.dynamicEventKeys?.has(`${id}:${event}`)))) return false;
    const dataset = component.dataset;
    if (staticSvg && !dataset) return before.instanceId === context.instanceId;
    const previousDataset = dataset ? before.datasets?.get(dataset) : undefined;
    const nextDataset = dataset ? context.datasets?.get(dataset) : undefined;
    if (dataset) {
        const previousView = before.getDatasetView?.(dataset, id);
        const nextView = context.getDatasetView?.(dataset, id);
        if (previousView?.rows !== nextView?.rows || previousView?.fields !== nextView?.fields ||
            previousDataset?.data.rows !== nextDataset?.data.rows ||
            previousDataset?.data.rowKeys !== nextDataset?.data.rowKeys ||
            previousDataset?.data.calculatedMetrics !== nextDataset?.data.calculatedMetrics ||
            previousDataset?.signature !== nextDataset?.signature) return false;
    } else if (before.getRowsForComponent(id) !== context.getRowsForComponent(id)) return false;
    if (display && !dataset && before.data.calculatedMetrics !== context.data.calculatedMetrics) return false;
    if (control) {
        const stateKey = component.interaction?.stateKey ?? id;
        if (before.state.values[stateKey] !== context.state.values[stateKey] ||
            before.state.values[id] !== context.state.values[id] ||
            (component.type === "searchBox" && before.state.search !== context.state.search)) return false;
    }
    if (table) {
        const stateKey = component.interaction?.stateKey;
        if (before.state.tableSearch[id] !== context.state.tableSearch[id] ||
            before.state.componentSelectedRows[id] !== context.state.componentSelectedRows[id] ||
            (stateKey && before.state.values[stateKey] !== context.state.values[stateKey])) return false;
    }
    if (text && "text" in component) {
        const oldData = previousDataset?.data ?? before.data;
        const newData = nextDataset?.data ?? context.data;
        if (before.schema.title !== context.schema.title || oldData.aggregates !== newData.aggregates ||
            oldData.calculatedMetrics !== newData.calculatedMetrics) return false;
        let keys = templateDependencies.get(component);
        if (!keys) {
            keys = templateStateKeys(component.text ?? "");
            templateDependencies.set(component, keys);
        }
        if (keys.some(key => before.state.values[key] !== context.state.values[key])) return false;
    }
    if (chart && (
        before.state.chartViewState[id] !== context.state.chartViewState[id] ||
        before.state.chartDrillState[id] !== context.state.chartDrillState[id] ||
        before.state.componentSelectedRows[id] !== context.state.componentSelectedRows[id]
    )) return false;
    return sameRows(before.componentRows(id), context.componentRows(id));
}

function ProfiledRegistry({ profile, component, owner, id, context }: {
    profile: NonNullable<RenderContextValue["profiler"]>;
    component: DashboardComponent;
    owner: string;
    id: string;
    context: RenderContextValue;
}) {
    const marker = useRef<HTMLSpanElement>(null);
    const previous = useRef<RenderContextValue>();
    const started = performance.now();
    useLayoutEffect(() => {
        const element = marker.current?.closest("[data-hp-id]");
        if (!element) return;
        profile.attach(id, component.type, element);
        return () => profile.detach(element);
    }, [profile, id, component.type]);
    useLayoutEffect(() => {
        const before = previous.current;
        const cause = !before ? "Mount" : before.sourceRows !== context.sourceRows ? "Source data"
            : before.getRowsForComponent(id) !== context.getRowsForComponent(id) ? "Filtered rows"
            : before.settings !== context.settings || before.schema !== context.schema ? "Configuration"
            : "Interaction or local state";
        profile.component(id, started, cause);
        previous.current = context;
    });
    return <><span ref={marker} hidden /><ComponentRegistry component={component} renderChildren={renderChildren} authoringOwnerId={owner} /></>;
}

const DashboardNode = memo(function DashboardNode({ component, index, context }: NodeProps) {
        const { schema, config } = context;
        const componentId = component.id ?? `${component.type}-${index}`;
        const authoringOwnerId = context.ownerByRuntimeId?.[componentId] ?? componentId;
        const datasetResult=component.dataset?context.datasets?.get(component.dataset):undefined;
        const fragmentDatasetRoot = context.executionMode === "fragment" && datasetResult?.sourceId
            ? context.datasets?.get(datasetResult.sourceId)?.data : undefined;
        const powerBiSourceRowKeys = fragmentDatasetRoot?.rowKeys ?? context.powerBiSourceRowKeys ?? context.sourceRowKeys;
        const hasPowerBiLineage = datasetResult?.sourceId === "powerbi";
        const componentContext: RenderContextValue = datasetResult ? {
            ...context,
            data: datasetResult.data,
            rows: datasetResult.data.rows,
            sourceRows: datasetResult.data.rows,
            sourceRowKeys: datasetResult.data.rowKeys,
            ...(fragmentDatasetRoot ? { powerBiSourceRows: fragmentDatasetRoot.rows, powerBiSourceRowKeys } : {}),
            datasetLineage: datasetResult.lineage,
            getCalculatedMetrics: undefined,
            interactionIndexSpace: "component",
            selectExternal: hasPowerBiLineage ? context.selectExternal : () => ({ sent: false, reason: "no selection identities" }),
            selectSourceRows: hasPowerBiLineage ? context.selectSourceRows : () => ({ sent: false, reason: "no selection identities" }),
            clearExternal: hasPowerBiLineage ? context.clearExternal : () => ({ sent: false, reason: "no selection identities" }),
            applyExternalFilter: hasPowerBiLineage ? context.applyExternalFilter : () => ({ sent: false, reason: "field has no Power BI filter target" }),
            clearExternalFilter: hasPowerBiLineage ? context.clearExternalFilter : () => ({ sent: false, reason: "field has no Power BI filter target" }),
            getRowsForComponent: (id: string) => context.getDatasetView?.(component.dataset, id)?.rows ?? rowsForComponent(
                datasetResult.data.rows,
                datasetResult.data.rowKeys,
                datasetResult.data.rows,
                id,
                { state: context.state, datasetLineage: datasetResult.lineage, powerBiSourceRowKeys },
            ),
            componentRows: (id: string) => {
                if (fragmentDatasetRoot) {
                    const selected = new Set(componentRowKeys(id, context));
                    return datasetResult.lineage.flatMap((indices, index) => indices.some(sourceIndex => selected.has(powerBiSourceRowKeys[sourceIndex])) ? [index] : []);
                }
                const selected = new Set(selectedComponentRows(id, { state: context.state }));
                return datasetResult.lineage.flatMap((indices, index) => indices.some(sourceIndex => selected.has(sourceIndex)) ? [index] : []);
            },
        } : context;
        const remoteStatus = datasetResult?.sourceId ? context.remoteSources?.[datasetResult.sourceId] : undefined;
        const rules = schema.styles?.components ?? {};
        const globalRule = rules["*"] ?? {};
        const typeRule = rules[component.type] ?? {};
        const idRule = rules[`#${componentId}`] ?? {};
        const cssMode = config.security?.cssMode ?? "scoped";
        const svgOwnCss = component.type === "svg" || component.type === "svgMarkup";
        const scoped = scopeComponentCss([globalRule.css, typeRule.css, idRule.css, svgOwnCss ? undefined : component.css].filter(Boolean).join("\n"), componentId, cssMode);
        const localContainerStyle = component.type === "map" ? undefined : component.style as Record<string,string|number> | undefined;
        const safeStyle = sanitizeStyleObject({ ...globalRule.style, ...typeRule.style, ...idRule.style, ...localContainerStyle }, cssMode);
        const classes = [globalRule.className, typeRule.className, idRule.className, component.className].filter(Boolean).join(" ");
        const kind=componentKindForType(component.type);
        const policy=resolveInteractionPolicy(component,config,kind);

        // Skip wrapper behavior for overlay-only components (modals, dropdowns, etc.)
        const isOverlayOnly = ["modal", "dropdown", "popover", "offcanvas"].includes(component.type);

        // UI action execution (separate from data interaction)
        const hasUiAction = component.type !== "button" && Boolean(component.uiAction);
        const handleUiAction = (event: Event) => {
            if (!hasUiAction) return;
            if (component.uiAction) {
                context.executeUiAction(component.uiAction, event);
            }
        };

        const wrapperAdapter = !isOverlayOnly && (kind==="layout"||kind==="content") && policy.enabled;
        const run=(event:Event)=>{
            if(kind==="layout"&&event.target!==event.currentTarget)return;
            executeComponentInteraction(policy,deriveBoundPayload(component,componentContext.data,componentContext.sourceRows,componentContext.sourceRowKeys),componentContext,{trigger:"click",event});
            // Also execute UI action after data interaction
            if (hasUiAction) handleUiAction(event);
        };

        const hasSelection = context.componentRows(componentId).length > 0;
        const showWrapperHighlight = hasSelection && (kind === "layout" || kind === "content" || kind === "navigation");

        // Variant, size, disabled classes
        const variantClass = component.variant ? `hp-variant-${component.variant}` : "";
        const sizeClass = component.size ? `hp-size-${component.size}` : "";
        const disabledClass = component.disabled ? "hp-is-disabled" : "";
        const tooltipClass = component.tooltip ? "hp-has-tooltip" : "";

const fillHeightClass = component.heightMode === "fill" ? "hp-height-fill" : "";
const aspectHeightClass = component.heightMode === "aspectRatio" && !isFixedCanvasMapComponent(component) ? "hp-height-aspect" : "";
const fillChainClass = !fillHeightClass && !aspectHeightClass && componentSubtreeRequestsFill(component) ? "hp-fill-chain" : "";
const responsiveContainerClass = componentOwnsResponsiveLayout(component) ? "hp-responsive-container" : "";

const componentClasses = [
  "hp-component",
  `hp-component-${component.type}`,
  showWrapperHighlight ? "hp-interaction-highlight" : "",
  fillHeightClass,
  aspectHeightClass,
  fillChainClass,
  responsiveContainerClass,
  variantClass,
  sizeClass,
  disabledClass,
  tooltipClass,
  classes,
]
  .filter(Boolean)
  .join(" ");

        const wrapperRole = !isOverlayOnly && (wrapperAdapter || hasUiAction) ? "button" : undefined;
        const wrapperTabIndex = !isOverlayOnly && (wrapperAdapter || hasUiAction) ? 0 : undefined;

        return <div
            key={componentId}
            data-hp-id={componentId}
            data-hp-owner-id={authoringOwnerId}
            class={componentClasses}
            role={wrapperRole}
            tabIndex={wrapperTabIndex}
            aria-disabled={component.disabled ? true : undefined}
            aria-label={component.ariaLabel}
            title={component.tooltip?.content}
            aria-describedby={component.tooltip ? `hp-tooltip-${componentId}` : undefined}
            onClick={wrapperAdapter ? run : hasUiAction ? handleUiAction : undefined}
            onKeyDown={wrapperAdapter || hasUiAction ? (event: KeyboardEvent) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    if (wrapperAdapter) run(event);
                    else handleUiAction(event);
                }
            } : undefined}
            data-hp-height-mode={component.heightMode ?? "auto"}
            style={{ ...safeStyle, ...responsiveComponentStyle(component), "--hp-span": Math.max(1, Math.min(12, component.span ?? 12)), ...(component.heightMode === "fixed" && "height" in component && typeof component.height === "number" ? { height: `${component.height}px` } : {}), ...(component.minHeight !== undefined ? { minHeight: `${component.minHeight}px` } : {}), ...(component.heightMode === "aspectRatio" && !isFixedCanvasMapComponent(component) ? { aspectRatio: String(component.aspectRatio ?? 16 / 9) } : {}) }}
        >
            <style>{scoped.css}</style>
            <RenderContext.Provider value={componentContext}>
                <SlotRenderer component={component} name="header" />
                <SlotRenderer component={component} name="subheader" />
                <SlotRenderer component={component} name="actions" />
                {remoteStatus?.status === "loading" && <div class="hp-remote-source-status" role="status">Loading remote data…</div>}
                {remoteStatus?.status === "error" && <div class="hp-remote-source-status hp-remote-source-error" role="alert">Remote data unavailable: {remoteStatus.error ?? "request failed"}</div>}
                <ComponentErrorBoundary id={componentId} type={component.type} dataset={component.dataset} developer={context.settings.debug.showSchemaErrors}>{context.profiler
                    ? <ProfiledRegistry profile={context.profiler} component={component} owner={authoringOwnerId} id={componentId} context={componentContext} />
                    : <ComponentRegistry component={component} renderChildren={renderChildren} authoringOwnerId={authoringOwnerId} />}</ComponentErrorBoundary>
                <SlotRenderer component={component} name="footer" />
            </RenderContext.Provider>
        </div>;
}, sameNode);
