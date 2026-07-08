import { DashboardComponent } from "../schema/hyperpbiSchema";
import { ComponentRegistry } from "./ComponentRegistry";
import { scopeComponentCss } from "../components/custom/componentCssScope";
import { SlotRenderer } from "../components/custom/slotRenderer";
import { sanitizeStyleObject } from "../security/sanitizeCss";
import { useRenderContext } from "./RenderContext";
import { executeComponentInteraction } from "../interactions/componentInteraction";
import { deriveBoundPayload } from "../interactions/interactionPayload";
import { componentKindForType, resolveInteractionPolicy } from "../interactions/interactionPolicy";

export function DashboardRenderer({ components }: { components: DashboardComponent[] }) {
    const context=useRenderContext();const { schema, config } = context;
    const renderChildren = (children: DashboardComponent[]) => <DashboardRenderer components={children} />;
    return <>{components.filter(component => !component.hidden).map((component, index) => {
        const componentId = component.id ?? `${component.type}-${index}`; const rules = schema.styles?.components ?? {}; const globalRule = rules["*"] ?? {}; const typeRule = rules[component.type] ?? {}; const idRule = rules[`#${componentId}`] ?? {};
        const cssMode = config.security?.cssMode ?? "scoped";
        const scoped = scopeComponentCss([globalRule.css, typeRule.css, idRule.css, component.css].filter(Boolean).join("\n"), componentId, cssMode);
        const localContainerStyle = component.type === "map" ? undefined : component.style as Record<string,string|number> | undefined;
        const safeStyle = sanitizeStyleObject({ ...globalRule.style, ...typeRule.style, ...idRule.style, ...localContainerStyle }, cssMode);
        const classes = [globalRule.className, typeRule.className, idRule.className, component.className].filter(Boolean).join(" ");
        const kind=componentKindForType(component.type);const policy=resolveInteractionPolicy(component,config,kind);const wrapperAdapter=(kind==="layout"||kind==="content")&&policy.enabled;const run=(event:Event)=>{if(kind==="layout"&&event.target!==event.currentTarget)return;executeComponentInteraction(policy,deriveBoundPayload(component,context.data,context.sourceRows,context.sourceRowKeys),context,{trigger:"click",event});};
        const hasSelection = context.componentRows(componentId).length > 0;
        const showWrapperHighlight = hasSelection && (kind === "layout" || kind === "content" || kind === "navigation");
        const componentClasses = ["hp-component", `hp-component-${component.type}`, showWrapperHighlight ? "hp-interaction-highlight" : "", classes].filter(Boolean).join(" ");
        return <div key={componentId} data-hp-id={componentId} class={componentClasses} role={wrapperAdapter?"button":undefined} tabIndex={wrapperAdapter?0:undefined} onClick={wrapperAdapter?run:undefined} onKeyDown={wrapperAdapter?event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();run(event);}}:undefined} style={{ "--hp-span": Math.max(1, Math.min(12, component.span ?? 12)), ...safeStyle }}><style>{scoped.css}</style><SlotRenderer component={component} name="header" /><SlotRenderer component={component} name="subheader" /><SlotRenderer component={component} name="actions" /><ComponentRegistry component={component} renderChildren={renderChildren} /><SlotRenderer component={component} name="footer" /></div>;
    })}</>;
}
