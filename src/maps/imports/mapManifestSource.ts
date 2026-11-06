import type { ProviderAccessState } from "../../providers/providerTypes";
import { externalServiceAccess } from "../../providers/providerPolicy";
import { parseMapManifest, publicMapUrl } from "./mapManifest";
import type { PublishedMapManifest } from "./mapImportTypes";

export interface MapManifestSourceOptions { signal?: AbortSignal; providerAccess?: ProviderAccessState; webAccessAvailable?: boolean; }
export async function loadMapManifest(url: string, options: MapManifestSourceOptions = {}) {
    const endpoint = publicMapUrl(url);
    const access = externalServiceAccess(options.providerAccess, endpoint, options.webAccessAvailable);
    if (!access.allowed) throw new Error(access.reason ?? "Manifest origin is unavailable. Configure Power BI WebAccess for this host.");
    const response = await fetch(endpoint, { signal: options.signal, credentials: "omit", redirect: "error", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? `Published map is private or unauthorized (${response.status}). Publish a public export without embedded credentials.` : `Published map is unavailable (${response.status}). Check its manifest URL and connection.`);
    if (Number(response.headers.get("content-length")) > 12_000_000) throw new Error("Map manifest exceeds 12 MB.");
    const text = await response.text();
    if (text.length > 12_000_000) throw new Error("Map manifest exceeds 12 MB.");
    let value: unknown;
    try { value = JSON.parse(text); } catch { throw new Error("This URL did not return a JSON map manifest. Export hyperpbi.map 1.0 and paste its published asset URL; website HTML is not scraped."); }
    return parseMapManifest(value, endpoint);
}

/** Explicit export adapter for a publisher holding its own map configuration. */
export function exportMapManifest(map: Omit<PublishedMapManifest, "format" | "schemaVersion">): PublishedMapManifest {
    return parseMapManifest({ ...map, format: "hyperpbi.map", schemaVersion: "1.0" }).manifest;
}
