import { ContentComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
import { sanitizeHtml } from "../../security/sanitizeHtml";

export function HtmlBlock({ component }: { component: ContentComponent }) {
    const { data, schema, state, settings } = useRenderContext();
    if (!settings.enableHtml) return <div class="hp-empty">HTML blocks are disabled.</div>;
    const rendered = renderTemplate(component.html ?? "", data, state.values, schema.title ?? "");
    const sanitized = sanitizeHtml(rendered, { allowInlineSvg: settings.allowInlineSvg, allowSafeImages: settings.allowSafeImages });
    return <div class="hp-html-block"><div dangerouslySetInnerHTML={{ __html: sanitized.html }} />{settings.showWarnings && sanitized.warnings.map(warning => <div class="hp-sanitizer-warning">{warning}</div>)}</div>;
}
