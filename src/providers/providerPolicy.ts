import { validateProviderConfig } from "./providerConfig";
import { EXTERNAL_PROVIDERS_AVAILABLE } from "./providerBuild";
import { ProviderAccessState, ProviderConfiguration } from "./providerTypes";

export interface ProviderPolicy {
    externalAvailable: boolean;
    certificationSafe: boolean;
    tilesAllowed: boolean;
    geocoderAllowed: boolean;
    geocoderReason?: string;
    tilesReason?: string;
    warnings: string[];
}

export function geocoderUnavailableReason(
    config: ProviderConfiguration | undefined,
    access: boolean|ProviderAccessState = EXTERNAL_PROVIDERS_AVAILABLE,
    externalProvidersAvailable = EXTERNAL_PROVIDERS_AVAILABLE
): string | undefined {
    if (!externalProvidersAvailable || config?.mode === "core") return "Core package does not include external providers.";
    const geocoderAccess=typeof access==="boolean"?access:access.geocoder.allowed;if (!geocoderAccess) return typeof access==="boolean"?"WebAccess is unavailable or denied by the Power BI host.":access.geocoder.reason??"Geocoder WebAccess is unavailable or denied by the Power BI host.";
    const geocoder = config?.geocoder;
    if (!geocoder?.enabled || geocoder.provider === "none") return "The geocoder provider is disabled.";
    if (!config?.privacyAcknowledged) return "Privacy acknowledgment is required before geocoding.";
    if (validateProviderConfig(config).length > 0) return "The geocoder provider configuration is invalid.";
    return undefined;
}

export function resolveProviderPolicy(
    config: ProviderConfiguration | undefined,
    access: boolean|ProviderAccessState = EXTERNAL_PROVIDERS_AVAILABLE
): ProviderPolicy {
    const tileAccess=typeof access==="boolean"?access:access.tiles.allowed;const geocoderAccess=typeof access==="boolean"?access:access.geocoder.allowed;const packageAvailable=EXTERNAL_PROVIDERS_AVAILABLE&&config?.mode!=="core";const externalAvailable=packageAvailable&&(tileAccess||geocoderAccess);
    const tiles = Boolean(config?.basemap?.enabled && config.basemap.provider !== "none");
    const geocoder = Boolean(config?.geocoder?.enabled && config.geocoder.provider !== "none");
    const warnings: string[] = [];
    if ((tiles&&!tileAccess || geocoder&&!geocoderAccess) || (tiles||geocoder)&&!packageAvailable) {
        warnings.push(!EXTERNAL_PROVIDERS_AVAILABLE || config?.mode === "core"
            ? "External providers are unavailable in the core package. Use the maps package or disable providers."
            : "WebAccess is unavailable or denied by the Power BI host; external providers are disabled.");
    }
    if (geocoder && !config?.privacyAcknowledged) warnings.push("Acknowledge the address-data privacy warning before geocoding.");
    if(geocoder&&config?.geocoder?.provider==="nominatim"&&/^https:\/\/nominatim\.openstreetmap\.org(?:\/|$)/i.test(config.geocoder.endpoint??""))warnings.push("Public OSMF Nominatim is deliberately configured; it is rate-limited and is not a production-reliability guarantee. Autocomplete remains disabled.");
    const geocoderReason = geocoderUnavailableReason(config, access, EXTERNAL_PROVIDERS_AVAILABLE);const tilesReason=!packageAvailable?"Core package does not include external providers.":!tiles?"The basemap provider is disabled.":!tileAccess?(typeof access==="boolean"?"WebAccess is unavailable or denied by the Power BI host.":access.tiles.reason??"Tile WebAccess is unavailable or denied by the Power BI host."):undefined;
    return {
        externalAvailable,
        certificationSafe: !tiles && !geocoder,
        tilesAllowed: packageAvailable && tileAccess && tiles,
        geocoderAllowed: geocoderReason === undefined,
        geocoderReason,
        tilesReason,
        warnings,
    };
}
