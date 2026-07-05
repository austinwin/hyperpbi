import { MapBindingKeys, NormalizedField } from "../data/normalizeData";
import { parseJson } from "../utils/safeJson";
import { ProviderConfiguration } from "../providers/providerTypes";
import { defaultProviderConfig, validateProviderConfig } from "../providers/providerConfig";

export interface HyperPbiConfig {
    version: "1.0";
    bindings?: { map?: Partial<MapBindingKeys> };
    interactions?: { crossFilter?: boolean; multiSelect?: boolean };
    renderer?: { showHeader?: boolean; showRowCount?: boolean; showStudioButton?: boolean };
    providers?: ProviderConfiguration;
}

export const defaultConfig: HyperPbiConfig = {
    version: "1.0",
    bindings: { map: {} },
    interactions: { crossFilter: true, multiSelect: true },
    renderer: { showHeader: true, showRowCount: true, showStudioButton: true },
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
    const config: HyperPbiConfig = { ...defaultConfig, ...candidate, version: "1.0", bindings: { ...defaultConfig.bindings, ...candidate.bindings }, interactions: { ...defaultConfig.interactions, ...candidate.interactions }, renderer: { ...defaultConfig.renderer, ...candidate.renderer }, providers };
    return { config, errors: validateProviderConfig(config.providers) };
}

export function resolveConfiguredField(fields: Record<string, NormalizedField>, reference: string | undefined): string | undefined {
    if (!reference) return undefined;
    if (fields[reference]) return reference;
    const normalized = reference.trim().toLowerCase();
    return Object.values(fields).find(field => field.displayName.trim().toLowerCase() === normalized || field.queryName?.trim().toLowerCase() === normalized)?.key;
}
