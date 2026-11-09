import { fetchRemoteJson, originAllowed } from "../data/remoteDataSources";
import { checkHostPolicy } from "../maps/arcgis/arcGisHostPolicy";
import { externalServiceAccess } from "../providers/providerPolicy";
import type { ProviderAccessState } from "../providers/providerTypes";
import { FRAGMENT_LIMITS, type RemoteFragmentRequest } from "./fragmentTypes";

const cache = new Map<string, { created: number; expires: number; payload: unknown }>();
export const boundedFragmentNumber = (value: number | undefined, fallback: number, min: number, max: number) => Number.isFinite(value) ? Math.max(min, Math.min(max, value!)) : fallback;

export function assertFragmentAccess(url: URL, host: "web" | "powerbi", access?: ProviderAccessState): void {
    const allowed = host === "web" ? originAllowed(url.origin) : checkHostPolicy(url.href).allowed;
    if (!allowed) throw new Error(`Fragment host ${url.origin} is not approved by this build. Configure HYPERPBI_${host === "web" ? "WEB_REST" : "MAP"}_HOSTS and rebuild.`);
    if (host === "powerbi") {
        const permission = externalServiceAccess(access, url.href);
        if (!permission.allowed) throw new Error(permission.reason ?? "Power BI WebAccess was denied. Use the Maps package and approve the endpoint origin.");
    }
}

export async function fetchRemoteFragment(url: URL, request: RemoteFragmentRequest, signal: AbortSignal, refresh = false): Promise<unknown> {
    if (signal.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
    const key = url.href;
    const ttl = boundedFragmentNumber(request.cacheTtlSeconds, 30, 0, 3600) * 1000;
    const cached = cache.get(key);
    if (!refresh && ttl > 0 && cached && cached.expires > Date.now() && cached.created + ttl > Date.now()) return cached.payload;
    const payload = await fetchRemoteJson(url, boundedFragmentNumber(request.timeoutMs, 10000, 1000, 15000), signal, FRAGMENT_LIMITS.bytes);
    if (signal.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
    if (ttl > 0) {
        // Bound both payload size and the number of retained responses.
        if (cache.size >= 32) cache.delete(cache.keys().next().value!);
        cache.set(key, { created: Date.now(), expires: Date.now() + ttl, payload });
    }
    return payload;
}

export function clearRemoteFragmentCache(): void { cache.clear(); }
