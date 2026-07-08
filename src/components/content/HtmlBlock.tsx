import { ContentComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
import { sanitizeHtml } from "../../security/sanitizeHtml";

export function HtmlBlock({ component }: { component: ContentComponent }) {
    const context=useRenderContext();const { data, schema, state, settings, config } = context;const scopedData={...data,rows:context.getRowsForComponent(component.id??component.type)};
    if (!settings.enableHtml) return <div class="hp-empty">HTML blocks are disabled.</div>;
    const rendered = renderTemplate(component.html ?? "", scopedData, state.values, schema.title ?? "");
    const sanitized = sanitizeHtml(rendered, { allowInlineSvg: settings.allowInlineSvg, allowSafeImages: settings.allowSafeImages, mode: config.security?.htmlMode });
    return <div class="hp-html-block"><div dangerouslySetInnerHTML={{ __html: sanitized.html }} />{config.security?.showSanitizerWarnings === true && settings.showWarnings && sanitized.warnings.map(warning => <div class="hp-sanitizer-warning">{warning}</div>)}</div>;
}
