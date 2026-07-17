import {
  DashboardComponent,
  MapComponent,
} from "../schema/hyperpbiSchema";
import { ComponentRegistry } from "./ComponentRegistry";
import { scopeComponentCss } from "../components/custom/componentCssScope";
import { SlotRenderer } from "../components/custom/slotRenderer";
import { sanitizeStyleObject } from "../security/sanitizeCss";
import { RenderContext, useRenderContext, type RenderContextValue } from "./RenderContext";
import { componentRows as selectedComponentRows, executeComponentInteraction, rowsForComponent } from "../interactions/componentInteraction";
import { deriveBoundPayload } from "../interactions/interactionPayload";
import { componentKindForType, resolveInteractionPolicy } from "../interactions/interactionPolicy";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";
import { componentOwnsResponsiveLayout, componentSubtreeRequestsFill, responsiveComponentStyle } from "../components/layout/responsiveLayout";
function isMapComponent(
  component: DashboardComponent,
): component is MapComponent {
  return component.type === "map";
}
export function DashboardRenderer({ components }: { components: DashboardComponent[] }) {
    const context=useRenderContext();const { schema, config } = context;
    const renderChildren = (children: DashboardComponent[]) => <DashboardRenderer components={children} />;
    return <>{components.filter(component => !component.hidden).map((component, index) => {
        const componentId = component.id ?? `${component.type}-${index}`;
        const authoringOwnerId = context.ownerByRuntimeId?.[componentId] ?? componentId;
        const datasetResult=component.dataset?context.datasets?.get(component.dataset):undefined;
        const powerBiSourceRowKeys = context.powerBiSourceRowKeys ?? context.sourceRowKeys;
        const componentContext: RenderContextValue = datasetResult ? {
            ...context,
            data: datasetResult.data,
            rows: datasetResult.data.rows,
            sourceRows: datasetResult.data.rows,
            sourceRowKeys: datasetResult.data.rowKeys,
            datasetLineage: datasetResult.lineage,
            interactionIndexSpace: "component",
            getRowsForComponent: (id: string) => rowsForComponent(
                datasetResult.data.rows,
                datasetResult.data.rowKeys,
                datasetResult.data.rows,
                id,
                { state: context.state, datasetLineage: datasetResult.lineage, powerBiSourceRowKeys },
            ),
            componentRows: (id: string) => {
                const selected = new Set(selectedComponentRows(id, { state: context.state }));
                return datasetResult.lineage.flatMap((indices, index) => indices.some(sourceIndex => selected.has(sourceIndex)) ? [index] : []);
            },
        } : context;
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
        const hasUiAction = Boolean(component.uiAction);
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
const aspectHeightClass = component.heightMode === "aspectRatio" && !isMapComponent(component) ? "hp-height-aspect" : "";
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
            style={{ ...safeStyle, ...responsiveComponentStyle(component), "--hp-span": Math.max(1, Math.min(12, component.span ?? 12)), ...(component.heightMode === "fixed" && "height" in component && typeof component.height === "number" ? { height: `${component.height}px` } : {}), ...(component.minHeight !== undefined ? { minHeight: `${component.minHeight}px` } : {}), ...(component.heightMode === "aspectRatio" && !isMapComponent(component) ? { aspectRatio: String(component.aspectRatio ?? 16 / 9) } : {}) }}
        >
            <style>{scoped.css}</style>
            <RenderContext.Provider value={componentContext}>
                <SlotRenderer component={component} name="header" />
                <SlotRenderer component={component} name="subheader" />
                <SlotRenderer component={component} name="actions" />
                <ComponentErrorBoundary id={componentId} type={component.type} dataset={component.dataset} developer={context.settings.debug.showSchemaErrors}><ComponentRegistry component={component} renderChildren={renderChildren} authoringOwnerId={authoringOwnerId} /></ComponentErrorBoundary>
                <SlotRenderer component={component} name="footer" />
            </RenderContext.Provider>
        </div>;
    })}</>;
}
