import { afterEach, describe, expect, it, vi } from "vitest";
import { executeArcGisFeatureQuery } from "../src/maps/arcgis/arcGisFeatureQuery";

const layerUrl = (name: string) =>
    `https://services.arcgis.com/example/ArcGIS/rest/services/${name}/FeatureServer/0`;

function metadata() {
    return {
        name: "Lifecycle",
        objectIdField: "OBJECTID",
        geometryType: "esriGeometryPoint",
        capabilities: "Query",
        supportedQueryFormats: "GEOJSON",
        maxRecordCount: 2,
        advancedQueryCapabilities: { supportsPagination: true },
        fields: [{ name: "OBJECTID", type: "esriFieldTypeOID" }],
    };
}

function collection(ids: number[], exceededTransferLimit = false) {
    return {
        type: "FeatureCollection",
        exceededTransferLimit,
        features: ids.map(id => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [-95 + id / 1000, 29] },
            properties: { OBJECTID: id },
        })),
    };
}

const jsonResponse = (value: unknown) =>
    new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("ArcGIS feature query concurrency and cache correctness", () => {
    it("deduplicates identical in-flight metadata and feature requests", async () => {
        let resolveQuery!: (response: Response) => void;
        const fetchMock = vi.fn((input: RequestInfo | URL) =>
            String(input).includes("f=pjson")
                ? Promise.resolve(jsonResponse(metadata()))
                : new Promise<Response>(resolve => { resolveQuery = resolve; }),
        );
        vi.stubGlobal("fetch", fetchMock);
        const request = { url: layerUrl("Deduplicated"), maxFeatures: 10 };
        const first = executeArcGisFeatureQuery(request);
        const second = executeArcGisFeatureQuery(request);
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
        resolveQuery(jsonResponse(collection([1])));
        const [left, right] = await Promise.all([first, second]);
        expect(left.features).toEqual(right.features);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("cancels one subscriber without aborting a shared request needed by another", async () => {
        let resolveQuery!: (response: Response) => void;
        let sharedSignal: AbortSignal | undefined;
        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            sharedSignal = init?.signal ?? sharedSignal ?? undefined;
            return String(input).includes("f=pjson")
                ? Promise.resolve(jsonResponse(metadata()))
                : new Promise<Response>(resolve => { resolveQuery = resolve; });
        });
        vi.stubGlobal("fetch", fetchMock);
        const firstController = new AbortController();
        const secondController = new AbortController();
        const request = { url: layerUrl("SubscriberCancellation"), maxFeatures: 10 };
        const first = executeArcGisFeatureQuery({ ...request, signal: firstController.signal });
        const second = executeArcGisFeatureQuery({ ...request, signal: secondController.signal });
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
        firstController.abort();
        await expect(first).rejects.toMatchObject({ name: "AbortError" });
        expect(sharedSignal?.aborted).toBe(false);
        resolveQuery(jsonResponse(collection([7])));
        await expect(second).resolves.toMatchObject({ features: [expect.objectContaining({ objectId: 7 })] });
    });

    it("aborts the underlying fetch when every subscriber cancels", async () => {
        let sharedSignal: AbortSignal | undefined;
        const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
            sharedSignal = init?.signal ?? undefined;
            return new Promise<Response>((_resolve, reject) => {
                sharedSignal?.addEventListener("abort", () => reject(
                    sharedSignal?.reason ?? new DOMException("Aborted", "AbortError"),
                ), { once: true });
            });
        });
        vi.stubGlobal("fetch", fetchMock);
        const firstController = new AbortController();
        const secondController = new AbortController();
        const request = { url: layerUrl("AllCancelled") };
        const first = executeArcGisFeatureQuery({ ...request, signal: firstController.signal });
        const second = executeArcGisFeatureQuery({ ...request, signal: secondController.signal });
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        firstController.abort();
        await expect(first).rejects.toMatchObject({ name: "AbortError" });
        expect(sharedSignal?.aborted).toBe(false);
        secondController.abort();
        await expect(second).rejects.toMatchObject({ name: "AbortError" });
        expect(sharedSignal?.aborted).toBe(true);
    });

    it("separates cache entries by feature limit and preserves truncation metadata", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse(metadata()))
            .mockResolvedValueOnce(jsonResponse(collection([1], true)))
            .mockResolvedValueOnce(jsonResponse(collection([1, 2], false)));
        vi.stubGlobal("fetch", fetchMock);
        const url = layerUrl("CacheLimit");
        const first = await executeArcGisFeatureQuery({ url, maxFeatures: 1, cacheMinutes: 5 });
        const second = await executeArcGisFeatureQuery({ url, maxFeatures: 2, cacheMinutes: 5 });
        const cached = await executeArcGisFeatureQuery({ url, maxFeatures: 1, cacheMinutes: 5 });
        expect(first).toMatchObject({ truncated: true, usedCache: false });
        expect(second.features).toHaveLength(2);
        expect(cached).toMatchObject({ truncated: true, usedCache: true });
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("stops pagination when a service repeats the same page", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse(metadata()))
            .mockResolvedValueOnce(jsonResponse(collection([1, 2], true)))
            .mockResolvedValueOnce(jsonResponse(collection([1, 2], true)));
        vi.stubGlobal("fetch", fetchMock);
        const result = await executeArcGisFeatureQuery({
            url: layerUrl("RepeatedPage"),
            maxFeatures: 10,
            requestBatchSize: 2,
        });
        expect(result.features).toHaveLength(2);
        expect(result.requestCount).toBe(2);
        expect(result.truncated).toBe(true);
        expect(result.warnings.join(" ")).toMatch(/repeated a page/i);
    });
});
