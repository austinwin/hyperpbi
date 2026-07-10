import { GeocoderConfig, GeocoderProvider, GeocoderSearchResult } from "../providerTypes";

type CustomResult = {
    lat?: number | string;
    lon?: number | string;
    latitude?: number | string;
    longitude?: number | string;
    label?: string;
    display_name?: string;
    bounds?: unknown;
};

function parseBounds(value: unknown): [number, number, number, number] | undefined {
    if (!Array.isArray(value) || value.length !== 4) return undefined;
    const values = value.map(Number) as [number, number, number, number];
    return values.every(Number.isFinite) && values[0] < values[2] && values[1] < values[3] ? values : undefined;
}

async function request(query: string, config: GeocoderConfig, signal?: AbortSignal): Promise<GeocoderSearchResult[]> {
    if (!config.endpoint) throw new Error("Custom geocoder endpoint is missing.");
    if (!/^https:\/\//i.test(config.endpoint)) throw new Error("Geocoder endpoint must use HTTPS.");
    const url = new URL(config.endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(Math.min(5, Math.max(1, Math.floor(config.resultLimit ?? 1)))));
    const response = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
    const body = await response.json() as CustomResult | CustomResult[] | { results?: CustomResult[] };
    const items = Array.isArray(body) ? body : "results" in body && Array.isArray(body.results) ? body.results : [body as CustomResult];
    return items.slice(0, Math.min(5, Math.max(1, config.resultLimit ?? 1))).flatMap(item => {
        const latitude = Number(item.latitude ?? item.lat);
        const longitude = Number(item.longitude ?? item.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
        return [{ latitude, longitude, label: item.label ?? item.display_name, bounds: parseBounds(item.bounds), provider: "custom" }];
    });
}

export const customGeocoderProvider: GeocoderProvider = {
    id: "custom",
    label: "Custom endpoint",
    external: true,
    defaults: { provider: "custom", enabled: false, endpoint: "", rateLimitPerSecond: 1, cache: true, autocomplete: false, userTriggeredOnly: true, resultLimit: 1 },
    async geocode(address, config, signal) {
        const first = (await request(address, { ...config, resultLimit: 1 }, signal))[0];
        return first ? { latitude: first.latitude, longitude: first.longitude } : null;
    },
    search: request,
};
