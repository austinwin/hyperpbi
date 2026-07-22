export type PlaygroundRoute =
    | { page: "home" }
    | { page: "project"; projectId: string }
    | { page: "play"; projectId: string };

export function currentRoute(pathname = globalThis.location?.pathname ?? "/"): PlaygroundRoute {
    const match = pathname.match(/^\/project\/([^/]+)(?:\/(play))?\/?$/);
    if (!match) return { page: "home" };
    return { page: match[2] ? "play" : "project", projectId: decodeURIComponent(match[1]) };
}

export function navigate(path: string): void {
    globalThis.history.pushState({}, "", path);
    globalThis.dispatchEvent(new PopStateEvent("popstate"));
}
