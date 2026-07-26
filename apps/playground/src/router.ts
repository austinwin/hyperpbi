export type PlaygroundRoute =
    | { page: "home" }
    | { page: "mapGallery" }
    | { page: "project"; projectId: string }
    | { page: "play"; projectId: string };

let basePath = "";
let navigationHandler: ((path: string) => void) | undefined;

export function configurePlaygroundRouter(options: {
    basePath?: string;
    onNavigate?: (path: string) => void;
} = {}): () => void {
    basePath = (options.basePath ?? "").replace(/\/+$/, "");
    navigationHandler = options.onNavigate;
    return () => {
        basePath = "";
        navigationHandler = undefined;
    };
}

export function playgroundPath(path: string): string {
    const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
    return `${basePath}${normalized}` || "/";
}

export function currentRoute(pathname = globalThis.location?.pathname ?? "/"): PlaygroundRoute {
    const localPath = basePath && pathname.startsWith(`${basePath}/`)
        ? pathname.slice(basePath.length)
        : pathname === basePath
            ? "/"
            : pathname;
    if (/^\/components\/map\/?$/.test(localPath)) return { page: "mapGallery" };
    const match = localPath.match(/^\/project\/([^/]+)(?:\/(play))?\/?$/);
    if (!match) return { page: "home" };
    return { page: match[2] ? "play" : "project", projectId: decodeURIComponent(match[1]) };
}

export function navigate(path: string): void {
    const destination = playgroundPath(path);
    if (navigationHandler) {
        navigationHandler(destination);
        return;
    }
    globalThis.history.pushState({}, "", destination);
    globalThis.dispatchEvent(new PopStateEvent("popstate"));
}
