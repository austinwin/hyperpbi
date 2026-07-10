// ── ArcGIS Feature Query Tests ───────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the query executor with mocked fetch
const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

// Helper to create a mock GeoJSON response
function mockGeoJsonResponse(features: unknown[] = [], overrides: Record<string, unknown> = {}) {
    return {
        type: "FeatureCollection",
        features: features.map((f, i) => ({
            type: "Feature",
            geometry: (f as Record<string, unknown>).geometry ?? { type: "Point", coordinates: [-95, 29] },
            properties: { OBJECTID: i + 1, ...((f as Record<string, unknown>).properties ?? {}) },
        })),
        exceededTransferLimit: false,
        ...overrides,
    };
}

function mockEsriJsonResponse(features: unknown[] = [], overrides: Record<string, unknown> = {}) {
    return {
        objectIdFieldName: "OBJECTID",
        geometryType: "esriGeometryPoint",
        features: features.map((f, i) => ({
            attributes: { OBJECTID: i + 1, ...((f as Record<string, unknown>).attributes ?? {}) },
            geometry: { x: -95, y: 29 },
        })),
        exceededTransferLimit: false,
        ...overrides,
    };
}

function mockMetadata(overrides: Record<string, unknown> = {}) {
    return {
        name: "Test Layer",
        type: "Feature Layer",
        objectIdField: "OBJECTID",
        geometryType: "esriGeometryPoint",
        capabilities: "Query",
        supportedQueryFormats: "JSON",
        maxRecordCount: 1000,
        spatialReference: { wkid: 4326 },
        advancedQueryCapabilities: { supportsPagination: true },
        ...overrides,
    };
}

beforeEach(() => {
    mockFetch.mockReset();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe("ArcGIS Feature Query Executor", () => {
    // We import dynamically to get the module with the stubbed fetch
    async function getModule() {
        return await import("../src/maps/arcgis/arcGisFeatureQuery");
    }

    it("queries a direct layer URL", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: "GEOJSON" })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([{ geometry: { type: "Point", coordinates: [-95, 29] }, properties: { OBJECTID: 1 } }])) });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            maxFeatures: 10,
        });

        expect(result.features).toHaveLength(1);
        expect(result.objectIdField).toBe("OBJECTID");
        expect(result.usedCache).toBe(false);
        expect(result.requestCount).toBe(1);
    });

    it("resolves service root URL with layer ID", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: "GEOJSON" })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([])) });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer",
            layerId: 5,
            maxFeatures: 10,
        });

        expect(result.sourceUrl).toContain("/5");
        expect(mockFetch).toHaveBeenCalledTimes(2);
        // First call should be metadata
        const metaCall = mockFetch.mock.calls[0][0] as string;
        expect(metaCall).toContain("f=pjson");
    });

    it("makes exactly one metadata request", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: 'GEOJSON' })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([])) });

        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/3",
            maxFeatures: 10,
        });

        // Count metadata calls (f=pjson)
        const metaCalls = mockFetch.mock.calls.filter((c: unknown[]) => String(c[0]).includes("f=pjson"));
        expect(metaCalls).toHaveLength(1);
    });

    it("prefers GeoJSON when supported", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: "GEOJSON" })),
            })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([])) });

        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
        });

        const queryCallUrl = mockFetch.mock.calls[1][0] as string;
        const queryCallBody = String((mockFetch.mock.calls[1][1] as RequestInit)?.body ?? "");
        expect(queryCallBody).toContain("f=geojson");
    });

    it("falls back to Esri JSON when GeoJSON unsupported", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: "JSON" })),
            })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockEsriJsonResponse([])) });

        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
        });

        const queryCallBody2 = String((mockFetch.mock.calls[1][1] as RequestInit)?.body ?? "");
        expect(queryCallBody2).toContain("f=json");
    });

    it("uses custom object ID field from metadata", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockMetadata({ objectIdField: "OBJECTID_1", supportedQueryFormats: "GEOJSON" })),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGeoJsonResponse([
                    { properties: { OBJECTID_1: 42, NAME: "Test" } },
                ])),
            });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
        });

        expect(result.features[0].objectId).toBe(42);
        expect(result.objectIdField).toBe("OBJECTID_1");
    });

    it("uses FID as custom OID in Esri JSON", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockMetadata({ objectIdField: "FID" })),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockEsriJsonResponse([
                    { attributes: { FID: 99, NAME: "FID Test" } },
                ])),
            });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
        });

        expect(result.features[0].objectId).toBe(99);
        expect(result.objectIdField).toBe("FID");
    });

    it("deduplicates features by object ID", async () => {
        const feature = { properties: { OBJECTID: 1, NAME: "Duplicate" } };
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: 'GEOJSON' })) })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGeoJsonResponse([feature, feature])),
            });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
        });

        expect(result.features).toHaveLength(1);
    });

    it("sets usedCache: true on cache hit", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: 'GEOJSON' })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([{ properties: { OBJECTID: 1 } }])) });

        const { executeArcGisFeatureQuery } = await getModule();

        // First call populates cache
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            cacheMinutes: 5,
        });

        // Second call should hit cache (no additional fetch needed)
        mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: 'GEOJSON' })) });
        const result2 = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            cacheMinutes: 5,
        });

        expect(result2.usedCache).toBe(true);
        expect(result2.features).toHaveLength(1);
    });

    it("rejects non-HTTPS URLs", async () => {
        const { executeArcGisFeatureQuery } = await getModule();
        // eslint-disable-next-line powerbi-visuals/no-http-string
        const httpUrl = "http://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0";
        await expect(executeArcGisFeatureQuery({
            url: httpUrl,
        })).rejects.toThrow("HTTPS");
    });

    it("rejects URLs with embedded credentials", async () => {
        const { executeArcGisFeatureQuery } = await getModule();
        await expect(executeArcGisFeatureQuery({
            url: "https://user:pass@services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
        })).rejects.toThrow();
    });

    it("handles pagination with transfer limit", async () => {
        // Create 250 features for pagination test
        const page1Features = Array.from({ length: 100 }, (_, i) => ({
            properties: { OBJECTID: i + 1 },
        }));
        const page2Features = Array.from({ length: 100 }, (_, i) => ({
            properties: { OBJECTID: i + 101 },
        }));
        const page3Features = Array.from({ length: 50 }, (_, i) => ({
            properties: { OBJECTID: i + 201 },
        }));

        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ maxRecordCount: 100, supportedQueryFormats: "GEOJSON" })) })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGeoJsonResponse(page1Features, { exceededTransferLimit: true })),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGeoJsonResponse(page2Features, { exceededTransferLimit: true })),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGeoJsonResponse(page3Features, { exceededTransferLimit: false })),
            });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            maxFeatures: 300,
            requestBatchSize: 100,
            cacheMinutes: 0,
        });

        expect(result.features).toHaveLength(250);
        expect(result.requestCount).toBe(3);
    });

    it("passes viewport envelope on first and subsequent pages", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ maxRecordCount: 50, supportedQueryFormats: "GEOJSON" })) })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(
                    mockGeoJsonResponse(
                        Array.from({ length: 50 }, (_, i) => ({ properties: { OBJECTID: i + 1 } })),
                        { exceededTransferLimit: true }
                    )
                ),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(
                    mockGeoJsonResponse(
                        Array.from({ length: 30 }, (_, i) => ({ properties: { OBJECTID: i + 51 } })),
                        { exceededTransferLimit: false }
                    )
                ),
            });

        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            viewportQuery: true,
            viewport: [-96, 29, -94, 31],
            maxFeatures: 100,
            cacheMinutes: 0,
        });

        // All query requests (not metadata) should contain envelope params
        for (const call of mockFetch.mock.calls) {
            const url = String(call[0]);
            if (url.includes("f=geojson") || url.includes("f=json")) {
                const body = call[1]?.body;
                if (body) {
                    expect(body.toString()).toContain("esriGeometryEnvelope");
                    expect(body.toString()).toContain("esriSpatialRelIntersects");
                }
            }
        }
    });

    it("stops pagination when no features returned", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ maxRecordCount: 100 })) })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockGeoJsonResponse([], { exceededTransferLimit: false })),
            });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            maxFeatures: 500,
            requestBatchSize: 100,
            cacheMinutes: 0,
        });

        expect(result.features).toHaveLength(0);
        expect(result.requestCount).toBe(1);
    });

    it("fetches with credentials:omit, no-referrer, no-store", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: 'GEOJSON' })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([])) });

        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
        });

        // Verify security headers on every fetch call
        for (const call of mockFetch.mock.calls) {
            const init = call[1] as RequestInit;
            expect(init.credentials).toBe("omit");
            expect(init.referrerPolicy).toBe("no-referrer");
            expect(init.cache).toBe("no-store");
        }
    });

    it("respects definition expression in WHERE clause", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: 'GEOJSON' })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([])) });

        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            definitionExpression: "STATUS = 'Active'",
        });

        // Check that the WHERE clause in the query body includes the definition expression
        const queryCall = mockFetch.mock.calls[1];
        const body = queryCall[1]?.body?.toString() ?? "";
        expect(body).toContain("STATUS");
    });

    it("respects maxFeatures limit", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ maxRecordCount: 100 })) })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(
                    mockGeoJsonResponse(
                        Array.from({ length: 100 }, (_, i) => ({ properties: { OBJECTID: i + 1 } })),
                        { exceededTransferLimit: true }
                    )
                ),
            });

        const { executeArcGisFeatureQuery } = await getModule();
        const result = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/Test/FeatureServer/0",
            maxFeatures: 50,
            cacheMinutes: 0,
        });

        expect(result.features.length).toBeLessThanOrEqual(50);
    });

    it("collects only actual opt-in service renderer and label metadata fields", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({
                supportedQueryFormats: "GEOJSON",
                fields: ["OBJECTID", "STATUS", "CATEGORY", "NORMALIZER", "SIZE_FIELD", "COLOR_FIELD", "LABEL_A", "LABEL_B", "LABEL_C", "LABEL_D"].map(name => ({ name, type: name === "OBJECTID" ? "esriFieldTypeOID" : "esriFieldTypeString" })),
                drawingInfo: {
                    renderer: { type: "uniqueValue", field: "STATUS", field1: "CATEGORY", field2: "NOT_REAL", normalizationField: "NORMALIZER", visualVariables: [{ field: "SIZE_FIELD" }], sizeInfo: { field: "SIZE_FIELD" }, colorInfo: { field: "COLOR_FIELD" } },
                    labelingInfo: [
                        { labelExpression: "[LABEL_A]" },
                        { labelExpressionInfo: { expression: "$feature.LABEL_B" } },
                        { labelExpressionInfo: { expression: '$feature["LABEL_C"]' } },
                        { labelExpressionInfo: { expression: "$feature['LABEL_D'] + $feature.NOT_REAL" } },
                    ],
                },
            })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([])) });
        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/MetadataFields/FeatureServer/0",
            useServiceRenderer: true,
            useServiceLabels: true,
        });
        const body = new URLSearchParams(String((mockFetch.mock.calls[1][1] as RequestInit).body));
        const outFields = body.get("outFields")?.split(",") ?? [];
        expect(outFields).toEqual(expect.arrayContaining(["STATUS", "CATEGORY", "NORMALIZER", "SIZE_FIELD", "COLOR_FIELD", "LABEL_A", "LABEL_B", "LABEL_C", "LABEL_D"]));
        expect(outFields).not.toContain("NOT_REAL");
    });

    it("normalizes and deduplicates join keys before the cache signature and IN clause", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: "GEOJSON", fields: [{ name: "OBJECTID", type: "esriFieldTypeOID" }, { name: "CODE", type: "esriFieldTypeString" }] })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([])) });
        const { executeArcGisFeatureQuery } = await getModule();
        await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/NormalizedJoin/FeatureServer/0",
            joinKeys: { field: "CODE", values: [" a-1 ", "A-1", ""], normalization: ["trim", "upper"] },
            queryStrategy: "keyBatches",
        });
        const body = new URLSearchParams(String((mockFetch.mock.calls[1][1] as RequestInit).body));
        expect(body.get("where")).toContain("'A-1'");
        expect(body.get("where")?.match(/A-1/g)).toHaveLength(1);
    });

    it("paginates every join-key batch using the same batch WHERE clause", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: "GEOJSON", maxRecordCount: 2, advancedQueryCapabilities: { supportsPagination: true }, fields: [{ name: "OBJECTID", type: "esriFieldTypeOID" }, { name: "CODE", type: "esriFieldTypeString" }] })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([{ properties: { OBJECTID: 1, CODE: "A" } }, { properties: { OBJECTID: 2, CODE: "A" } }], { exceededTransferLimit: true })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJsonResponse([{ properties: { OBJECTID: 3, CODE: "A" } }], { exceededTransferLimit: false })) });
        const { executeArcGisFeatureQuery } = await getModule();
        const value = await executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/PagedJoin/FeatureServer/0",
            joinKeys: { field: "CODE", values: ["A"], normalization: ["trim", "upper"] },
            queryStrategy: "auto", requestBatchSize: 2, maxFeatures: 10,
        });
        expect(value.features).toHaveLength(3);
        expect(value.requestCount).toBe(2);
        const whereClauses = mockFetch.mock.calls.slice(1).map(call => new URLSearchParams(String((call[1] as RequestInit).body)).get("where"));
        expect(new Set(whereClauses).size).toBe(1);
        expect(whereClauses[0]).toContain("CODE IN ('A')");
    });

    it("propagates parser warnings and enforces the practical 4326 output SR", async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMetadata({ supportedQueryFormats: "JSON" })) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ objectIdFieldName: "OBJECTID", features: [{ attributes: { OBJECTID: "OID-1" }, geometry: { paths: null } }] }) });
        const { executeArcGisFeatureQuery } = await getModule();
        const value = await executeArcGisFeatureQuery({ url: "https://services.arcgis.com/example/ArcGIS/rest/services/Warnings/FeatureServer/0" });
        expect(value.features[0].objectId).toBe("OID-1");
        expect(value.features[0].geometry).toBeNull();
        expect(value.warnings.join(" ")).toMatch(/malformed geometry/);
        await expect(executeArcGisFeatureQuery({ url: "https://services.arcgis.com/example/ArcGIS/rest/services/Warnings/FeatureServer/0", outputSpatialReference: 3857 })).rejects.toThrow(/4326/);
    });

    it("preserves ArcGIS metadata error context instead of replacing it with null", async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ error: { code: 499, message: "Token required", details: ["Public access disabled"] } }) });
        const { executeArcGisFeatureQuery } = await getModule();
        await expect(executeArcGisFeatureQuery({
            url: "https://services.arcgis.com/example/ArcGIS/rest/services/MetadataError/FeatureServer/0",
        })).rejects.toMatchObject({ name: "ArcGisAuthError", code: 499, url: expect.stringContaining("MetadataError") });
    });
});
