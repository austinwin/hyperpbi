import { useEffect, useRef, useState } from "preact/hooks";
import type { ProjectStorage } from "@hyperpbi/playground/projectStorage";
import { createPlaygroundProject, type PlaygroundProjectMetadata } from "@hyperpbi/playground/project";
import { importProjectBundle } from "@hyperpbi/playground/projectBundle";
import { navigate } from "../router";

export interface PlaygroundExampleLink {
    slug: string;
    title: string;
    summary: string;
    useCase?: string;
    theme?: "light" | "dark";
    accent?: string;
    bundle?: string;
}

export function HomePage({
    storage,
    examples = []
}: {
    storage: ProjectStorage;
    examples?: PlaygroundExampleLink[];
}) {
    const [projects, setProjects] = useState<PlaygroundProjectMetadata[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingExample, setLoadingExample] = useState("");
    const importInput = useRef<HTMLInputElement>(null);

    const reload = async () => {
        setProjects(await storage.listProjects());
        setLoading(false);
    };
    useEffect(() => { void reload().catch(reason => { setError(String(reason)); setLoading(false); }); }, []);

    const create = async () => {
        const project = createPlaygroundProject(`Project ${projects.length + 1}`);
        await storage.saveProject(project);
        navigate(`/project/${encodeURIComponent(project.metadata.id)}`);
    };
    const rename = async (metadata: PlaygroundProjectMetadata) => {
        const project = await storage.getProject(metadata.id);
        if (!project) return;
        const name = globalThis.prompt("Project name", project.metadata.name)?.trim();
        if (!name) return;
        project.metadata = { ...project.metadata, name, updatedAt: new Date().toISOString() };
        await storage.saveProject(project);
        await reload();
    };
    const remove = async (metadata: PlaygroundProjectMetadata) => {
        if (!globalThis.confirm(`Delete “${metadata.name}” from this browser? This cannot be undone.`)) return;
        await storage.deleteProject(metadata.id);
        await reload();
    };
    const importBundle = async (file?: File) => {
        if (!file) return;
        setError("");
        const result = importProjectBundle(await file.text());
        if (!result.project) {
            setError(result.errors.join("\n"));
            return;
        }
        await storage.saveProject(result.project);
        navigate(`/project/${encodeURIComponent(result.project.metadata.id)}`);
    };
    const loadExample = async (example: PlaygroundExampleLink) => {
        if (!example.bundle) {
            globalThis.location.assign(`/examples/${encodeURIComponent(example.slug)}`);
            return;
        }
        setError("");
        setLoadingExample(example.slug);
        try {
            const result = importProjectBundle(example.bundle);
            if (!result.project) {
                setError(result.errors.join("\n"));
                return;
            }
            await storage.saveProject(result.project);
            navigate(`/project/${encodeURIComponent(result.project.metadata.id)}`);
        } finally {
            setLoadingExample("");
        }
    };

    return <div class="pg-home">
        <header class="pg-home-header">
            <a class="pg-brand" href="/" onClick={event => { event.preventDefault(); navigate("/"); }}>
                <span class="pg-brand-mark">H</span>
                <span><strong>HyperPBI</strong><small>Playground 2.0</small></span>
            </a>
            <span class="pg-local-pill"><span /> Local-first workspace</span>
        </header>
        <section class="pg-hero">
            <div class="pg-eyebrow">AI-native analytics runtime</div>
            <h1>Build once. Run in the browser or Power BI.</h1>
            <p>Create portable HyperPBI 2.0 dashboards with local data, the shared Studio, and the same validated runtime used by the Power BI visual.</p>
            <div class="pg-hero-actions">
                <button class="pg-button pg-button-primary pg-button-large" onClick={() => void create()}><span>＋</span> New Project</button>
                <button class="pg-button pg-button-large" onClick={() => importInput.current?.click()}>Import Project</button>
                <input ref={importInput} class="pg-visually-hidden" type="file" accept=".hyperpbi,application/json" onChange={event => void importBundle(event.currentTarget.files?.[0])} />
                <a class="pg-button pg-button-large" href="/examples/maps">Explore map gallery</a>
            </div>
            <div class="pg-flow" aria-label="HyperPBI architecture">
                <span>AI · Studio · JSON</span><b>→</b><span>2.0 Specification</span><b>→</b><span>Shared Runtime</span><b>→</b><span>Web · Power BI</span>
            </div>
        </section>
        {!!examples.length && <section class="pg-example-library">
            <div class="pg-section-heading">
                <div><span class="pg-eyebrow">Ready-to-run dashboards</span><h2>Start from a complete example</h2></div>
                <p>Preview each design, inspect its portable files, then add a copy to your local workspace.</p>
            </div>
            <div class="pg-example-grid">
                {examples.map(example => <article
                    class={`pg-example-card is-${example.theme ?? "light"}`}
                    key={example.slug}
                    style={{ "--pg-example-accent": example.accent ?? "#5d5fef" }}
                >
                    <a class="pg-example-card-link" href={`/examples/${encodeURIComponent(example.slug)}`}>
                        <span class="pg-example-card-preview" aria-hidden="true"><i /><i /><i /><i /></span>
                    </a>
                    <a class="pg-example-card-copy" href={`/examples/${encodeURIComponent(example.slug)}`}>
                        <small>{example.useCase ?? "Dashboard example"}</small>
                        <strong>{example.title}</strong>
                        <span>{example.summary}</span>
                    </a>
                    <div class="pg-example-card-actions">
                        <a href={`/examples/${encodeURIComponent(example.slug)}`}>Preview</a>
                        <button
                            type="button"
                            disabled={loadingExample === example.slug}
                            onClick={() => void loadExample(example)}
                        >
                            {loadingExample === example.slug ? "Loading…" : "Load example"}
                        </button>
                    </div>
                </article>)}
            </div>
        </section>}
        <section class="pg-recents">
            <div class="pg-section-heading">
                <div><span class="pg-eyebrow">On this device</span><h2>Recent projects</h2></div>
                <p>Projects and normalized data stay in this browser.</p>
            </div>
            {error && <div class="pg-alert pg-alert-error" role="alert">{error}</div>}
            {loading ? <div class="pg-empty-card">Loading local projects…</div> : projects.length ?
                <div class="pg-project-grid">{projects.map(project =>
                    <article class="pg-project-card" key={project.id}>
                        <button class="pg-project-open" onClick={() => navigate(`/project/${encodeURIComponent(project.id)}`)}>
                            <span class="pg-project-preview"><span /><span /><span /></span>
                            <strong>{project.name}</strong>
                            <small>Updated {new Date(project.updatedAt).toLocaleString()}</small>
                        </button>
                        <div class="pg-card-actions">
                            <button aria-label={`Rename ${project.name}`} onClick={() => void rename(project)}>Rename</button>
                            <button class="pg-danger-link" aria-label={`Delete ${project.name}`} onClick={() => void remove(project)}>Delete</button>
                        </div>
                    </article>
                )}</div> :
                <div class="pg-empty-card"><span class="pg-empty-icon">◇</span><h3>No local projects yet</h3><p>Create a project, upload a CSV or workbook, and open the shared HyperPBI Studio.</p><button class="pg-button pg-button-primary" onClick={() => void create()}>Create your first project</button></div>}
        </section>
        <footer class="pg-home-footer"><span>HyperPBI 2.0 · Declarative, deterministic, portable</span><span>No data leaves your browser</span></footer>
    </div>;
}
