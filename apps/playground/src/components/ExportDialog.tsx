import { useMemo, useState } from "preact/hooks";
import { canonicalJson } from "@hyperpbi/playground/canonicalJson";
import { exportProjectBundle } from "@hyperpbi/playground/projectBundle";
import { analyzePowerBiPortability } from "@hyperpbi/playground/powerBiPortability";
import type { HyperPbiProject } from "@hyperpbi/playground/project";

function safeFileName(value: string): string {
    return value.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "hyperpbi-project";
}

function download(name: string, content: string, type = "application/json"): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
}

async function copy(content: string): Promise<void> {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(content);
    const input = document.createElement("textarea");
    input.value = content;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
}

export function ExportDialog({ project, onClose }: { project: HyperPbiProject; onClose: () => void }) {
    const [message, setMessage] = useState("");
    const portability = useMemo(() => analyzePowerBiPortability(project.specification, project.runtimeConfiguration, project.dataWorkspace), [project]);
    const name = safeFileName(project.metadata.name);
    const specification = canonicalJson(project.specification);
    const configuration = canonicalJson(project.runtimeConfiguration);
    const powerBiSpecification = portability.powerBiSpecification ? canonicalJson(portability.powerBiSpecification) : undefined;
    const act = async (label: string, action: () => void | Promise<void>) => {
        await action();
        setMessage(label);
        globalThis.setTimeout(() => setMessage(""), 1800);
    };
    const statusLabel = portability.status === "compatible"
        ? "Power BI compatible"
        : portability.status === "compatible-after-default-source-rewrite"
            ? "Compatible after source rewrite"
            : "Not fully portable";

    return <div class="pg-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
        <section class="pg-modal pg-export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
            <header><div><span class="pg-eyebrow">Portable output</span><h2 id="export-title">Export project</h2></div><button class="pg-icon-button" aria-label="Close export dialog" onClick={onClose}>×</button></header>
            <div class="pg-portability-summary">
                <span class={`pg-portability-icon status-${portability.status}`}>{portability.status === "not-fully-portable" ? "!" : "✓"}</span>
                <div><strong>{statusLabel}</strong><p>{portability.status === "compatible" ? "This specification already uses the Power BI source alias." : portability.status === "compatible-after-default-source-rewrite" ? "A safe export can rewrite only the selected default source to powerbi." : "The project depends on behavior or data Power BI will not provide to one visual."}</p></div>
            </div>
            {!!portability.issues.length && <div class="pg-portability-issues">{portability.issues.map(issue => <article key={`${issue.code}-${issue.message}`} class={issue.severity}><strong>{issue.message}</strong><p>{issue.action}</p></article>)}</div>}
            <div class="pg-export-grid">
                <ExportGroup title="HyperPBI 2.0 specification" description="Canonical declarative dashboard JSON.">
                    <button onClick={() => void act("Specification copied", () => copy(specification))}>Copy Specification</button>
                    <button onClick={() => void act("Specification downloaded", () => download(`${name}.hyperpbi.json`, specification))}>Download Specification</button>
                    {powerBiSpecification && portability.status === "compatible-after-default-source-rewrite" && <button class="pg-button-accent" onClick={() => void act("Power BI specification copied", () => copy(powerBiSpecification))}>Copy Power BI-safe Specification</button>}
                </ExportGroup>
                <ExportGroup title="Runtime configuration" description="The same configuration contract used by the custom visual.">
                    <button onClick={() => void act("Runtime configuration copied", () => copy(configuration))}>Copy Runtime Configuration</button>
                    <button onClick={() => void act("Runtime configuration downloaded", () => download(`${name}.runtime.json`, configuration))}>Download Runtime Configuration</button>
                </ExportGroup>
                <ExportGroup title="Complete Playground project" description="Includes normalized sources, rows, row keys, editor state, spec, and config.">
                    <button onClick={() => void act("Complete project downloaded", () => download(`${name}.hyperpbi`, exportProjectBundle(project), "application/vnd.hyperpbi.project+json"))}>Export Complete Project</button>
                </ExportGroup>
            </div>
            <footer><span class="pg-toast-message" aria-live="polite">{message}</span><button class="pg-button" onClick={onClose}>Done</button></footer>
        </section>
    </div>;
}

function ExportGroup({ title, description, children }: { title: string; description: string; children: preact.ComponentChildren }) {
    return <section class="pg-export-group"><div><h3>{title}</h3><p>{description}</p></div><div class="pg-export-actions">{children}</div></section>;
}
