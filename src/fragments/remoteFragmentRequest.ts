import { fetchRemoteJson, originAllowed } from "../data/remoteDataSources";
import type { ResolvedMapFeature } from "../maps/model/resolvedMapTypes";
import { featureAttribute } from "../maps/attributes/mapFeatureAttributes";
import { checkHostPolicy } from "../maps/arcgis/arcGisHostPolicy";
import { externalServiceAccess } from "../providers/providerPolicy";
import type { ProviderAccessState } from "../providers/providerTypes";
import { FRAGMENT_LIMITS, type RemoteFragmentRequest } from "./fragmentTypes";

const cache = new Map<string, { created: number; expires: number; payload: unknown }>();
export const boundedFragmentNumber = (value: number | undefined, fallback: number, min: number, max: number) => Number.isFinite(value) ? Math.max(min, Math.min(max, value!)) : fallback;

export function fragmentEndpoint(template: string, feature?: ResolvedMapFeature): URL {
    // Attribute values may occupy path/query values, never the origin.
    if (!/^https:\/\/[^/?#{}]+(?:[/?]|$)/i.test(template)) throw new Error("Fragment endpoint must have a literal HTTPS origin without credentials.");
    const resolved = template.replace(/\{\{\s*(service|powerbi|joined)\.([^{}]+?)\s*\}\}/g, (_token, source: "service" | "powerbi" | "joined", field: string) => {
        const value = feature && featureAttribute(feature, field.trim(), source);
        if (value === undefined || value === null) throw new Error(`Missing feature attribute: ${source}.${field.trim()}.`);
        if (!["string", "number", "boolean"].includes(typeof value)) throw new Error("Feature URL bindings must be scalar values.");
        const text = String(value);
        if (text === "." || text === "..") throw new Error("Dot path attributes are not allowed.");
        return encodeURIComponent(text);
    });
    if (resolved.includes("{{") || resolved.includes("}}")) throw new Error("Use qualified feature bindings such as {{service.site_id}}.");
    const url = new URL(resolved);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || resolved.includes("\\")) throw new Error("Fragment endpoint requires credential-free HTTPS without a hash.");
    return url;
}

export function assertFragmentAccess(url: URL, host: "web" | "powerbi", access?: ProviderAccessState, webAccessAvailable = false): void {
    const allowed = host === "web" ? originAllowed(url.origin) : checkHostPolicy(url.href).allowed;
    if (!allowed) throw new Error(`Fragment host ${url.origin} is not approved by this build. Configure HYPERPBI_${host === "web" ? "WEB_REST" : "MAP"}_HOSTS and rebuild.`);
    if (host === "powerbi") {
        const permission = externalServiceAccess(access, url.href, webAccessAvailable);
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
