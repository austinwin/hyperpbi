import { ComponentChildren, h } from "preact";
import type { DataRow } from "../../data/normalizeData";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import type { RenderContextValue } from "../../render/RenderContext";
import type { SvgComponent } from "../../schema/hyperpbiSchema";
import type { SvgBindingContext } from "./svgBindings";
import { compileSvgPosition, resolveSvgValue } from "./svgBindings";
import { compileSvgAnimation } from "./svgAnimationCompiler";
import { collectSvgLocalIds, createSvgNamespace, rewriteSvgLocalReference, safeSvgIdentifier } from "./svgIdIsolation";
import { isSafeSvgTransform } from "./svgSchema";
import { SVG_LIMITS, SvgElementDefinition } from "./svgTypes";

const special = new Set(["type", "id", "className", "ariaLabel", "hidden", "position", "interaction", "uiAction", "animation", "repeat", "children", "text"]);
const references = new Set(["fill", "stroke", "clipPath", "mask", "filter", "markerStart", "markerMid", "markerEnd"]);
const shortHash = (value: string): string => { let hash = 2166136261; for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619); return (hash >>> 0).toString(36); };
export interface SvgRenderBudget { elements: number; animated: number; paths: number; repeats: number; css: string[]; warnings: string[]; reduced: boolean; maxAnimated: number; maxElements: number; maxRepeatedRows: number; }
interface Props { element: SvgElementDefinition; component: SvgComponent; context: RenderContextValue; binding: SvgBindingContext; ids: Map<string, string>; namespace: string; budget: SvgRenderBudget; rowIndex?: number; repeatKey?: string | number; }

export function SvgElementRenderer({ element, component, context, binding, ids, namespace, budget, rowIndex, repeatKey }: Props): ComponentChildren {
    if (element.repeat) {
        budget.repeats++;
        const dataset = element.repeat.dataset ? context.datasets?.get(element.repeat.dataset) : undefined;
        const rows = dataset?.data.rows ?? context.rows, keys = dataset?.data.rowKeys ?? context.sourceRowKeys, limit = Math.min(element.repeat.limit ?? SVG_LIMITS.defaultRepeatRows, budget.maxRepeatedRows, SVG_LIMITS.maxRepeatRows, rows.length);
        return rows.slice(0, limit).map((row, index) => {
            const key = element.repeat!.keyField && row[element.repeat!.keyField!] != null ? String(row[element.repeat!.keyField!]!) : keys[index] ?? index;
            const repeatNamespace = createSvgNamespace(context.instanceId ?? "visual", component.id ?? "svg", key), repeatIds = new Map(ids);
            for (const id of collectSvgLocalIds(element.repeat!.children)) repeatIds.set(id, `${repeatNamespace}-${safeSvgIdentifier(id)}`);
            const repeatContext = dataset ? { ...context, data: dataset.data, rows, sourceRows: rows, sourceRowKeys: keys, datasetLineage: dataset.lineage, selectExternal: (indices: number[], multi?: boolean, details?: Parameters<RenderContextValue["selectExternal"]>[2]) => { const source = Array.from(new Set(indices.flatMap(item => dataset.lineage[item] ?? []))); return (context.selectSourceRows ?? context.selectExternal)(source, multi, { ...details, matchedRowCount: source.length }); } } : context;
            const childBinding: SvgBindingContext = { row, rows, state: context.state, index, count: limit, warnings: budget.warnings };
            return h("g", { key: String(key), "data-hp-repeat-key": String(key) }, element.repeat!.children.map(child => SvgElementRenderer({ element: child, component, context: repeatContext, binding: childBinding, ids: repeatIds, namespace: repeatNamespace, budget, rowIndex: index, repeatKey: key })));
        });
    }
    budget.elements++; if (budget.elements > budget.maxElements) throw new Error(`SVG generated more than ${budget.maxElements} elements.`);
    if (element.type === "path") budget.paths++;
    const props: Record<string, unknown> = {};
    const source = element as unknown as Record<string, unknown>;
    for (const [key, raw] of Object.entries(source)) {
        if (special.has(key) || raw === undefined) continue;
        let value = resolveSvgValue(raw as never, binding); if (value === undefined || value === null) continue;
        if (references.has(key) && typeof value === "string" && (value.startsWith("#") || value.includes("url("))) value = rewriteSvgLocalReference(value, ids);
        if (key === "transform" && typeof value === "string" && !isSafeSvgTransform(value)) { budget.warnings.push("Blocked unsafe SVG transform."); continue; }
        props[key] = value;
    }
    if (element.id) props.id = ids.get(element.id) ?? `${namespace}-${safeSvgIdentifier(element.id)}`;
    const position = compileSvgPosition(element.position, binding); if (position) props.transform = [props.transform, position].filter(Boolean).join(" ");
    if (resolveSvgValue(element.hidden, binding) === true) props.visibility = "hidden";
    let className = element.className ?? "";
    if (element.animation) {
        const selected = rowIndex === undefined ? context.componentRows(component.id ?? "svg").length > 0 : context.componentRows(component.id ?? "svg").includes(rowIndex);
        const stateActive = element.animation.trigger !== "state" || String(context.state.values[element.animation.stateKey ?? ""]) === String(element.animation.stateValue);
        const triggerActive = element.animation.trigger !== "selected" || selected;
        const disabled = budget.reduced || !stateActive || !triggerActive || budget.animated >= budget.maxAnimated;
        const animationKey = `${element.id ?? `${element.type}-${budget.elements}`}${element.animation.trigger === "dataChange" ? `-${shortHash(JSON.stringify(binding.row))}` : ""}`;
        const compiled = compileSvgAnimation(element.animation, element.type, namespace, animationKey, disabled);
        className = [className, compiled.className].filter(Boolean).join(" "); if (compiled.css) budget.css.push(compiled.css); if (compiled.warning) budget.warnings.push(compiled.warning); if (!disabled) budget.animated++;
    }
    if (className) props.class = className;
    const componentInteractive = component.interaction?.enabled && !["defs", "linearGradient", "radialGradient", "stop", "clipPath", "mask", "marker", "title", "desc"].includes(element.type);
    const interactive = Boolean(element.interaction || element.uiAction || componentInteractive);
    if (interactive) {
        props.tabindex = 0; props.role = "button"; props["aria-label"] = element.ariaLabel ?? element.id ?? `${component.title ?? "SVG"} ${element.type}`; props.class = `${String(props.class ?? "")} hp-svg-interactive`.trim();
        const activate = (event: Event) => { const synthetic = { ...component, interaction: { ...component.interaction, ...element.interaction } } as SvgComponent; if (element.interaction || component.interaction) { const policy = resolveInteractionPolicy(synthetic, context.config, "custom"); const field = synthetic.interaction?.field; const rowIndices = rowIndex === undefined ? context.sourceRows.map((_row, index) => index) : [rowIndex]; executeComponentInteraction(policy, createInteractionPayload(synthetic, { rowIndices, sourceRowKeys: context.sourceRowKeys, field, value: field ? binding.row[field] : undefined }), context, { trigger: "click", event, multiSelect: (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey }); } if (element.uiAction) context.executeUiAction(element.uiAction, event); };
        props.onClick = activate; props.onKeyDown = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(event); } };
    } else if (element.ariaLabel) props["aria-label"] = element.ariaLabel;
    const children: ComponentChildren[] = []; const text = resolveSvgValue("text" in element ? element.text : undefined, binding); if (text !== undefined && text !== null) children.push(String(text)); if (element.children) children.push(...element.children.map(child => SvgElementRenderer({ element: child, component, context, binding, ids, namespace, budget, rowIndex, repeatKey })));
    return h(element.type, props, children);
}
