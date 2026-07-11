import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useRenderContext } from "../../render/RenderContext";
import type { SvgComponent } from "../../schema/hyperpbiSchema";
import { sanitizeCss } from "../../security/sanitizeCss";
import { resolveSvgDataContextRow } from "./svgBindings";
import { createSvgIdMap, createSvgNamespace, rewriteSvgCssReferences } from "./svgIdIsolation";
import { SVG_LIMITS } from "./svgTypes";
import { SvgElementRenderer, SvgRenderBudget } from "./SvgElementRenderer";

export function SvgBlock({ component }: { component: SvgComponent }) {
    const compileStarted = globalThis.performance?.now?.() ?? Date.now();
    const context = useRenderContext(), host = useRef<HTMLDivElement>(null), [offscreen, setOffscreen] = useState(false);
    const namespace = createSvgNamespace(context.instanceId ?? "visual", component.id ?? "svg"), ids = useMemo(() => createSvgIdMap(component.elements, namespace), [component.elements, namespace]);
    const warnings: string[] = [], row = resolveSvgDataContextRow(component.dataContext, context.rows, context.sourceRowKeys, context.state.selectedRowKeys, warnings);
    const reducedMode = component.motion?.reducedMotion ?? context.config.motion?.reducedMotion ?? "respect-system"; const systemReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true; const reduced = component.motion?.enabled === false || context.config.motion?.enabled === false || reducedMode === "always-reduce" || reducedMode === "respect-system" && systemReduced;
    const budget: SvgRenderBudget = { elements: 0, animated: 0, paths: 0, repeats: 0, css: [], warnings, reduced, maxAnimated: Math.min(component.performance?.maxAnimatedElements ?? SVG_LIMITS.maxAnimatedPerComponent, component.motion?.maxConcurrentAnimations ?? context.config.motion?.maxConcurrentAnimations ?? 12, SVG_LIMITS.maxAnimatedPerComponent), maxElements: Math.min(component.performance?.maxElements ?? SVG_LIMITS.maxElementsPerComponent, SVG_LIMITS.maxElementsPerComponent), maxRepeatedRows: Math.min(component.performance?.maxRepeatedRows ?? SVG_LIMITS.maxRepeatRows, SVG_LIMITS.maxRepeatRows) };
    const binding = { row, rows: context.rows, state: context.state, warnings };
    const content = component.elements.map(element => SvgElementRenderer({ element, component, context, binding, ids, namespace, budget }));
    const ownCss = sanitizeCss(rewriteSvgCssReferences(component.css ?? "", ids), `[data-hp-svg="${namespace}"]`, { mode: context.config.security?.cssMode, keyframeNamespace: namespace, allowLocalSvgReferences: true }); warnings.push(...ownCss.warnings);
    useEffect(() => { const node = host.current; if (!node || typeof IntersectionObserver === "undefined") return; const observer = new IntersectionObserver(entries => setOffscreen(!entries[0]?.isIntersecting), { rootMargin: "50px" }); observer.observe(node); return () => observer.disconnect(); }, []);
    const compileMs = (globalThis.performance?.now?.() ?? Date.now()) - compileStarted;
    const titleId = `${namespace}-title`, descId = `${namespace}-desc`, role = component.role ?? (budget.animated || component.elements.some(element => Boolean(element.interaction || element.uiAction)) ? "group" : "img");
    return <div ref={host} class={`hp-svg-block ${offscreen ? "hp-svg-paused" : ""}`} data-hp-svg={namespace}>
        {component.title ? <div class="hp-svg-heading">{component.title}</div> : null}
        <style>{`${ownCss.css}\n${budget.css.join("\n")}`}</style>
        <svg viewBox={component.viewBox} width={component.width ?? "100%"} height={component.height ?? "auto"} preserveAspectRatio={component.preserveAspectRatio ?? "xMidYMid meet"} role={role} aria-label={component.ariaLabel} aria-labelledby={component.title ? titleId : undefined} aria-describedby={component.description ? descId : undefined}>
            {component.title ? <title id={titleId}>{component.title}</title> : null}{component.description ? <desc id={descId}>{component.description}</desc> : null}{content}
        </svg>
        {context.settings.debug.showPerformance ? <div class="hp-svg-diagnostics">SVG: {budget.elements} elements · {budget.animated} animated · {budget.paths} paths · {budget.repeats} repeats · {compileMs.toFixed(1)} ms compile · {warnings.length} warnings</div> : null}
        {context.settings.debug.showSchemaErrors && warnings.length ? <details class="hp-debug"><summary>SVG diagnostics ({warnings.length})</summary><ul>{Array.from(new Set(warnings)).map(item => <li>{item}</li>)}</ul></details> : null}
    </div>;
}
