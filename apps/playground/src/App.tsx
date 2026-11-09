import { useEffect, useMemo, useState } from "preact/hooks";
import { IndexedDbProjectStorage } from "@hyperpbi/playground/projectStorage";
import { currentRoute, type PlaygroundRoute } from "./router";
import { HomePage } from "./components/HomePage";
import { ProjectPage } from "./components/ProjectPage";
import { PlayPage } from "./components/PlayPage";
import { MapGalleryPage } from "./components/MapGalleryPage";
import dashboardManifest from "../../../examples/dashboards/manifest.json";
import gisBundle from "../../../examples/dashboards/dynamic-gis-analytics/project.hyperpbi?raw";
import assetBundle from "../../../examples/dashboards/universal-dynamic-content/project.hyperpbi?raw";
import type { PlaygroundExampleLink } from "./components/HomePage";

const dynamicBundles: Record<string, string> = { "dynamic-gis-analytics": gisBundle, "universal-dynamic-content": assetBundle };
const liveExamples = dashboardManifest.examples.filter(example => dynamicBundles[example.slug]).map(example => ({ ...example, bundle: dynamicBundles[example.slug] })) as PlaygroundExampleLink[];

export function App() {
    const [route, setRoute] = useState<PlaygroundRoute>(() => currentRoute());
    const storage = useMemo(() => new IndexedDbProjectStorage(), []);

    useEffect(() => {
        const update = () => setRoute(currentRoute());
        globalThis.addEventListener("popstate", update);
        return () => globalThis.removeEventListener("popstate", update);
    }, []);

    if (route.page === "home") return <HomePage storage={storage} examples={liveExamples} />;
    if (route.page === "mapGallery") return <MapGalleryPage storage={storage} />;
    if (route.page === "play") return <PlayPage projectId={route.projectId} storage={storage} />;
    return <ProjectPage projectId={route.projectId} storage={storage} />;
}
