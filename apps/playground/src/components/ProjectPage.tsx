import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { BrowserHostBridge } from "@hyperpbi/host/BrowserHostBridge";
import { defaultWorkspaceData, type DataSource } from "@hyperpbi/data/dataWorkspace";
import { createDefaultSchema } from "@hyperpbi/schema/defaultSchema";
import { prepareAuthoringData } from "@hyperpbi/editor/prepareAuthoringData";
import { HyperPbiStudio } from "@hyperpbi/editor/HyperPbiStudio";
import { canonicalJson } from "@hyperpbi/playground/canonicalJson";
import type { HyperPbiProject } from "@hyperpbi/playground/project";
import { touchProject } from "@hyperpbi/playground/project";
import type { ProjectStorage } from "@hyperpbi/playground/projectStorage";
import { defaultRuntimeSettings } from "@hyperpbi/runtime/runtimeSettings";
import { parseFileInWorker } from "../fileParserClient";
import { navigate } from "../router";
import { DataSourceManager } from "./DataSourceManager";
import { ExportDialog } from "./ExportDialog";

type SaveState = "saved" | "saving" | "unsaved" | "error";

function uniqueSource(source: DataSource, existing: Record<string, DataSource>): DataSource {
    if (!existing[source.id]) return source;
    let suffix = 2;
    let id = `${source.id}_${suffix}`;
    while (existing[id]) { suffix += 1; id = `${source.id}_${suffix}`; }
    return { ...source, id };
}

export function ProjectPage({ projectId, storage }: { projectId: string; storage: ProjectStorage }) {
    const [project, setProject] = useState<HyperPbiProject>();
    const [loadError, setLoadError] = useState("");
    const [saveState, setSaveState] = useState<SaveState>("saved");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [sourcesOpen, setSourcesOpen] = useState(true);
    const [exportOpen, setExportOpen] = useState(false);
    const saveTimer = useRef<ReturnType<typeof globalThis.setTimeout>>();
    const bridge = useMemo(() => new BrowserHostBridge(), []);

    useEffect(() => {
        void storage.getProject(projectId).then(value => {
            if (!value) setLoadError("This local project does not exist in this browser.");
            else setProject(value);
        }).catch(error => setLoadError(String(error)));
    }, [projectId, storage]);

    useEffect(() => {
        if (!project || saveState !== "unsaved") return;
        globalThis.clearTimeout(saveTimer.current);
        saveTimer.current = globalThis.setTimeout(() => {
            setSaveState("saving");
            void storage.saveProject(project).then(() => setSaveState("saved")).catch(() => setSaveState("error"));
        }, 450);
        return () => globalThis.clearTimeout(saveTimer.current);
    }, [project, saveState, storage]);

    const update = (mutate: (current: HyperPbiProject) => HyperPbiProject) => {
        setProject(current => current ? touchProject(mutate(current)) : current);
        setSaveState("unsaved");
    };
    const saveNow = async () => {
        if (!project) return;
        globalThis.clearTimeout(saveTimer.current);
        setSaveState("saving");
        try { await storage.saveProject(project); setSaveState("saved"); }
        catch { setSaveState("error"); }
    };

    const upload = async (files: FileList) => {
        if (!project) return;
        setUploading(true);
        setMessage("");
        try {
            const parsed = (await Promise.all(Array.from(files).map(parseFileInWorker))).flat();
            update(current => {
                const sources = { ...current.dataWorkspace.sources };
                const added = parsed.map(source => {
                    const unique = uniqueSource(source, sources);
                    sources[unique.id] = unique;
                    return unique;
                });
                const firstSource = current.dataWorkspace.defaultSourceId ? undefined : added[0];
                const defaultSourceId = current.dataWorkspace.defaultSourceId || firstSource?.id || "";
                const next = { ...current, dataWorkspace: { defaultSourceId, sources } };
                if (firstSource) {
                    const specification = createDefaultSchema(firstSource.data);
                    return {
                        ...next,
                        specification,
                        editorState: { ...next.editorState, draftSpecification: canonicalJson(specification) }
                    };
                }
                return next;
            });
            setMessage(`${parsed.length} data source${parsed.length === 1 ? "" : "s"} added.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        } finally {
            setUploading(false);
        }
    };

    if (loadError) return <main class="pg-loading-screen"><div class="pg-alert pg-alert-error">{loadError}</div><button class="pg-button" onClick={() => navigate("/")}>Back to projects</button></main>;
    if (!project) return <div class="pg-loading-screen">Opening project…</div>;

    const specification = project.editorState.draftSpecification ?? canonicalJson(project.specification);
    const configuration = project.editorState.draftRuntimeConfiguration ?? canonicalJson(project.runtimeConfiguration);
    const baseData = defaultWorkspaceData(project.dataWorkspace);
    const validation = prepareAuthoringData(specification, configuration, baseData, project.dataWorkspace);
    const sourceSignature = `${project.dataWorkspace.defaultSourceId}:${Object.keys(project.dataWorkspace.sources).join(",")}`;
    const validationLabel = validation.errors.length ? `${validation.errors.length} error${validation.errors.length === 1 ? "" : "s"}` : validation.warnings.length ? `${validation.warnings.length} warning${validation.warnings.length === 1 ? "" : "s"}` : "Valid";

    const renameProject = () => {
        const name = globalThis.prompt("Project name", project.metadata.name)?.trim();
        if (name) update(current => ({ ...current, metadata: { ...current.metadata, name } }));
    };
    const deleteProject = async () => {
        if (!globalThis.confirm(`Delete “${project.metadata.name}” from this browser?`)) return;
        await storage.deleteProject(project.metadata.id);
        navigate("/");
    };
    const renameSource = (sourceId: string, name: string) => update(current => ({
        ...current,
        dataWorkspace: {
            ...current.dataWorkspace,
            sources: { ...current.dataWorkspace.sources, [sourceId]: { ...current.dataWorkspace.sources[sourceId], name } }
        }
    }));
    const removeSource = (sourceId: string) => update(current => {
        const sources = { ...current.dataWorkspace.sources };
        delete sources[sourceId];
        const defaultSourceId = current.dataWorkspace.defaultSourceId === sourceId ? Object.keys(sources)[0] ?? "" : current.dataWorkspace.defaultSourceId;
        return { ...current, dataWorkspace: { defaultSourceId, sources } };
    });
    const setDefault = (sourceId: string) => update(current => ({ ...current, dataWorkspace: { ...current.dataWorkspace, defaultSourceId: sourceId } }));
    const saveStudio = (nextSpecification: string, nextConfiguration: string) => {
        const prepared = prepareAuthoringData(nextSpecification, nextConfiguration, defaultWorkspaceData(project.dataWorkspace), project.dataWorkspace);
        if (!prepared.specification || !prepared.config || prepared.errors.length) return;
        update(current => ({
            ...current,
            specification: prepared.specification!,
            runtimeConfiguration: prepared.config!,
            editorState: {
                ...current.editorState,
                draftSpecification: canonicalJson(prepared.specification),
                draftRuntimeConfiguration: canonicalJson(prepared.config)
            }
        }));
    };

    return <main class="pg-workspace">
        <header class="pg-workspace-header">
            <button class="pg-back-button" aria-label="Back to projects" onClick={() => navigate("/")}>←</button>
            <a class="pg-brand pg-brand-compact" href="/" onClick={event => { event.preventDefault(); navigate("/"); }}><span class="pg-brand-mark">H</span><strong>HyperPBI</strong></a>
            <span class="pg-header-divider" />
            <button class="pg-project-name" onClick={renameProject}>{project.metadata.name}<span>⌄</span></button>
            <div class="pg-mode-switch" role="group" aria-label="Workspace mode"><button class="is-active">Edit Mode</button><button onClick={() => { void saveNow().then(() => navigate(`/project/${encodeURIComponent(projectId)}/play`)); }}>Play Mode</button></div>
            <div class="pg-header-status">
                <span class={`pg-validation-chip ${validation.errors.length ? "is-error" : validation.warnings.length ? "is-warning" : "is-valid"}`} title={validation.errors[0] ?? validation.warnings[0]}>{validationLabel}</span>
                <button class={`pg-save-chip is-${saveState}`} onClick={() => void saveNow()}>{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved locally" : saveState === "error" ? "Save failed" : "Save now"}</button>
            </div>
            <button class="pg-button pg-button-dark" onClick={() => setExportOpen(true)}>Export</button>
            <details class="pg-project-menu"><summary aria-label="Project menu">•••</summary><div><button onClick={renameProject}>Rename project</button><button onClick={() => setSourcesOpen(value => !value)}>Toggle sources</button><button class="pg-danger-link" onClick={() => void deleteProject()}>Delete project</button></div></details>
        </header>
        {message && <div class={`pg-workspace-message ${/added\.$/.test(message) ? "is-success" : "is-error"}`}><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}
        <div class={`pg-workspace-body ${sourcesOpen ? "has-sources" : ""}`}>
            {sourcesOpen && <DataSourceManager workspace={project.dataWorkspace} uploading={uploading} onUpload={files => void upload(files)} onRename={renameSource} onRemove={removeSource} onDefault={setDefault} />}
            <section class="pg-studio-host" key={sourceSignature}>
                <HyperPbiStudio
                    instanceId="hyperpbi-playground-studio"
                    data={baseData}
                    dataWorkspace={project.dataWorkspace}
                    settings={defaultRuntimeSettings}
                    initialSpecification={specification}
                    initialConfiguration={configuration}
                    initialLayout={project.editorState.studioLayout}
                    onDraftChange={(draftSpecification, draftRuntimeConfiguration) => update(current => ({ ...current, editorState: { ...current.editorState, draftSpecification, draftRuntimeConfiguration } }))}
                    onLayoutChange={studioLayout => update(current => ({ ...current, editorState: { ...current.editorState, studioLayout } }))}
                    onSave={saveStudio}
                    hostAllowsInteractions={false}
                    selectExternal={bridge.selectExternal.bind(bridge)}
                    clearExternal={bridge.clearExternal.bind(bridge)}
                    applyExternalFilter={bridge.applyExternalFilter.bind(bridge)}
                    clearExternalFilter={bridge.clearExternalFilter.bind(bridge)}
                    webAccessAvailable
                    providerAccess={{ tiles: { allowed: true }, geocoder: { allowed: true } }}
                    initialEditorTab="ai"
                />
            </section>
        </div>
        {exportOpen && <ExportDialog project={project} onClose={() => setExportOpen(false)} />}
    </main>;
}
