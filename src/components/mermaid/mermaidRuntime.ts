import { sanitizeCss } from "../../security/sanitizeCss";
import { sanitizeSvg, type SanitizedSvg } from "../../security/sanitizeSvg";

export interface CompiledMermaidSvg extends SanitizedSvg { css: string; boundNodeIds: string[]; }
let renderQueue: Promise<unknown> = Promise.resolve();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function annotateMermaidNodes(svg: string, logicalNodeIds: readonly string[]): { svg: string; boundNodeIds: string[] } {
    const document = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = document.documentElement;
    const elements = Array.from(root.querySelectorAll("*"));
    const boundNodeIds: string[] = [];
    for (const nodeId of logicalNodeIds) {
        const candidates = elements.filter(element => {
            const id = element.getAttribute("id") ?? "";
            return element.getAttribute("data-id") === nodeId || id === nodeId ||
                ["flowchart", "state", "class", "entity"].some(kind =>
                    id.startsWith(`${kind}-${nodeId}-`) || id.includes(`-${kind}-${nodeId}-`));
        });
        const target = candidates.find(element => element.classList.contains("node") || element.localName.toLowerCase() === "g") ?? candidates[0];
        if (!target) continue;
        target.setAttribute("data-hp-mermaid-node", nodeId);
        boundNodeIds.push(nodeId);
    }
    return { svg: new XMLSerializer().serializeToString(root), boundNodeIds };
}

function extractCss(svg: string): { svg: string; css: string } {
    const document = new DOMParser().parseFromString(svg, "image/svg+xml");
    const styles = Array.from(document.querySelectorAll("style"));
    const css = styles.map(style => style.textContent ?? "").join("\n");
    styles.forEach(style => style.remove());
    return { svg: new XMLSerializer().serializeToString(document.documentElement), css };
}

function rewriteCssIds(css: string, ids: Map<string, string>): string {
    let result = css;
    for (const [original, namespaced] of ids) result = result.replace(new RegExp(`#${escapeRegExp(original)}(?=[^A-Za-z0-9_.:-]|$)`, "g"), `#${namespaced}`);
    return result.replace(/url\(\s*#([A-Za-z_][\w:.-]*)\s*\)/g, (_match, id: string) => `url(#${ids.get(id) ?? `__hp_unknown_${id.replace(/[^A-Za-z0-9_-]/g, "-")}`})`);
}

export async function renderMermaidSource(options: {
    source: string;
    renderId: string;
    namespace: string;
    theme: "default" | "neutral" | "dark" | "forest" | "base";
    nodeIds: readonly string[];
    cssScope: string;
}): Promise<CompiledMermaidSvg> {
    const task = async (): Promise<CompiledMermaidSvg> => {
        // Power BI packages one visual.js and cannot load webpack chunks. Eager mode
        // inlines Mermaid's official self-contained bundle there; Vite still keeps
        // this dynamic import lazy for the web runtime.
        const { default: mermaid } = await import(
            /* webpackMode: "eager" */ "mermaid/dist/mermaid.min.js"
        );
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: options.theme,
            htmlLabels: false,
            flowchart: { htmlLabels: false },
            class: { htmlLabels: false },
        });
        await mermaid.parse(options.source, { suppressErrors: false });
        const rendered = await mermaid.render(options.renderId, options.source);
        // Mermaid bindFunctions is intentionally ignored. HyperPBI owns all interaction handlers.
        const extracted = extractCss(rendered.svg);
        const annotated = annotateMermaidNodes(extracted.svg, options.nodeIds);
        const sanitized = sanitizeSvg(annotated.svg, options.namespace, { mermaidNodeIds: new Set(annotated.boundNodeIds) });
        const css = sanitizeCss(rewriteCssIds(extracted.css, sanitized.idMap), options.cssScope, {
            keyframeNamespace: options.namespace,
            allowLocalSvgReferences: true,
        });
        return { ...sanitized, css: css.css, warnings: [...sanitized.warnings, ...css.warnings], boundNodeIds: annotated.boundNodeIds };
    };
    const result = renderQueue.then(task, task);
    renderQueue = result.then(() => undefined, () => undefined);
    return result;
}
