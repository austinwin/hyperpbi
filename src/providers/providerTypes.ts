export type BasemapProviderId = "none" | "osm" | "customTile";
export type GeocoderProviderId = "none" | "nominatim" | "arcgis" | "custom";
export interface BasemapConfig { provider: BasemapProviderId; enabled: boolean; tileUrl?: string; attribution?: string; maxZoom?: number; }
export interface GeocodeCacheEntry { latitude: number; longitude: number; provider: string; timestamp: string; }
export interface GeocoderConfig { provider: GeocoderProviderId; enabled: boolean; endpoint?: string; rateLimitPerSecond?: number; cache?: boolean; autocomplete?: false; userTriggeredOnly?: true; resultLimit?: number; minScore?: number; countryCode?: string; category?: string; token?: string; cacheEntries?: Record<string, GeocodeCacheEntry>; }
export interface ProviderConfiguration { mode?: "core" | "maps"; basemap?: BasemapConfig; geocoder?: GeocoderConfig; privacyAcknowledged?: boolean; }
export interface ProviderEndpointAccess { allowed:boolean;endpoint?:string;reason?:string; }
export interface ProviderAccessState { tiles:ProviderEndpointAccess;geocoder:ProviderEndpointAccess; }
export type ProviderRequestErrorCode="TIMEOUT"|"WEB_ACCESS_DENIED"|"AUTHENTICATION_FAILED"|"RATE_LIMITED"|"INVALID_RESPONSE"|"NETWORK_OR_CORS"|"NO_RESULTS"|"PROVIDER_DISABLED"|"PRIVACY_ACK_REQUIRED"|"INVALID_CONFIGURATION";
export interface BasemapProvider { id: BasemapProviderId; label: string; external: boolean; defaults: BasemapConfig; }
export interface GeocodeResult { sourceAddress: string; normalizedAddress: string; status: "pending" | "success" | "failed" | "cached" | "skipped"; latitude?: number; longitude?: number; provider: string; error?: string; timestamp: string; cacheHit: boolean; }
export interface GeocoderSearchResult { latitude: number; longitude: number; label?: string; /** [west, south, east, north] */ bounds?: [number, number, number, number]; provider: string; }
export interface GeocoderProvider { id: GeocoderProviderId; label: string; external: boolean; defaults: GeocoderConfig; geocode(address:string,config:GeocoderConfig,signal?:AbortSignal):Promise<{latitude:number;longitude:number}|null>; search?(query:string,config:GeocoderConfig,signal?:AbortSignal):Promise<GeocoderSearchResult[]>; }
