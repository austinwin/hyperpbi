import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { MermaidDiagramComponent, MermaidNodeBinding } from "../../schema/mermaidDiagramSchema";
import { useRenderContext } from "../../render/RenderContext";
import { PanZoomViewport } from "../svg/PanZoomViewport";
import { createSvgNamespace } from "../svg/svgIdIsolation";
import { Card } from "../layout/LayoutBlocks";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { renderMermaidSource, type CompiledMermaidSvg } from "./mermaidRuntime";

const same = (left: unknown, right: unknown): boolean => left === right || String(left ?? "") === String(right ?? "");

export function MermaidBlock({ component }: { component: MermaidDiagramComponent }) {
    const context = useRenderContext();
    const hostRef = useRef<HTMLDivElement>(null);
    const [compiled, setCompiled] = useState<CompiledMermaidSvg | undefined>();
    const [error, setError] = useState<string>();
    const componentId = component.id ?? "mermaid";
    const namespace = createSvgNamespace(context.instanceId ?? "visual", componentId);
    const bindings = useMemo(() => new Map((component.nodeBindings ?? []).map(binding => [binding.nodeId, binding] as const)), [component.nodeBindings]);
    const resolvedTheme = component.theme === "auto" || !component.theme
        ? context.settings.theme.mode === "dark" ? "dark" : "default"
        : component.theme;

    useEffect(() => {
        let cancelled = false;
        setError(undefined);
        renderMermaidSource({ source: component.source, renderId: `${namespace}-render`, namespace, theme: resolvedTheme, nodeIds: Array.from(bindings.keys()), cssScope: `[data-hp-mermaid="${namespace}"]` })
            .then(result => { if (!cancelled) setCompiled(result); })
            .catch(reason => { if (!cancelled) { setCompiled(undefined); setError(reason instanceof Error ? reason.message : String(reason)); } });
        return () => { cancelled = true; };
    }, [component.source, resolvedTheme, namespace, bindings]);

    const matchingRows = (binding: MermaidNodeBinding): number[] => {
        const value = binding.value ?? context.rows.find(row => row[binding.field] != null)?.[binding.field];
        return context.rows.map((row, index) => same(row[binding.field], value) ? index : -1).filter(index => index >= 0);
    };
    const activate = (binding: MermaidNodeBinding, event: Event) => {
        const interaction = { ...component.interaction, ...binding.interaction, field: binding.interaction?.field ?? binding.field };
        const interactive = { ...component, interaction };
        executeComponentInteraction(resolveInteractionPolicy(interactive, context.config, "dataPoint"), createInteractionPayload(interactive, {
            rowIndices: matchingRows(binding), sourceRowKeys: context.sourceRowKeys,
            field: binding.field, value: binding.value,
        }), context, { trigger: "click", multiSelect: event instanceof MouseEvent && (event.ctrlKey || event.metaKey), event });
    };

    useEffect(() => {
        const host = hostRef.current;
        if (!host || !compiled?.svg) return;
        const cleanups: Array<() => void> = [];
        for (const element of Array.from(host.querySelectorAll<SVGElement>("[data-hp-mermaid-node]"))) {
            const nodeId = element.getAttribute("data-hp-mermaid-node") ?? "";
            const binding = bindings.get(nodeId);
            if (!binding) continue;
            element.setAttribute("tabindex", "0"); element.setAttribute("role", "button");
            element.setAttribute("aria-label", binding.label ?? nodeId);
            const click = (event: Event) => activate(binding, event);
            const keydown = (event: Event) => { const keyboard = event as KeyboardEvent; if (keyboard.key === "Enter" || keyboard.key === " ") { keyboard.preventDefault(); activate(binding, event); } };
            element.addEventListener("click", click); element.addEventListener("keydown", keydown);
            cleanups.push(() => { element.removeEventListener("click", click); element.removeEventListener("keydown", keydown); });
        }
        return () => cleanups.forEach(cleanup => cleanup());
    }, [compiled?.svg, component.panZoom, bindings, context.rows, context.sourceRowKeys, component.interaction]);

    useEffect(() => {
        const host = hostRef.current; if (!host) return;
        const selected = new Set(context.state.componentSelectedRows[componentId] ?? []);
        host.querySelectorAll<SVGElement>("[data-hp-mermaid-node]").forEach(element => {
            const binding = bindings.get(element.getAttribute("data-hp-mermaid-node") ?? "");
            element.classList.toggle("is-hp-selected", Boolean(binding && matchingRows(binding).some(index => selected.has(index))));
        });
    }, [compiled?.svg, component.panZoom, context.state.componentSelectedRows, context.rows, bindings, componentId]);

    const diagram = error ? <div class="hp-component-error" role="alert"><strong>Mermaid diagram could not be rendered.</strong><div>{error}</div></div>
        : !compiled ? <div class="hp-mermaid-loading" role="status">Rendering diagram…</div>
        : !compiled.svg ? <div class="hp-component-error" role="alert">Mermaid SVG was blocked by the HyperPBI sanitizer.</div>
        : <div class={`hp-mermaid-viewport hp-mermaid-fit-${component.fit ?? "contain"}`} ref={hostRef} data-hp-mermaid={namespace}>
            <style>{compiled.css}</style>
            <style>{`[data-hp-mermaid="${namespace}"] [data-hp-mermaid-node]{cursor:pointer}[data-hp-mermaid="${namespace}"] [data-hp-mermaid-node]:focus{outline:none;filter:drop-shadow(0 0 3px var(--hp-primary))}[data-hp-mermaid="${namespace}"] [data-hp-mermaid-node].is-hp-selected{filter:drop-shadow(0 0 5px var(--hp-primary))}`}</style>
            {component.panZoom ? <PanZoomViewport contentClass="hp-mermaid-transform" markup={compiled.svg} resetKey={compiled}
                minScale={.35} dragExclusion="[data-hp-mermaid-node]" fitOnly />
                : <div class="hp-mermaid-transform" dangerouslySetInnerHTML={{ __html: compiled.svg }} />}
        </div>;
    return component.frameless ? <div class="hp-mermaid-frameless">{diagram}</div> : <Card title={component.title}>{diagram}</Card>;
}
