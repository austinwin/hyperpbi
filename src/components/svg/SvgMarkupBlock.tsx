import { h } from "preact";
import { TrustedDocument } from "../../security/TrustedDocument";
import { renderTrustedTemplate } from "../../security/trustedTemplate";
import { useMemo } from "preact/hooks";
import type { NormalizedData } from "../../data/normalizeData";
import { rowsForComponent } from "../../interactions/componentInteraction";
import { useRenderContext } from "../../render/RenderContext";
import type { SvgMarkupComponent } from "../../schema/hyperpbiSchema";
import { sanitizeCss } from "../../security/sanitizeCss";
import { resolveSvgMarkupTemplates, sanitizeSvg, type SanitizedSvg } from "../../security/sanitizeSvg";
import { resolveSvgDataContextRow } from "./svgBindings";
import { createSvgNamespace, rewriteSvgCssReferences } from "./svgIdIsolation";
import { SVG_LIMITS, type SvgMarkupBinding } from "./svgTypes";

export function SvgMarkupBlock({ component }: { component: SvgMarkupComponent }) {
    const { instanceId } = useRenderContext();
    const namespace = createSvgNamespace(instanceId ?? "visual", component.id ?? "svg-markup");
    return component.svgBinding?.mode === "data"
        ? <BoundSvgMarkup component={component} binding={component.svgBinding} namespace={namespace} />
        : <StaticSvgMarkup component={component} namespace={namespace} />;
}

function StaticSvgMarkup({ component, namespace }: { component: SvgMarkupComponent; namespace: string }) {
    const context = useRenderContext();
    const warnings: string[] = [];
    const row = resolveSvgDataContextRow(component.dataContext, context.rows, context.sourceRowKeys, context.state.selectedRowKeys, warnings);
    const svg = component.svg ?? "";
    const trusted = context.config.security?.svgMode === "trusted";
    const compiled = useMemo(() => {
        if (trusted) return;
        const sanitized = sanitizeSvg(resolveSvgMarkupTemplates(svg, { row, rows: context.rows, state: context.state, warnings }), namespace);
        return { ...sanitized, warnings: [...warnings, ...sanitized.warnings] };
    }, [svg, trusted, row, component.dataContext, namespace, context.rows, context.state]);
    if (trusted) {
        try { return <TrustedDocument title={component.ariaLabel ?? component.title ?? "Trusted SVG"} markup={renderTrustedTemplate(svg, context.data, context.state.values, component.title ?? "", { row, state: context.state.values })} css={component.css} />; }
        catch (error) { return <div role="alert" class="hp-component-error">Trusted SVG: {error instanceof Error ? error.message : String(error)}</div>; }
    }
    if (!compiled?.svg) return <div class="hp-component-error" role="alert">Raw SVG was blocked by the HyperPBI sanitizer.</div>;
    return <SvgMarkupFrame component={component} namespace={namespace} compiled={compiled} />;
}

function resolveBoundMarkup(data: Pick<NormalizedData, "fields" | "rows"> | undefined, dataset: string, keyField: string, svgField: string) {
    if (!data) return { error: `Schematic dataset “${dataset}” is unavailable.` };
    for (const field of [keyField, svgField]) {
        if (!Object.hasOwn(data.fields, field)) return { error: `Add the “${field}” field to the schematic dataset.` };
    }
    const type = data.fields[svgField].dataType;
    if (type && type !== "text" && type !== "unknown") return { error: `Schematic field “${svgField}” must be a text column.` };

    let facility: string | number | boolean | undefined;
    let source: string | undefined;
    let conflict = false, nonText = false;
    for (const row of data.rows) {
        const key = row[keyField];
        if (typeof key !== "string" && typeof key !== "number" && typeof key !== "boolean") continue;
        if (typeof key === "string" && !key.trim() || typeof key === "number" && !Number.isFinite(key)) continue;
        if (facility !== undefined && facility !== key) return {};
        facility = key;
        const value = row[svgField];
        if (value == null) continue;
        if (typeof value !== "string") { nonText = true; continue; }
        if (value === source || (value.length <= SVG_LIMITS.maxMarkupLength && !value.trim())) continue;
        if (source !== undefined) conflict = true;
        else source = value;
    }
    if (facility === undefined) return {};
    if (conflict) return { error: "Multiple different schematics are available for this facility." };
    if (nonText) return { error: "The selected facility’s schematic must be SVG text." };
    if (source === undefined) return { error: "No SVG schematic is available for the selected facility." };
    return { source };
}

function BoundSvgMarkup({ component, binding, namespace }: { component: SvgMarkupComponent; binding: SvgMarkupBinding; namespace: string }) {
    const context = useRenderContext();
    const dataset = binding.dataset ?? component.dataset ?? "powerbi";
    const result = context.datasets?.get(dataset);
    const { keyField, svgField } = binding;
    const id = component.id ?? component.type;
    const state = context.state;
    const rootRowKeys = result?.rootRowKeys ?? context.powerBiSourceRowKeys ?? context.sourceRowKeys;
    const { source, error } = useMemo(() => {
        const data = result?.data;
        const rows = data && result && state.interactionFilters.length ? rowsForComponent(data.rows, data.rowKeys, data.rows, id, {
            state, datasetLineage: result.lineage, powerBiSourceRowKeys: rootRowKeys,
        }) : data?.rows;
        return resolveBoundMarkup(data && rows ? { fields: data.fields, rows } : undefined, dataset, keyField, svgField);
    }, [result, rootRowKeys, state, id, dataset, keyField, svgField]);

    const maxElements = component.performance?.maxElements ?? SVG_LIMITS.maxElementsPerComponent;
    const maxAnimations = Math.min(
        component.performance?.maxAnimatedElements ?? SVG_LIMITS.maxAnimatedPerComponent,
        component.motion?.maxConcurrentAnimations ?? context.config.motion?.maxConcurrentAnimations ?? 12,
    );
    const compiled = useMemo(() => source === undefined ? undefined : sanitizeSvg(source, namespace, {
        bound: { maxElements, maxAnimations },
    }), [source, namespace, maxElements, maxAnimations]);
    const motion = component.motion?.enabled !== false && context.config.motion?.enabled !== false &&
        (component.motion?.reducedMotion ?? context.config.motion?.reducedMotion) !== "always-reduce";

    if (compiled?.svg) return <SvgMarkupFrame component={component} namespace={namespace} compiled={compiled} bound motion={motion} />;
    const problem = error ?? compiled?.warnings[0];
    return <div class={problem ? "hp-component-error" : "hp-svg-bound-placeholder"} role={problem ? "alert" : "status"}>
        {compiled ? `Unable to display the selected SVG schematic. ${problem ?? ""}` : problem ?? "Select one facility to view its process schematic."}
    </div>;
}

function SvgMarkupFrame({ component, namespace, compiled, bound = false, motion = false }: {
    component: SvgMarkupComponent; namespace: string; compiled: SanitizedSvg; bound?: boolean; motion?: boolean;
}) {
    const context = useRenderContext();
    const cssMode = context.config.security?.cssMode;
    const css = useMemo(() => sanitizeCss(rewriteSvgCssReferences(component.css ?? "", compiled.idMap),
        `[data-hp-svg="${namespace}"]`, { mode: cssMode, keyframeNamespace: namespace, allowLocalSvgReferences: true }),
    [component.css, compiled.idMap, namespace, cssMode]);
    const warnings = [...compiled.warnings, ...css.warnings];
    const height = typeof component.height === "number" && component.height > 0 ? component.height : undefined;
    const layoutHeight = component.heightMode === "fill" || component.heightMode === "aspectRatio";
    const boundHeight = bound ? layoutHeight ? "100%" : height : undefined;
    return <div class={`hp-svg-block hp-svg-markup${bound ? " hp-svg-bound" : ""}${boundHeight ? " hp-svg-bound-sized" : ""}`}
        style={boundHeight ? { height: boundHeight } : undefined} data-hp-svg={namespace} role={component.role ?? "img"} aria-label={component.ariaLabel}>
        {component.title ? <div class="hp-svg-heading">{component.title}</div> : null}
        <style>{css.css}{motion && compiled.motionCss ? `@media (prefers-reduced-motion: no-preference){${compiled.motionCss}}` : ""}</style>
        <div class="hp-svg-markup-host" dangerouslySetInnerHTML={{ __html: compiled.svg }} />
        {context.settings.debug.showPerformance ? <div class="hp-svg-diagnostics">SVG: {compiled.elementCount} elements · {compiled.pathCount} paths · {warnings.length} warnings</div> : null}
        {context.settings.debug.showSchemaErrors && warnings.length ? <details class="hp-debug"><summary>SVG sanitizer diagnostics ({warnings.length})</summary><ul>{Array.from(new Set(warnings)).map(item => <li>{item}</li>)}</ul></details> : null}
    </div>;
}
