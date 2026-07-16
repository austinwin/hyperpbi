import { GeocodeCache } from "./geocodeCache";
import { GeocodeResult, GeocoderConfig, GeocoderProvider } from "../providerTypes";
import { normalizeAddress } from "./normalizeAddress";

export class GeocodeQueue {
    private controller?: AbortController;
    private stopped = true;
    private generation = 0;

    constructor(
        private provider: GeocoderProvider,
        private config: GeocoderConfig,
        private cache = new GeocodeCache(config.cacheEntries),
        private wait?: (ms: number) => Promise<void>,
    ) {}

    stop(): void {
        this.stopped = true;
        this.generation++;
        this.controller?.abort();
        this.controller = undefined;
    }

    clearCache(): void {
        this.cache.clear();
    }

    cacheEntries() {
        return this.cache.toJSON();
    }

    async run(
        addresses: string[],
        onResult?: (result: GeocodeResult) => void,
    ): Promise<GeocodeResult[]> {
        // A queue instance owns a single run. Superseding prevents interleaved
        // rate-limit streams and duplicate requests during rapid filtering.
        this.stop();
        this.stopped = false;
        const generation = this.generation;
        const controller = new AbortController();
        this.controller = controller;
        const results: GeocodeResult[] = [];
        const interval = 1000 / Math.min(1, Math.max(0.05, this.config.rateLimitPerSecond ?? 1));
        const active = () =>
            !this.stopped &&
            this.generation === generation &&
            this.controller === controller &&
            !controller.signal.aborted;

        try {
            for (let index = 0; index < addresses.length && active(); index++) {
                const sourceAddress = addresses[index];
                const normalizedAddress = normalizeAddress(sourceAddress);
                const base = {
                    sourceAddress,
                    normalizedAddress,
                    provider: this.provider.id,
                    timestamp: new Date().toISOString(),
                };
                if (!normalizedAddress) {
                    const item: GeocodeResult = {
                        ...base,
                        status: "skipped",
                        error: "Address is empty.",
                        cacheHit: false,
                    };
                    results.push(item);
                    onResult?.(item);
                    continue;
                }
                const cached = this.config.cache !== false
                    ? this.cache.get(normalizedAddress)
                    : undefined;
                if (cached) {
                    const item: GeocodeResult = {
                        ...base,
                        status: "cached",
                        latitude: cached.latitude,
                        longitude: cached.longitude,
                        cacheHit: true,
                    };
                    results.push(item);
                    onResult?.(item);
                } else {
                    try {
                        const value = await this.provider.geocode(
                            sourceAddress,
                            this.config,
                            controller.signal,
                        );
                        if (!active()) break;
                        const item: GeocodeResult = value
                            ? { ...base, status: "success", ...value, cacheHit: false }
                            : { ...base, status: "failed", error: "No result.", cacheHit: false };
                        if (value && this.config.cache !== false)
                            this.cache.set(normalizedAddress, {
                                ...value,
                                provider: this.provider.id,
                                timestamp: item.timestamp,
                            });
                        results.push(item);
                        onResult?.(item);
                    } catch (error) {
                        if (!active()) break;
                        const item: GeocodeResult = {
                            ...base,
                            status: "failed",
                            error: error instanceof Error ? error.message : String(error),
                            cacheHit: false,
                        };
                        results.push(item);
                        onResult?.(item);
                    }
                }
                if (index < addresses.length - 1 && active())
                    await waitWithAbort(interval, controller.signal, this.wait);
            }
        } catch (error) {
            if (active()) throw error;
        } finally {
            if (this.controller === controller) this.controller = undefined;
        }
        return results;
    }
}

function waitWithAbort(
    milliseconds: number,
    signal: AbortSignal,
    customWait?: (ms: number) => Promise<void>,
): Promise<void> {
    if (!customWait) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(done, milliseconds);
            const onAbort = () => {
                clearTimeout(timer);
                cleanup();
                reject(signal.reason ?? new DOMException("Geocoding was aborted.", "AbortError"));
            };
            function cleanup() {
                signal.removeEventListener("abort", onAbort);
            }
            function done() {
                cleanup();
                resolve();
            }
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
        });
    }
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (callback: () => void) => {
            if (settled) return;
            settled = true;
            signal.removeEventListener("abort", onAbort);
            callback();
        };
        const onAbort = () => finish(() => reject(
            signal.reason ?? new DOMException("Geocoding was aborted.", "AbortError"),
        ));
        if (signal.aborted) {
            onAbort();
            return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
        customWait(milliseconds).then(
            () => finish(resolve),
            error => finish(() => reject(error)),
        );
    });
}
