import { expect, it } from "vitest";
import { checkHostPolicy } from "../src/maps/arcgis/arcGisHostPolicy";
import { DEFAULT_WEB_REST_HOSTS } from "../src/data/remoteDataSources";
import { buildWebAccessParameters } from "../scripts/package-profile-utils.mjs";

it("supports public MiniUp app/io and ArcGIS host families without granting Core network privileges", () => {
    const hosts = buildWebAccessParameters({ profile: "maps" });
    for (const host of ["https://miniup.app", "https://*.miniup.app", "https://miniup.io", "https://*.miniup.io", "https://*.arcgis.com", "https://*.arcgisonline.com"]) expect(hosts).toContain(host);
    for (const host of ["https://miniup.app", "https://maps.miniup.app", "https://miniup.io", "https://layers.miniup.io", "https://services.arcgis.com", "https://sampleserver6.arcgisonline.com"]) expect(checkHostPolicy(`${host}/FeatureServer/0`).allowed).toBe(true);
    expect(DEFAULT_WEB_REST_HOSTS).toContain("https://*.miniup.io");
    expect(checkHostPolicy("https://miniup.io.attacker.test/FeatureServer/0").allowed).toBe(false);
    expect(buildWebAccessParameters({ profile: "core" })).toEqual([]);
});
