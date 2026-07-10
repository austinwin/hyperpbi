import { GeocoderConfig, GeocoderProvider, GeocoderSearchResult } from "../providerTypes";

const DEFAULT_ENDPOINT = "https://nominatim.openstreetmap.org/search";
let lastInteractiveRequestAt = 0;

function resultLimit(config: GeocoderConfig): number {
    return Math.min(5, Math.max(1, Math.floor(config.resultLimit ?? 1)));
}

function parseBounds(value: unknown): [number, number, number, number] | undefined {
    if (!Array.isArray(value) || value.length !== 4) return undefined;
    const [south, north, west, east] = value.map(Number);
    if (![south, north, west, east].every(Number.isFinite) || west >= east || south >= north) return undefined;
    return [west, south, east, north];
}

async function waitForInteractiveSlot(signal?: AbortSignal): Promise<void> {
    const remaining = Math.max(0, 1000 - (Date.now() - lastInteractiveRequestAt));
    if (remaining > 0) {
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, remaining);
            const abort = () => { clearTimeout(timer); reject(new DOMException("The operation was aborted.", "AbortError")); };
            if (signal?.aborted) abort();
            else signal?.addEventListener("abort", abort, { once: true });
        });
    }
    if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
    lastInteractiveRequestAt = Date.now();
}

async function request(query: string, config: GeocoderConfig, signal?: AbortSignal): Promise<GeocoderSearchResult[]> {
    const endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
    if (!/^https:\/\//i.test(endpoint)) throw new Error("Geocoder endpoint must use HTTPS.");
    const url = new URL(endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(resultLimit(config)));
    const response = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
    const body = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string; boundingbox?: unknown }>;
    return body.slice(0, resultLimit(config)).flatMap(item => {
        const latitude = Number(item.lat);
        const longitude = Number(item.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
        return [{ latitude, longitude, label: item.display_name, bounds: parseBounds(item.boundingbox), provider: "nominatim" }];
    });
}

export const nominatimGeocoderProvider: GeocoderProvider = {
    id: "nominatim",
    label: "Nominatim (OpenStreetMap)",
    external: true,
    defaults: { provider: "nominatim", enabled: true, endpoint: DEFAULT_ENDPOINT, rateLimitPerSecond: 1, cache: true, autocomplete: false, userTriggeredOnly: true, resultLimit: 1 },
    async geocode(address, config, signal) {
        const first = (await request(address, { ...config, resultLimit: 1 }, signal))[0];
        return first ? { latitude: first.latitude, longitude: first.longitude } : null;
    },
    async search(query, config, signal) {
        await waitForInteractiveSlot(signal);
        return request(query, config, signal);
    },
};
