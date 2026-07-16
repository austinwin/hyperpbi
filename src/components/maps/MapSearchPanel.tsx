import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { MapSearchDefinition } from "../../schema/mapSchema";
import type { GeocoderSearchResult } from "../../providers/providerTypes";
import { getGeocoderProvider } from "../../providers/geocoderProviderRegistry";
import { resolveProviderPolicy } from "../../providers/providerPolicy";
import { useRenderContext } from "../../render/RenderContext";
import { providerErrorMessage } from "../../providers/providerRequest";

const SEARCH_CACHE_LIMIT = 50;

function safeSearchError(error: unknown): string {
    const message = providerErrorMessage(error);
    return `Location search failed: ${message || "check the configured provider and try again."}`;
}

function readCachedResult(
    cache: Map<string, GeocoderSearchResult[]>,
    key: string,
): GeocoderSearchResult[] | undefined {
    const value = cache.get(key);
    if (!value) return undefined;
    cache.delete(key);
    cache.set(key, value);
    return value;
}

function writeCachedResult(
    cache: Map<string, GeocoderSearchResult[]>,
    key: string,
    value: GeocoderSearchResult[],
): void {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > SEARCH_CACHE_LIMIT) {
        const oldest = cache.keys().next().value as string | undefined;
        if (oldest === undefined) break;
        cache.delete(oldest);
    }
}

export function MapSearchPanel({
    mapId,
    definition,
    onResult,
    onClearResult,
}: {
    mapId: string;
    definition?: MapSearchDefinition;
    onResult: (result: GeocoderSearchResult) => void;
    onClearResult: () => void;
}) {
    const context = useRenderContext();
    const providers = context.config.providers;
    const geocoder = providers?.geocoder;
    const provider = getGeocoderProvider(geocoder?.provider ?? "none");
    const policy = resolveProviderPolicy(providers, context.providerAccess ?? context.webAccessAvailable);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeocoderSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<GeocoderSearchResult>();
    const [status, setStatus] = useState<string | undefined>(policy.geocoderReason);
    const controllerRef = useRef<AbortController | null>(null);
    const activeQueryRef = useRef<string | null>(null);
    const requestGenerationRef = useRef(0);
    const cacheRef = useRef(new Map<string, GeocoderSearchResult[]>());
    const onResultRef = useRef(onResult);
    const onClearResultRef = useRef(onClearResult);
    const definitionRef = useRef(definition);
    onResultRef.current = onResult;
    onClearResultRef.current = onClearResult;
    definitionRef.current = definition;

    const providerConfigurationSignature = JSON.stringify({
        mapId,
        provider: geocoder?.provider,
        endpoint: geocoder?.endpoint,
        countryCode: geocoder?.countryCode,
        category: geocoder?.category,
        resultLimit: geocoder?.resultLimit,
        minScore: geocoder?.minScore,
        token: geocoder?.token,
        cache: geocoder?.cache,
        allowed: policy.geocoderAllowed,
        reason: policy.geocoderReason,
    });

    const cancelActiveRequest = () => {
        requestGenerationRef.current++;
        controllerRef.current?.abort();
        controllerRef.current = null;
        activeQueryRef.current = null;
    };

    useEffect(() => {
        cancelActiveRequest();
        cacheRef.current.clear();
        setLoading(false);
        setResults([]);
        setSelected(undefined);
        setStatus(policy.geocoderReason);
    }, [providerConfigurationSignature]);

    useEffect(() => () => {
        cancelActiveRequest();
        cacheRef.current.clear();
        if (definitionRef.current?.clearMarkerOnClose) onClearResultRef.current();
    }, []);

    const submit = async (event: Event) => {
        event.preventDefault();
        const trimmed = query.trim();
        const normalized = trimmed.toLocaleLowerCase();
        if (controllerRef.current && activeQueryRef.current === normalized) return;
        if (trimmed.length < 3) {
            cancelActiveRequest();
            setLoading(false);
            setStatus("Enter at least 3 characters to search.");
            setResults([]);
            return;
        }
        if (!policy.geocoderAllowed || !geocoder) {
            cancelActiveRequest();
            setLoading(false);
            setStatus(policy.geocoderReason ?? "Location search is unavailable.");
            return;
        }

        cancelActiveRequest();
        const controller = new AbortController();
        const generation = requestGenerationRef.current;
        controllerRef.current = controller;
        activeQueryRef.current = normalized;
        setLoading(true);
        setStatus("Searching…");
        setResults([]);
        try {
            const cached = geocoder.cache !== false
                ? readCachedResult(cacheRef.current, normalized)
                : undefined;
            const found = cached ?? (provider.search
                ? await provider.search(trimmed, geocoder, controller.signal)
                : await provider.geocode(trimmed, geocoder, controller.signal).then(result =>
                    result ? [{ ...result, label: trimmed, provider: provider.id }] : [],
                )) ?? [];
            if (geocoder.cache !== false && !cached)
                writeCachedResult(cacheRef.current, normalized, found);
            if (controller.signal.aborted || requestGenerationRef.current !== generation) return;

            const limited = found.slice(0, 5);
            setResults(limited);
            const automatic = limited.length === 1 ||
                (limited.length > 1 && definitionRef.current?.autoSelectFirst !== false);
            if (automatic) {
                setSelected(limited[0]);
                onResultRef.current(limited[0]);
                setStatus(`Showing ${limited[0].label ?? "search result"}`);
            } else {
                setSelected(undefined);
                setStatus(limited.length
                    ? `${limited.length} results found. Choose a location.`
                    : "No locations matched your search.");
            }
        } catch (error) {
            if (!controller.signal.aborted && requestGenerationRef.current === generation)
                setStatus(safeSearchError(error));
        } finally {
            if (
                controllerRef.current === controller &&
                requestGenerationRef.current === generation
            ) {
                controllerRef.current = null;
                activeQueryRef.current = null;
                setLoading(false);
            }
        }
    };

    const clear = () => {
        cancelActiveRequest();
        setLoading(false);
        setQuery("");
        setResults([]);
        setSelected(undefined);
        setStatus(policy.geocoderReason);
        onClearResultRef.current();
    };

    return (
        <div class="hp-map-search-panel">
            <form class="hp-map-search-form" onSubmit={submit}>
                <label for={`${mapId}-map-search-input`}>Location</label>
                <div class="hp-map-search-input-row">
                    <input
                        id={`${mapId}-map-search-input`}
                        type="search"
                        value={query}
                        placeholder={definition?.placeholder ?? "Search for a place or address"}
                        autocomplete="off"
                        disabled={!policy.geocoderAllowed}
                        onInput={(event: Event) => setQuery((event.currentTarget as HTMLInputElement).value)}
                    />
                    <button type="submit" disabled={!policy.geocoderAllowed} aria-busy={loading}>{loading ? "Searching" : "Search"}</button>
                    <button type="button" class="hp-map-search-clear" disabled={!query && results.length === 0} onClick={clear}>Clear</button>
                </div>
            </form>
            <div class="hp-map-search-provider">Provider: <strong>{provider.label}</strong></div>
            {status && <div class={`hp-map-search-status ${policy.geocoderAllowed ? "" : "is-unavailable"}`} role="status">{status}</div>}
            {results.length > 0 && (
                <ul class="hp-map-search-results" aria-label="Location search results">
                    {results.map((result, index) => (
                        <li key={`${result.provider}-${result.latitude}-${result.longitude}-${result.label ?? ""}-${index}`}>
                            <button type="button" title={result.label ?? "Search result"} aria-current={selected === result ? "true" : undefined} class={selected === result ? "is-selected" : ""} onClick={() => {
                                setSelected(result);
                                onResultRef.current(result);
                                setStatus(`Showing ${result.label ?? "search result"}`);
                            }}>
                                <strong>{result.label ?? `Result ${index + 1}`}</strong>
                                <span>{result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
