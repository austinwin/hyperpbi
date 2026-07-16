import { GeocodeCacheEntry } from "../providerTypes";
import { normalizeAddress } from "./normalizeAddress";

const MAX_GEOCODE_CACHE_ENTRIES = 10_000;

export class GeocodeCache {
    private entries = new Map<string, GeocodeCacheEntry>();

    constructor(initial: Record<string, GeocodeCacheEntry> = {}) {
        for (const [address, value] of Object.entries(initial))
            this.set(address, value);
    }

    get(address: string): GeocodeCacheEntry | undefined {
        const key = normalizeAddress(address);
        const value = this.entries.get(key);
        if (!value) return undefined;
        this.entries.delete(key);
        this.entries.set(key, value);
        return value;
    }

    set(address: string, value: GeocodeCacheEntry): void {
        const key = normalizeAddress(address);
        if (!key) return;
        this.entries.delete(key);
        this.entries.set(key, value);
        while (this.entries.size > MAX_GEOCODE_CACHE_ENTRIES) {
            const oldest = this.entries.keys().next().value as string | undefined;
            if (oldest === undefined) break;
            this.entries.delete(oldest);
        }
    }

    clear(): void {
        this.entries.clear();
    }

    toJSON(): Record<string, GeocodeCacheEntry> {
        return Object.fromEntries(this.entries);
    }
}
