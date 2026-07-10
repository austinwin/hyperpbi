import { validateProviderConfig } from "./providerConfig";
import { EXTERNAL_PROVIDERS_AVAILABLE } from "./providerBuild";
import { ProviderConfiguration } from "./providerTypes";

export interface ProviderPolicy {
    externalAvailable: boolean;
    certificationSafe: boolean;
    tilesAllowed: boolean;
    geocoderAllowed: boolean;
    geocoderReason?: string;
    warnings: string[];
}

export function geocoderUnavailableReason(
    config: ProviderConfiguration | undefined,
    webAccessAvailable = EXTERNAL_PROVIDERS_AVAILABLE,
    externalProvidersAvailable = EXTERNAL_PROVIDERS_AVAILABLE
): string | undefined {
    if (!externalProvidersAvailable || config?.mode === "core") return "Core package does not include external providers.";
    if (!webAccessAvailable) return "WebAccess is unavailable or denied by the Power BI host.";
    const geocoder = config?.geocoder;
    if (!geocoder?.enabled || geocoder.provider === "none") return "The geocoder provider is disabled.";
    if (!config?.privacyAcknowledged) return "Privacy acknowledgment is required before geocoding.";
    if (validateProviderConfig(config).length > 0) return "The geocoder provider configuration is invalid.";
    return undefined;
}

export function resolveProviderPolicy(
    config: ProviderConfiguration | undefined,
    webAccessAvailable = EXTERNAL_PROVIDERS_AVAILABLE
): ProviderPolicy {
    const externalAvailable = EXTERNAL_PROVIDERS_AVAILABLE && config?.mode !== "core" && webAccessAvailable;
    const tiles = Boolean(config?.basemap?.enabled && config.basemap.provider !== "none");
    const geocoder = Boolean(config?.geocoder?.enabled && config.geocoder.provider !== "none");
    const warnings: string[] = [];
    if ((tiles || geocoder) && !externalAvailable) {
        warnings.push(!EXTERNAL_PROVIDERS_AVAILABLE || config?.mode === "core"
            ? "External providers are unavailable in the core package. Use the maps package or disable providers."
            : "WebAccess is unavailable or denied by the Power BI host; external providers are disabled.");
    }
    if (geocoder && !config?.privacyAcknowledged) warnings.push("Acknowledge the address-data privacy warning before geocoding.");
    const geocoderReason = geocoderUnavailableReason(config, webAccessAvailable, EXTERNAL_PROVIDERS_AVAILABLE);
    return {
        externalAvailable,
        certificationSafe: !tiles && !geocoder,
        tilesAllowed: externalAvailable && tiles,
        geocoderAllowed: geocoderReason === undefined,
        geocoderReason,
        warnings,
    };
}
