import { MapBindingKeys, NormalizedField } from "../data/normalizeData";
import { parseJson } from "../utils/safeJson";
import { ProviderConfiguration } from "../providers/providerTypes";
import { defaultProviderConfig, validateProviderConfig } from "../providers/providerConfig";

export interface HyperPbiConfig {
    version: "1.0";
    bindings?: { map?: Partial<MapBindingKeys> };
    interactions?: { crossFilter?: boolean; multiSelect?: boolean; externalMode?: "auto" | "filter" | "selection" };
    renderer?: { showHeader?: boolean; showRowCount?: boolean; showStudioButton?: boolean };
    security?: { cssMode?: "scoped" | "trusted"; htmlMode?: "sanitized" | "trusted"; showSanitizerWarnings?: boolean };
    providers?: ProviderConfiguration;
}

export const defaultConfig: HyperPbiConfig = {
    version: "1.0",
    bindings: { map: {} },
    interactions: { crossFilter: true, multiSelect: true, externalMode: "auto" },
    renderer: { showHeader: false, showRowCount: false, showStudioButton: true },
    security: { cssMode: "scoped", htmlMode: "sanitized", showSanitizerWarnings: false },
    providers: defaultProviderConfig
};

export const defaultConfigJson = JSON.stringify(defaultConfig, null, 2);

export function parseConfig(text: string): { config?: HyperPbiConfig; errors: string[] } {
    const parsed = parseJson(text || defaultConfigJson);
    if (parsed.error) return { errors: [`Configuration JSON: ${parsed.error}`] };
    if (!parsed.value || typeof parsed.value !== "object") return { errors: ["Configuration must be a JSON object."] };
    const candidate = parsed.value as Partial<HyperPbiConfig>;
    if (candidate.version && candidate.version !== "1.0") return { errors: [`Unsupported configuration version: ${candidate.version}`] };
    const providers: ProviderConfiguration = { ...defaultConfig.providers, ...candidate.providers, basemap: { provider: candidate.providers?.basemap?.provider ?? defaultConfig.providers?.basemap?.provider ?? "none", enabled: candidate.providers?.basemap?.enabled ?? defaultConfig.providers?.basemap?.enabled ?? false, ...defaultConfig.providers?.basemap, ...candidate.providers?.basemap }, geocoder: { provider: candidate.providers?.geocoder?.provider ?? defaultConfig.providers?.geocoder?.provider ?? "none", enabled: candidate.providers?.geocoder?.enabled ?? defaultConfig.providers?.geocoder?.enabled ?? false, ...defaultConfig.providers?.geocoder, ...candidate.providers?.geocoder } };
    const config: HyperPbiConfig = { ...defaultConfig, ...candidate, version: "1.0", bindings: { ...defaultConfig.bindings, ...candidate.bindings }, interactions: { ...defaultConfig.interactions, ...candidate.interactions }, renderer: { ...defaultConfig.renderer, ...candidate.renderer }, security: { ...defaultConfig.security, ...candidate.security }, providers };
    const errors = validateProviderConfig(config.providers);
    if (config.security?.cssMode && !["scoped", "trusted"].includes(config.security.cssMode)) errors.push("security.cssMode must be scoped or trusted.");
    if (config.security?.htmlMode && !["sanitized", "trusted"].includes(config.security.htmlMode)) errors.push("security.htmlMode must be sanitized or trusted.");
    if (config.interactions?.externalMode && !["auto", "filter", "selection"].includes(config.interactions.externalMode)) errors.push("interactions.externalMode must be auto, filter, or selection.");
    if (config.providers?.mode && !["core", "maps"].includes(config.providers.mode)) errors.push("providers.mode must be core or maps.");
    if (config.providers?.basemap?.provider && !["none", "osm", "customTile"].includes(config.providers.basemap.provider)) errors.push("Unknown basemap provider.");
    if (config.providers?.geocoder?.provider && !["none", "nominatim", "arcgis", "custom"].includes(config.providers.geocoder.provider)) errors.push("Unknown geocoder provider.");
    return { config, errors };
}

export function resolveConfiguredField(fields: Record<string, NormalizedField>, reference: string | undefined): string | undefined {
    if (!reference) return undefined;
    if (fields[reference]) return reference;
    const normalized = reference.trim().toLowerCase();
    return Object.values(fields).find(field => field.displayName.trim().toLowerCase() === normalized || field.queryName?.trim().toLowerCase() === normalized)?.key;
}
