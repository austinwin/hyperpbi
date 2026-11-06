import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRemoteGeoJsonLayers } from "../src/components/maps/runtime/useRemoteGeoJsonLayers";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

const access = () => ({ allowed: true });
const layer = (id: string, url = "https://public.miniup.app/features.geojson"): MapLayerDefinition => ({ id, name: id, source: { type: "geoJson", url } });
const response = (id: string) => new Response(JSON.stringify({ type: "FeatureCollection", features: [{ type: "Feature", id, properties: {}, geometry: { type: "Point", coordinates: [0, 0] } }] }));
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); }); };
afterEach(() => vi.unstubAllGlobals());
describe("independent remote GeoJSON loading", () => {
    it("deduplicates shared URLs and does not fetch hidden layers", async () => {
        const fetch = vi.fn().mockResolvedValue(response("latest")); vi.stubGlobal("fetch", fetch);
        const host = document.createElement("div"); let latest: ReturnType<typeof useRemoteGeoJsonLayers> = {};
        function Harness({ visible }: { visible: boolean }) { latest = useRemoteGeoJsonLayers([layer("a"), layer("b"), { ...layer("hidden", "https://public.miniup.app/hidden.geojson"), visible: false }], [], { a: visible, b: visible }, access); return <div />; }
        act(() => render(<Harness visible />, host)); await settle();
        expect(fetch).toHaveBeenCalledTimes(1); expect(latest.a.data).toBe(latest.b.data);
        act(() => render(<Harness visible={false} />, host)); await settle();
        expect(fetch).toHaveBeenCalledTimes(1); expect(latest.a.loading).toBe(false);
        act(() => render(null, host));
    });
    it("prevents an older response from replacing a newer source even if fetch ignores abort", async () => {
        let resolveOld!: (value: Response) => void;
        const fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce(response("new")); vi.stubGlobal("fetch", fetch);
        const host = document.createElement("div"); let latest: ReturnType<typeof useRemoteGeoJsonLayers> = {};
        function Harness({ url }: { url: string }) { latest = useRemoteGeoJsonLayers([layer("a", url)], [], undefined, access); return <div />; }
        act(() => render(<Harness url="https://public.miniup.app/old.geojson" />, host)); await settle();
        act(() => render(<Harness url="https://public.miniup.app/new.geojson" />, host)); await settle();
        resolveOld(response("old")); await settle();
        expect((latest.a.data as GeoJSON.FeatureCollection).features[0].id).toBe("new");
        expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
        act(() => render(null, host));
    });
    it("keeps inaccessible layers diagnosable without issuing denied network requests", async () => {
        const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); const denied = () => ({ allowed: false, reason: "Power BI tenant denied this origin" });
        const host = document.createElement("div"); let latest: ReturnType<typeof useRemoteGeoJsonLayers> = {};
        function Harness() { latest = useRemoteGeoJsonLayers([layer("a")], [], undefined, denied); return <div />; }
        act(() => render(<Harness />, host)); await settle();
        expect(fetch).not.toHaveBeenCalled(); expect(latest.a.error).toContain("tenant denied"); act(() => render(null, host));
    });
});
