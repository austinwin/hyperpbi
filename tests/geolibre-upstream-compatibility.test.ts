import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GEOLIBRE_UPSTREAM_REVISION, GEOLIBRE_VERSION } from "../src/components/geolibre/types";

const read = (path: string) => readFileSync(resolve(path), "utf8");

describe("pinned GeoLibre upstream compatibility", () => {
  it("pins the pristine upstream revision and exact public embed client", () => {
    expect(JSON.parse(read("vendor/geolibre/package.json")).version).toBe(GEOLIBRE_VERSION);
    expect(execFileSync("git", ["-C", "vendor/geolibre", "rev-parse", "HEAD"], { encoding: "utf8" }).trim()).toBe(GEOLIBRE_UPSTREAM_REVISION);
    expect(JSON.parse(read("package.json")).dependencies["@geolibre/embed"]).toBe(GEOLIBRE_VERSION);
    expect(read(".gitmodules")).toContain("https://github.com/opengeos/GeoLibre.git");
  });

  it("guards the native project bridge and authentic authoring shell contracts", () => {
    const bridge = read("vendor/geolibre/apps/geolibre-desktop/src/hooks/useEmbedBridge.ts");
    expect(bridge).toContain('type: "geolibre:load-project"');
    expect(bridge).toContain('type: "geolibre:state"');
    expect(bridge).toContain('type: "geolibre:ready"');
    expect(bridge).toContain("STATE_DEBOUNCE_MS = 250");
    expect(bridge).toContain("buildProjectEgressSnapshot");
    const app = read("vendor/geolibre/apps/geolibre-desktop/src/App.tsx");
    const shell = read("vendor/geolibre/apps/geolibre-desktop/src/components/layout/DesktopShell.tsx");
    expect(app).toContain("<DesktopShell");
    expect(shell).toContain("<TopToolbar");
    expect(shell).toContain("<LayerPanel");
    expect(shell).toContain("<StylePanel");
    expect(read("vendor/geolibre/apps/geolibre-desktop/src/lib/admin-profile.ts")).toContain("import.meta.env.BASE_URL}admin-profile.json");
  });

  it("keeps the managed build on a relative subpath with an explicit embed-origin allowlist", () => {
    const build = read("scripts/build-geolibre-runtime.mjs");
    expect(build).toContain('GEOLIBRE_APP_BASE: "/geolibre/"');
    expect(build).toContain("VITE_GEOLIBRE_EMBED_ORIGINS");
    expect(build).toContain('"https://hyperpbi.com"');
    expect(build).toContain('"https://www.hyperpbi.com"');
    expect(build).toContain('"https://app.powerbi.com"');
    expect(build).not.toContain('VITE_GEOLIBRE_EMBED_ORIGINS: "*"');
    expect(JSON.parse(read("vercel.json")).buildCommand).toContain("geolibre:build");
  });
});
