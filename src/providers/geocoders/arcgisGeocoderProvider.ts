import { GeocoderProvider } from "../providerTypes";

const DEFAULT_ENDPOINT = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

function candidatesEndpoint(endpoint: string): URL {
    const url = new URL(endpoint); const pathname = url.pathname.replace(/\/+$/, "");
    url.pathname = /\/findAddressCandidates$/i.test(pathname) ? pathname : `${pathname}/findAddressCandidates`;
    return url;
}

export const arcgisGeocoderProvider: GeocoderProvider = {
    id: "arcgis",
    label: "ArcGIS Geocoding Server",
    external: true,
    defaults: { provider: "arcgis", enabled: false, endpoint: DEFAULT_ENDPOINT, rateLimitPerSecond: 1, cache: true, autocomplete: false, userTriggeredOnly: true, resultLimit: 1, minScore: 80 },
    async geocode(address, config, signal) {
        const url = candidatesEndpoint(config.endpoint ?? DEFAULT_ENDPOINT);
        url.searchParams.set("SingleLine", address);
        url.searchParams.set("f", "json");
        url.searchParams.set("outFields", "*");
        url.searchParams.set("maxLocations", "1");
        if (config.countryCode?.trim()) url.searchParams.set("countryCode", config.countryCode.trim());
        if (config.category?.trim()) url.searchParams.set("category", config.category.trim());
        if (config.token?.trim()) url.searchParams.set("token", config.token.trim());
        const response = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Geocoder HTTP ${response.status}`);
        const body = await response.json() as { candidates?: Array<{ score?: number; location?: { x?: number; y?: number } }> };
        const candidate = [...(body.candidates ?? [])].sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0))[0];
        const longitude = Number(candidate?.location?.x); const latitude = Number(candidate?.location?.y);
        if (!candidate || Number(candidate.score ?? 0) < (config.minScore ?? 80) || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
        return { latitude, longitude };
    }
};
