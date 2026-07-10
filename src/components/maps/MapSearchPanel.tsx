import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { MapSearchDefinition } from "../../schema/mapSchema";
import type { GeocoderSearchResult } from "../../providers/providerTypes";
import { getGeocoderProvider } from "../../providers/geocoderProviderRegistry";
import { resolveProviderPolicy } from "../../providers/providerPolicy";
import { useRenderContext } from "../../render/RenderContext";

function safeSearchError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (/^Geocoder HTTP \d{3}$/.test(message) || /endpoint (?:is missing|must use HTTPS)/i.test(message)) return message;
    return "Location search failed. Check the configured provider and try again.";
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
    const policy = resolveProviderPolicy(providers, context.webAccessAvailable);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeocoderSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | undefined>(policy.geocoderReason);
    const controllerRef = useRef<AbortController | null>(null);
    const activeQueryRef = useRef<string | null>(null);

    useEffect(() => () => {
        controllerRef.current?.abort();
        if (definition?.clearMarkerOnClose) onClearResult();
    }, []);

    const submit = async (event: Event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (trimmed.length < 3) {
            setStatus("Enter at least 3 characters to search.");
            setResults([]);
            return;
        }
        if (!policy.geocoderAllowed || !geocoder) {
            setStatus(policy.geocoderReason ?? "Location search is unavailable.");
            return;
        }
        if (loading && activeQueryRef.current === trimmed) return;
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        activeQueryRef.current = trimmed;
        setLoading(true);
        setStatus("Searching…");
        setResults([]);
        try {
            const found = provider.search
                ? await provider.search(trimmed, geocoder, controller.signal)
                : await provider.geocode(trimmed, geocoder, controller.signal).then(result => result ? [{ ...result, label: trimmed, provider: provider.id }] : []);
            if (controller.signal.aborted) return;
            setResults(found.slice(0, 5));
            setStatus(found.length ? `${found.length} result${found.length === 1 ? "" : "s"} found.` : "No locations matched your search.");
        } catch (error) {
            if (!controller.signal.aborted) setStatus(safeSearchError(error));
        } finally {
            if (controllerRef.current === controller) {
                controllerRef.current = null;
                activeQueryRef.current = null;
                setLoading(false);
            }
        }
    };

    const clear = () => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        activeQueryRef.current = null;
        setLoading(false);
        setQuery("");
        setResults([]);
        setStatus(policy.geocoderReason);
        onClearResult();
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
                        <li key={`${result.provider}-${result.latitude}-${result.longitude}-${index}`}>
                            <button type="button" title={result.label ?? "Search result"} onClick={() => onResult(result)}>
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
