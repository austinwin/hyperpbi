import { parseJson } from "../utils/safeJson";
import { providerServiceOrigin } from "./providerPolicy";

const EXTERNAL_SOURCE_TYPES = new Set([
    "arcgisFeature",
    "arcgisTile",
    "arcgisDynamic",
    "geoJson",
    "xyz",
]);

/**
 * Collect every external map endpoint authored in a dashboard that Power BI's
 * in-sandbox renderer will actually request.
 *
 * Runtime provider endpoints live in Runtime Config and are checked separately.
 * GeoLibre's hosted browser runtime is deliberately excluded: inside Power BI a
 * `geolibre` component is rendered by the bundled compatibility map and creates
 * no remote GeoLibre iframe. Browser/Playground hosts do not use this Power BI
 * WebAccess collector.
 */
export function configuredMapEndpoints(specification: string): string[] {
    const parsed = parseJson(specification).value;
    const endpoints = new Map<string, string>();

    const add = (endpoint: unknown): void => {
        if (typeof endpoint !== "string") return;
        const origin = providerServiceOrigin(endpoint);
        if (origin && !endpoints.has(origin)) endpoints.set(origin, endpoint);
    };

    const visit = (value: unknown): void => {
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        if (!value || typeof value !== "object") return;

        const entry = value as Record<string, unknown>;
        if (EXTERNAL_SOURCE_TYPES.has(String(entry.type))) add(entry.url);

        if (entry.type === "map" && entry.basemap && typeof entry.basemap === "object") {
            const basemap = entry.basemap as Record<string, unknown>;
            if (basemap.type !== "none" && basemap.type !== "osm") add(basemap.url);
        }

        Object.values(entry).forEach(visit);
    };

    visit(parsed);
    return [...endpoints.values()];
}
