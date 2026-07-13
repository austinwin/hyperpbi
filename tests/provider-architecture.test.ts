import { afterEach, describe, expect, it, vi } from "vitest";
import { getGeocoderProvider } from "../src/providers/geocoderProviderRegistry";
import {
  ProviderRequestError,
  providerFetch,
} from "../src/providers/providerRequest";
import { externalServiceAccess, resolveProviderPolicy } from "../src/providers/providerPolicy";
const config = {
  mode: "maps" as const,
  basemap: {
    provider: "osm" as const,
    enabled: true,
    tileUrl: "https://tile.example/{z}/{x}/{y}.png",
  },
  geocoder: {
    provider: "arcgis" as const,
    enabled: true,
    endpoint: "https://geo.example/GeocodeServer",
    autocomplete: false as const,
    userTriggeredOnly: true as const,
  },
  privacyAcknowledged: true,
};
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe("provider architecture", () => {
    it("keeps tile and geocoder access independent", () => {
    expect(
      resolveProviderPolicy(
        config,
        {
          tiles: { allowed: true },
          geocoder: { allowed: false, reason: "Geo denied" },
        },
        true,
      ),
    ).toMatchObject({
      tilesAllowed: true,
      geocoderAllowed: false,
      geocoderReason: "Geo denied",
    });
    expect(
      resolveProviderPolicy(
        config,
        {
          tiles: { allowed: false, reason: "Tiles denied" },
          geocoder: { allowed: true },
        },
        true,
      ),
    ).toMatchObject({
      tilesAllowed: false,
      geocoderAllowed: true,
      tilesReason: "Tiles denied",
    });
  });
  it("keeps ArcGIS service authorization independent from unrelated basemap access", () => {
    expect(externalServiceAccess(undefined, "https://tiles.arcgisonline.com/a/MapServer", true).allowed).toBe(true);
    const access = {
      tiles: { allowed: false, reason: "Basemap denied" },
      geocoder: { allowed: false, reason: "Geocoder disabled" },
      services: {
        "https://services.example": { allowed: true },
        "https://denied.example": { allowed: false, reason: "ArcGIS denied" },
      },
    };
    expect(externalServiceAccess(access, "https://services.example/arcgis/rest/services/Assets/FeatureServer").allowed).toBe(true);
    expect(externalServiceAccess(access, "https://denied.example/arcgis/rest/services/Assets/FeatureServer")).toMatchObject({ allowed: false, reason: "ArcGIS denied" });
    expect(externalServiceAccess(access, "https://unrelated.example/service").allowed).toBe(false);
    expect(resolveProviderPolicy(config, { ...access, tiles: { allowed: true } }, true).tilesAllowed).toBe(true);
  });
  it.each([
    [401, "AUTHENTICATION_FAILED"],
    [403, "AUTHENTICATION_FAILED"],
    [429, "RATE_LIMITED"],
  ] as const)("normalizes HTTP %s", async (status, code) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status })),
    );
    await expect(providerFetch("https://example.test")).rejects.toMatchObject({
      code,
    });
  });
  it("normalizes network failures without leaking URLs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("https://secret.test?token=secret")),
    );
    await expect(
      providerFetch("https://secret.test?token=secret"),
    ).rejects.toEqual(
      expect.objectContaining({
        code: "NETWORK_OR_CORS",
        message: expect.not.stringContaining("secret"),
      }),
    );
  });
  it("normalizes timeouts and removes the parent abort listener", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })));
    const timedOut = providerFetch("https://example.test", {}, 1000);
    const timeoutAssertion = expect(timedOut).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(1001);
    await timeoutAssertion;
    vi.useRealTimers();

    const parent = new AbortController();
    const remove = vi.spyOn(parent.signal, "removeEventListener");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await providerFetch("https://example.test", { signal: parent.signal });
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });
  it("uses the real ArcGIS registry, rejects malformed JSON, and does not expose tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 200 })),
    );
    await expect(
      getGeocoderProvider("arcgis").search!("Houston", {
        ...config.geocoder,
        token: "top-secret",
      }),
    ).rejects.toBeInstanceOf(ProviderRequestError);
  });
  it("uses the real Nominatim provider and returns bounded parsed results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { lat: "29.7", lon: "-95.3", display_name: "Houston" },
            { lat: "bad", lon: "0" },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const results = await getGeocoderProvider("nominatim").search!("Houston", {
      provider: "nominatim",
      enabled: true,
      endpoint: "https://nominatim.example/search",
      autocomplete: false,
      userTriggeredOnly: true,
      resultLimit: 2,
    });
    expect(results).toEqual([
      {
        latitude: 29.7,
        longitude: -95.3,
        label: "Houston",
        provider: "nominatim",
      },
    ]);
  });
});
