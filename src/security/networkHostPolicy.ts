import hosts from "./approvedNetworkHosts.json";

export const MINIUP_HOSTS = Object.freeze(hosts.miniup);
export const DEMO_HOSTS = Object.freeze(hosts.demo);
export const MAP_HOSTS = Object.freeze([...new Set([...hosts.maps, ...hosts.miniup, ...hosts.demo])]);

/** Concrete HTTPS origins only. A subdomain wildcard does not include the apex. */
export function matchesHttpsHost(endpoint: string, patterns: readonly string[]): boolean {
    try {
        const url = new URL(endpoint);
        if (url.protocol !== "https:" || url.username || url.password) return false;
        return patterns.some(pattern => {
            if (pattern === "https://*" || pattern === "*") return false;
            const wildcard = pattern.startsWith("https://*.");
            const host = new URL(wildcard ? pattern.replace("https://*.", "https://") : pattern);
            if (host.protocol !== "https:" || host.username || host.password || host.pathname !== "/" || host.search || host.hash || host.hostname.includes("*")) return false;
            return url.port === host.port && (wildcard
                ? url.hostname !== host.hostname && url.hostname.endsWith(`.${host.hostname}`)
                : url.hostname === host.hostname);
        });
    } catch { return false; }
}
