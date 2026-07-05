export type BasemapProviderId = "none" | "osm" | "customTile";
export type GeocoderProviderId = "none" | "nominatim" | "custom";
export interface BasemapConfig { provider: BasemapProviderId; enabled: boolean; tileUrl?: string; attribution?: string; maxZoom?: number; }
export interface GeocodeCacheEntry { latitude: number; longitude: number; provider: string; timestamp: string; }
export interface GeocoderConfig { provider: GeocoderProviderId; enabled: boolean; endpoint?: string; rateLimitPerSecond?: number; cache?: boolean; autocomplete?: false; userTriggeredOnly?: true; resultLimit?: number; cacheEntries?: Record<string, GeocodeCacheEntry>; }
export interface ProviderConfiguration { mode?: "core" | "maps"; basemap?: BasemapConfig; geocoder?: GeocoderConfig; privacyAcknowledged?: boolean; }
export interface BasemapProvider { id: BasemapProviderId; label: string; external: boolean; defaults: BasemapConfig; }
export interface GeocodeResult { sourceAddress: string; normalizedAddress: string; status: "pending" | "success" | "failed" | "cached" | "skipped"; latitude?: number; longitude?: number; provider: string; error?: string; timestamp: string; cacheHit: boolean; }
export interface GeocoderProvider { id: GeocoderProviderId; label: string; external: boolean; defaults: GeocoderConfig; geocode(address:string,config:GeocoderConfig,signal?:AbortSignal):Promise<{latitude:number;longitude:number}|null>; }
