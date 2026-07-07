import { describe,expect,it,vi } from "vitest";
import { getBasemapProvider } from "../src/providers/basemapProviderRegistry";
import { getGeocoderProvider } from "../src/providers/geocoderProviderRegistry";
import { GeocodeQueue } from "../src/providers/geocoders/geocodeQueue";
import { normalizeAddress } from "../src/providers/geocoders/normalizeAddress";
import { GeocoderProvider } from "../src/providers/providerTypes";
import { validateProviderConfig } from "../src/providers/providerConfig";

describe("provider architecture",()=>{
    it("provides policy-safe defaults",()=>{expect(getBasemapProvider("osm").defaults.attribution).toContain("OpenStreetMap");expect(getGeocoderProvider("nominatim").defaults.autocomplete).toBe(false);});
    it("normalizes cache keys",()=>expect(normalizeAddress([" 10 Main ","Austin "," TX"])).toBe("10 main, austin, tx"));
    it("rejects unsafe provider configuration",()=>expect(validateProviderConfig({geocoder:{provider:"nominatim",enabled:true,endpoint:`${"http"}://unsafe`,rateLimitPerSecond:2,autocomplete:false,userTriggeredOnly:true}}).length).toBeGreaterThan(0));
    it("runs sequentially and reuses cached results",async()=>{const geocode=vi.fn(async()=>({latitude:1,longitude:2}));const provider:GeocoderProvider={id:"custom",label:"test",external:true,defaults:{provider:"custom",enabled:true,autocomplete:false,userTriggeredOnly:true},geocode};const waits:number[]=[];const queue=new GeocodeQueue(provider,{provider:"custom",enabled:true,cache:true,rateLimitPerSecond:1,autocomplete:false,userTriggeredOnly:true},undefined,async ms=>{waits.push(ms);});const results=await queue.run(["10 Main","10 Main"]);expect(geocode).toHaveBeenCalledTimes(1);expect(results[1].status).toBe("cached");expect(waits).toHaveLength(1);});
    it("parses the highest-scoring ArcGIS findAddressCandidates result",async()=>{const fetchMock=vi.fn(async(_input:RequestInfo|URL)=>({ok:true,json:async()=>({candidates:[{score:82,location:{x:-95.3,y:29.7}},{score:98,location:{x:-95.4,y:29.8}}]})}));vi.stubGlobal("fetch",fetchMock);const result=await getGeocoderProvider("arcgis").geocode("901 Bagby",{provider:"arcgis",enabled:true,endpoint:"https://example.test/GeocodeServer",minScore:80,countryCode:"USA",category:"Address",token:"secret",autocomplete:false,userTriggeredOnly:true});expect(result).toEqual({latitude:29.8,longitude:-95.4});const url=new URL(String(fetchMock.mock.calls[0]?.[0]));expect(url.pathname).toMatch(/GeocodeServer\/findAddressCandidates$/);expect(url.searchParams.get("SingleLine")).toBe("901 Bagby");expect(url.searchParams.get("token")).toBe("secret");vi.unstubAllGlobals();});
});
