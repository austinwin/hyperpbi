import { useEffect, useMemo, useState } from "preact/hooks";
import { IndexedDbProjectStorage } from "@hyperpbi/playground/projectStorage";
import { currentRoute, type PlaygroundRoute } from "./router";
import { HomePage } from "./components/HomePage";
import { ProjectPage } from "./components/ProjectPage";
import { PlayPage } from "./components/PlayPage";

export function App() {
    const [route, setRoute] = useState<PlaygroundRoute>(() => currentRoute());
    const storage = useMemo(() => new IndexedDbProjectStorage(), []);

    useEffect(() => {
        const update = () => setRoute(currentRoute());
        globalThis.addEventListener("popstate", update);
        return () => globalThis.removeEventListener("popstate", update);
    }, []);

    if (route.page === "home") return <HomePage storage={storage} />;
    if (route.page === "play") return <PlayPage projectId={route.projectId} storage={storage} />;
    return <ProjectPage projectId={route.projectId} storage={storage} />;
}
