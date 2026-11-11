import { useEffect, useMemo, useState } from "preact/hooks";
import { IndexedDbProjectStorage } from "@hyperpbi/playground/projectStorage";
import { currentRoute, type PlaygroundRoute } from "./router";
import { HomePage } from "./components/HomePage";
import { ProjectPage } from "./components/ProjectPage";
import { PlayPage } from "./components/PlayPage";
import { MapGalleryPage } from "./components/MapGalleryPage";
import { PlaygroundRenderer } from "./components/PlaygroundRenderer";
import { importProjectBundle } from "@hyperpbi/playground/projectBundle";
import type { HyperPbiProject } from "@hyperpbi/playground/project";
import dashboardManifest from "../../../examples/dashboards/manifest.json";
import gisBundle from "../../../examples/dashboards/dynamic-gis-analytics/project.hyperpbi?raw";
import assetBundle from "../../../examples/dashboards/universal-dynamic-content/project.hyperpbi?raw";
import type { PlaygroundExampleLink } from "./components/HomePage";

const dynamicBundles: Record<string, PlaygroundExampleLink["bundle"]> = {
    "dynamic-gis-analytics": gisBundle,
    "universal-dynamic-content": assetBundle,
    "pump-station-monitoring": () => import("../../../examples/dashboards/pump-station-monitoring/project.hyperpbi?raw").then(module => module.default),
    "groundwater-supply-distribution": () => import("../../../examples/dashboards/groundwater-supply-distribution/project.hyperpbi?raw").then(module => module.default),
    "scene3d-animation-studio": () => import("../../../examples/dashboards/scene3d-animation-studio/project.hyperpbi?raw").then(module => module.default),
    "water-pump-station-digital-twin": () => import("../../../examples/dashboards/water-pump-station-digital-twin/project.hyperpbi?raw").then(module => module.default),
    "multi-station-3d-explorer": () => import("../../../examples/dashboards/multi-station-3d-explorer/project.hyperpbi?raw").then(module => module.default),
};
const liveExamples = dashboardManifest.examples.filter(example => dynamicBundles[example.slug]).map(example => ({ ...example, bundle: dynamicBundles[example.slug] })) as PlaygroundExampleLink[];

function ExamplePreview({ slug }: { slug: string }) {
    const [project, setProject] = useState<HyperPbiProject>();
    const [error, setError] = useState(false);
    useEffect(() => {
        const bundle = dynamicBundles[slug];
        let active = true;
        const source = typeof bundle === "function" ? bundle() : Promise.resolve(bundle);
        source.then(raw => {
            if (!active) return;
            const example = raw ? importProjectBundle(raw).project : undefined;
            if (example) setProject(example); else setError(true);
        }).catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [slug]);
    return <div class="pg-play-page">
        <a class="pg-exit-play" href="/">← Playground</a>
        {project ? <PlaygroundRenderer project={project} /> : <div class="pg-loading-screen" role="status">{error ? "This example could not be loaded." : "Loading example…"}</div>}
    </div>;
}

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
    if (route.page === "example") return <ExamplePreview key={route.slug} slug={route.slug} />;
    if (route.page === "play") return <PlayPage projectId={route.projectId} storage={storage} />;
    return <ProjectPage projectId={route.projectId} storage={storage} />;
}
