import { useEffect, useRef, useState } from "preact/hooks";
import type { ProjectStorage } from "@hyperpbi/playground/projectStorage";
import { createPlaygroundProject, type PlaygroundProjectMetadata } from "@hyperpbi/playground/project";
import { importProjectBundle } from "@hyperpbi/playground/projectBundle";
import { navigate } from "../router";

export function HomePage({ storage }: { storage: ProjectStorage }) {
    const [projects, setProjects] = useState<PlaygroundProjectMetadata[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
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

    return <main class="pg-home">
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
                <button class="pg-button pg-button-large" onClick={() => navigate("/components/map")}>Explore map gallery</button>
            </div>
            <div class="pg-flow" aria-label="HyperPBI architecture">
                <span>AI · Studio · JSON</span><b>→</b><span>2.0 Specification</span><b>→</b><span>Shared Runtime</span><b>→</b><span>Web · Power BI</span>
            </div>
        </section>
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
    </main>;
}
