import { DashboardComponent } from "../schema/hyperpbiSchema";
import { ComponentRegistry } from "./ComponentRegistry";
import { scopeComponentCss } from "../components/custom/componentCssScope";
import { SlotRenderer } from "../components/custom/slotRenderer";
import { sanitizeStyleObject } from "../security/sanitizeCss";
import { useRenderContext } from "./RenderContext";

export function DashboardRenderer({ components }: { components: DashboardComponent[] }) {
    const { schema, config } = useRenderContext();
    const renderChildren = (children: DashboardComponent[]) => <DashboardRenderer components={children} />;
    return <>{components.filter(component => !component.hidden).map((component, index) => {
        const componentId = component.id ?? `${component.type}-${index}`; const rules = schema.styles?.components ?? {}; const globalRule = rules["*"] ?? {}; const typeRule = rules[component.type] ?? {}; const idRule = rules[`#${componentId}`] ?? {};
        const cssMode = config.security?.cssMode ?? "scoped";
        const scoped = scopeComponentCss([globalRule.css, typeRule.css, idRule.css, component.css].filter(Boolean).join("\n"), componentId, cssMode);
        const localContainerStyle = component.type === "map" ? undefined : component.style as Record<string,string|number> | undefined;
        const safeStyle = sanitizeStyleObject({ ...globalRule.style, ...typeRule.style, ...idRule.style, ...localContainerStyle }, cssMode);
        const classes = [globalRule.className, typeRule.className, idRule.className, component.className].filter(Boolean).join(" ");
        return <div key={componentId} data-hp-id={componentId} class={`hp-component hp-component-${component.type} ${classes}`} style={{ "--hp-span": Math.max(1, Math.min(12, component.span ?? 12)), ...safeStyle }}><style>{scoped.css}</style><SlotRenderer component={component} name="header" /><SlotRenderer component={component} name="subheader" /><SlotRenderer component={component} name="actions" /><ComponentRegistry component={component} renderChildren={renderChildren} /><SlotRenderer component={component} name="footer" /></div>;
    })}</>;
}
