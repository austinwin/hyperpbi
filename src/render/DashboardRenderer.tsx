import { DashboardComponent } from "../schema/hyperpbiSchema";
import { ComponentRegistry } from "./ComponentRegistry";
import { scopeComponentCss } from "../components/custom/componentCssScope";
import { SlotRenderer } from "../components/custom/slotRenderer";
import { sanitizeStyleObject } from "../security/sanitizeCss";
import { RenderContext, useRenderContext } from "./RenderContext";
import { executeComponentInteraction } from "../interactions/componentInteraction";
import { deriveBoundPayload } from "../interactions/interactionPayload";
import { componentKindForType, resolveInteractionPolicy } from "../interactions/interactionPolicy";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";
import { rowsForComponent } from "../interactions/componentInteraction";

export function DashboardRenderer({ components }: { components: DashboardComponent[] }) {
    const context=useRenderContext();const { schema, config } = context;
    const renderChildren = (children: DashboardComponent[]) => <DashboardRenderer components={children} />;
    return <>{components.filter(component => !component.hidden).map((component, index) => {
        const componentId = component.id ?? `${component.type}-${index}`;
        const datasetResult=component.dataset?context.datasets?.get(component.dataset):undefined;
        const sourceIndices=(indices:number[])=>Array.from(new Set(indices.flatMap(index=>datasetResult?.lineage[index]??[]))).sort((a,b)=>a-b);
        const componentContext=datasetResult?{...context,data:datasetResult.data,rows:datasetResult.data.rows,sourceRows:datasetResult.data.rows,sourceRowKeys:datasetResult.data.rowKeys,datasetLineage:datasetResult.lineage,getRowsForComponent:(id:string)=>rowsForComponent(datasetResult.data.rows,datasetResult.data.rowKeys,datasetResult.data.rows,id,{state:context.state}),selectExternal:(indices:number[],multiSelect?:boolean,details?:Parameters<typeof context.selectExternal>[2])=>context.selectExternal(sourceIndices(indices),multiSelect,{...details,matchedRowCount:sourceIndices(indices).length}),reportInteraction:(details:Parameters<typeof context.reportInteraction>[0],reason?:Parameters<typeof context.reportInteraction>[1],indices:number[]=[])=>context.reportInteraction({...details,matchedRowCount:sourceIndices(indices).length},reason,sourceIndices(indices))}:context;
        const rules = schema.styles?.components ?? {};
        const globalRule = rules["*"] ?? {};
        const typeRule = rules[component.type] ?? {};
        const idRule = rules[`#${componentId}`] ?? {};
        const cssMode = config.security?.cssMode ?? "scoped";
        const scoped = scopeComponentCss([globalRule.css, typeRule.css, idRule.css, component.css].filter(Boolean).join("\n"), componentId, cssMode);
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

        const componentClasses = [
            "hp-component",
            `hp-component-${component.type}`,
            showWrapperHighlight ? "hp-interaction-highlight" : "",
            variantClass, sizeClass, disabledClass, tooltipClass,
            classes,
        ].filter(Boolean).join(" ");

        const wrapperRole = !isOverlayOnly && (wrapperAdapter || hasUiAction) ? "button" : undefined;
        const wrapperTabIndex = !isOverlayOnly && (wrapperAdapter || hasUiAction) ? 0 : undefined;

        return <div
            key={componentId}
            data-hp-id={componentId}
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
            style={{ "--hp-span": Math.max(1, Math.min(12, component.span ?? 12)), ...safeStyle }}
        >
            <style>{scoped.css}</style>
            <RenderContext.Provider value={componentContext}>
                <SlotRenderer component={component} name="header" />
                <SlotRenderer component={component} name="subheader" />
                <SlotRenderer component={component} name="actions" />
                <ComponentErrorBoundary id={componentId} type={component.type} dataset={component.dataset} developer={context.settings.debug.showSchemaErrors}><ComponentRegistry component={component} renderChildren={renderChildren} /></ComponentErrorBoundary>
                <SlotRenderer component={component} name="footer" />
            </RenderContext.Provider>
        </div>;
    })}</>;
}
