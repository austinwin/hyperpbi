import { ComponentBase } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
import { sanitizeHtml } from "../../security/sanitizeHtml";
import { DataRow } from "../../data/normalizeData";

export function SlotRenderer({ component, name, row }: { component: ComponentBase; name: keyof NonNullable<ComponentBase["slots"]>; row?: DataRow }) {
    const { data, state, schema, settings, config } = useRenderContext(); const template = component.slots?.[name]; if (!template) return null;
    const rendered = renderTemplate(template, data, state.values, component.title ?? schema.title ?? "", { row, props: component.props, state: state.values, title: component.title });
    const safe = sanitizeHtml(rendered, { allowInlineSvg: settings.allowInlineSvg, allowSafeImages: settings.allowSafeImages, mode: config.security?.htmlMode });
    return <div class={`hp-slot hp-slot-${name}`} dangerouslySetInnerHTML={{ __html: safe.html }} />;
}
