import type { DataRow } from "../data/normalizeData";
import { useRenderContext } from "../render/RenderContext";
import { renderTemplate } from "../render/renderTemplate";
import { renderTrustedTemplate } from "./trustedTemplate";
import { sanitizeHtml } from "./sanitizeHtml";
import { TrustedDocument } from "./TrustedDocument";

export function AuthoredMarkup({ template, componentId, title, row, props, css }: { template: string; componentId: string; title?: string; row?: DataRow; props?: Record<string, unknown>; css?: string }) {
    const context = useRenderContext();
    const { data, state, schema, config, settings } = context;
    if (!settings.enableHtml) return <div class="hp-empty">HTML blocks are disabled.</div>;
    const scopedData = { ...data, rows: context.getRowsForComponent(componentId) };
    const binding = { row, props, state: state.values, title };
    if (config.security?.htmlMode === "trusted") {
        try { return <TrustedDocument title={title ?? "Trusted HTML"} markup={renderTrustedTemplate(template, scopedData, state.values, title ?? schema.title ?? "", binding)} css={[config.security.cssMode === "trusted" ? `${schema.styles?.globalCss ?? ""}\n${schema.css ?? ""}\n${settings.customCss}` : "", css].filter(Boolean).join("\n")} />; }
        catch (error) { return <div class="hp-component-error" role="alert">Trusted template: {error instanceof Error ? error.message : String(error)}</div>; }
    }
    const safe = sanitizeHtml(renderTemplate(template, scopedData, state.values, title ?? schema.title ?? "", binding), { allowInlineSvg: settings.allowInlineSvg, allowSafeImages: settings.allowSafeImages });
    return <><div dangerouslySetInnerHTML={{ __html: safe.html }} />{config.security?.showSanitizerWarnings && settings.showWarnings && safe.warnings.map(warning => <div class="hp-sanitizer-warning">{warning}</div>)}</>;
}
