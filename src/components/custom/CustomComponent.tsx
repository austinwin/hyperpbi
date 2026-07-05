import { ContentComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
import { sanitizeHtml } from "../../security/sanitizeHtml";
import { runSafeInteraction } from "./customInteractionResolver";
import { validateCustomComponent } from "./customComponentSchema";

export function CustomComponent({ component }: { component: ContentComponent }) {
    const context = useRenderContext(); const { data, state, schema, settings } = context; const errors = validateCustomComponent(component);
    if (errors.length) return <div class="hp-custom-error">{errors.join(" ")}</div>;
    const render = (template: string, row?: typeof data.rows[number]) => sanitizeHtml(renderTemplate(template, data, state.values, component.title ?? schema.title ?? "", { row, props: component.props, state: state.values, title: component.title }), { allowInlineSvg: settings.allowInlineSvg, allowSafeImages: settings.allowSafeImages }).html;
    const repeated = component.repeat ? data.rows.slice(0, Math.min(100, Math.max(0, component.repeat.limit ?? 10))).map(row => render(component.repeat?.template ?? "", row)).join("") : "";
    const html = render(component.html ?? "") + repeated; const click = component.interactions?.onClick;
    return <div class="hp-custom" role={click ? "button" : undefined} tabIndex={click ? 0 : undefined} onClick={() => runSafeInteraction(click, context)} onKeyDown={event => { if (click && (event.key === "Enter" || event.key === " ")) runSafeInteraction(click, context); }}>
        <div class="hp-custom-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>;
}
