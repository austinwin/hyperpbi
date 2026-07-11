import { h } from "preact";
import { useMemo } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import type { SvgMarkupComponent } from "../../schema/hyperpbiSchema";
import { sanitizeCss } from "../../security/sanitizeCss";
import { resolveSvgMarkupTemplates, sanitizeSvg } from "../../security/sanitizeSvg";
import { resolveSvgDataContextRow } from "./svgBindings";
import { createSvgNamespace, rewriteSvgCssReferences, safeSvgIdentifier } from "./svgIdIsolation";

export function SvgMarkupBlock({ component }: { component: SvgMarkupComponent }) {
    const context = useRenderContext(), namespace = createSvgNamespace(context.instanceId ?? "visual", component.id ?? "svg-markup"), bindingWarnings: string[] = [], row = resolveSvgDataContextRow(component.dataContext, context.rows, context.sourceRowKeys, context.state.selectedRowKeys, bindingWarnings), binding = { row, rows: context.rows, state: context.state, warnings: bindingWarnings };
    const compiled = useMemo(() => { const templated = resolveSvgMarkupTemplates(component.svg, binding), sanitized = sanitizeSvg(templated, namespace); const ids = new Map<string, string>(); for (const match of templated.matchAll(/\bid\s*=\s*["']([A-Za-z_][\w:.-]*)["']/g)) ids.set(match[1], `${namespace}-${safeSvgIdentifier(match[1])}`); const css = sanitizeCss(rewriteSvgCssReferences(component.css ?? "", ids), `[data-hp-svg="${namespace}"]`, { mode: context.config.security?.cssMode, keyframeNamespace: namespace, allowLocalSvgReferences: true }); return { ...sanitized, css: css.css, warnings: [...binding.warnings, ...sanitized.warnings, ...css.warnings] }; }, [component.svg, component.css, namespace, context.rows, context.state, context.config.security?.cssMode]);
    if (!compiled.svg) return <div class="hp-component-error" role="alert">Raw SVG was blocked by the HyperPBI sanitizer.</div>;
    return <div class="hp-svg-block hp-svg-markup" data-hp-svg={namespace} role={component.role ?? "img"} aria-label={component.ariaLabel}>
        {component.title ? <div class="hp-svg-heading">{component.title}</div> : null}<style>{compiled.css}</style><div class="hp-svg-markup-host" dangerouslySetInnerHTML={{ __html: compiled.svg }} />
        {context.settings.debug.showPerformance ? <div class="hp-svg-diagnostics">SVG: {compiled.elementCount} elements · {compiled.pathCount} paths · {compiled.warnings.length} warnings</div> : null}
        {context.settings.debug.showSchemaErrors && compiled.warnings.length ? <details class="hp-debug"><summary>SVG sanitizer diagnostics ({compiled.warnings.length})</summary><ul>{Array.from(new Set(compiled.warnings)).map(item => <li>{item}</li>)}</ul></details> : null}
    </div>;
}
