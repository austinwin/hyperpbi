import { GeocoderConfig, GeocoderProvider, GeocoderSearchResult } from "../providerTypes";

const DEFAULT_ENDPOINT = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

function candidatesEndpoint(endpoint: string): URL {
    if (!/^https:\/\//i.test(endpoint)) throw new Error("Geocoder endpoint must use HTTPS.");
    const url = new URL(endpoint);
    const pathname = url.pathname.replace(/\/+$/, "");
    url.pathname = /\/findAddressCandidates$/i.test(pathname) ? pathname : `${pathname}/findAddressCandidates`;
    return url;
}

function resultLimit(config: GeocoderConfig): number {
    return Math.min(5, Math.max(1, Math.floor(config.resultLimit ?? 1)));
}

async function request(address: string, config: GeocoderConfig, signal?: AbortSignal): Promise<GeocoderSearchResult[]> {
    const url = candidatesEndpoint(config.endpoint ?? DEFAULT_ENDPOINT);
    const limit = resultLimit(config);
    url.searchParams.set("SingleLine", address);
    url.searchParams.set("f", "json");
    url.searchParams.set("outFields", "*");
    url.searchParams.set("maxLocations", String(limit));
    if (config.countryCode?.trim()) url.searchParams.set("countryCode", config.countryCode.trim());
    if (config.category?.trim()) url.searchParams.set("category", config.category.trim());
    if (config.token?.trim()) url.searchParams.set("token", config.token.trim());
    const response = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
    const body = await response.json() as { candidates?: Array<{ address?: string; score?: number; location?: { x?: number; y?: number }; extent?: { xmin?: number; ymin?: number; xmax?: number; ymax?: number } }> };
    return [...(body.candidates ?? [])]
        .sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0))
        .filter(candidate => Number(candidate.score ?? 0) >= (config.minScore ?? 80))
        .slice(0, limit)
        .flatMap(candidate => {
            const longitude = Number(candidate.location?.x);
            const latitude = Number(candidate.location?.y);
            if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return [];
            const extentValues = [candidate.extent?.xmin, candidate.extent?.ymin, candidate.extent?.xmax, candidate.extent?.ymax].map(Number);
            const bounds = extentValues.every(Number.isFinite) && extentValues[0] < extentValues[2] && extentValues[1] < extentValues[3]
                ? extentValues as [number, number, number, number]
                : undefined;
            return [{ latitude, longitude, label: candidate.address, bounds, provider: "arcgis" }];
        });
}

export const arcgisGeocoderProvider: GeocoderProvider = {
    id: "arcgis",
    label: "ArcGIS Geocoding Server",
    external: true,
    defaults: { provider: "arcgis", enabled: false, endpoint: DEFAULT_ENDPOINT, rateLimitPerSecond: 1, cache: true, autocomplete: false, userTriggeredOnly: true, resultLimit: 1, minScore: 80 },
    async geocode(address, config, signal) {
        const first = (await request(address, { ...config, resultLimit: 1 }, signal))[0];
        return first ? { latitude: first.latitude, longitude: first.longitude } : null;
    },
    search: request,
};
