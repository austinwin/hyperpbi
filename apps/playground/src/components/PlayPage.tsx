import { useEffect, useState } from "preact/hooks";
import type { ProjectStorage } from "@hyperpbi/playground/projectStorage";
import type { HyperPbiProject } from "@hyperpbi/playground/project";
import { navigate } from "../router";
import { PlaygroundRenderer } from "./PlaygroundRenderer";

export function PlayPage({ projectId, storage }: { projectId: string; storage: ProjectStorage }) {
    const [project, setProject] = useState<HyperPbiProject>();
    useEffect(() => { void storage.getProject(projectId).then(setProject); }, [projectId, storage]);
    useEffect(() => {
        const escape = (event: KeyboardEvent) => event.key === "Escape" && navigate(`/project/${encodeURIComponent(projectId)}`);
        document.addEventListener("keydown", escape);
        return () => document.removeEventListener("keydown", escape);
    }, [projectId]);
    if (!project) return <div class="pg-loading-screen">Loading Play Mode…</div>;
    return <main class="pg-play-page">
        <button class="pg-exit-play" onClick={() => navigate(`/project/${encodeURIComponent(projectId)}`)}><span>←</span> Exit Play Mode <kbd>Esc</kbd></button>
        <PlaygroundRenderer project={project} />
    </main>;
}
