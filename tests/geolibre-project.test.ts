import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDefaultGeoLibreProject,
  deserializeGeoLibreProject,
  geoLibreProjectFingerprint,
  persistGeoLibreRuntimeProject,
  serializeGeoLibreProject,
} from "../src/components/geolibre/projectBridge";
import {
  GeoLibreSecurityError,
  resolveGeoLibreRuntime,
  sanitizePersistedGeoLibreProject,
} from "../src/components/geolibre/securityPolicy";
import type {
  GeoLibreProjectDocument,
  JsonObject,
  PersistedGeoLibreProject,
} from "../src/components/geolibre/types";

function authoredDocument(): GeoLibreProjectDocument {
  const document = structuredClone(createDefaultGeoLibreProject("Round trip").document);
  document.mapView = { ...document.mapView, center: [-97.7431, 30.2672], zoom: 10, bearing: 12, pitch: 35 };
  document.layers = [
    {
      id: "native-districts",
      name: "Districts",
      type: "geojson",
      source: { type: "geojson" },
      visible: false,
      opacity: 0.42,
      style: { fillColor: "#2563eb", lineWidth: 2 },
      metadata: { owner: "GIS" },
      geojson: {
        type: "FeatureCollection",
        features: [{ type: "Feature", id: "district-1", properties: { name: "Central" }, geometry: { type: "Point", coordinates: [-97.7, 30.2] } }],
      },
      timeFilter: { field: "date" },
      embedFilter: ["==", "status", "Open"],
    },
    {
      id: "hyperpbi-powerbi-locations",
      name: "Power BI locations",
      type: "geojson",
      source: { type: "geojson", url: "https://example.com/transient.geojson" },
      sourcePath: "relative/transient.geojson",
      visible: true,
      opacity: 0.8,
      style: { circleColor: "#dc2626", circleRadius: 7 },
      metadata: { authored: true },
      geojson: {
        type: "FeatureCollection",
        features: [{ type: "Feature", id: "private-row-id", properties: { secret: "not persisted" }, geometry: { type: "Point", coordinates: [-97.8, 30.3] } }],
      },
    },
  ] as GeoLibreProjectDocument["layers"];
  document.styles = { activeLayerId: "native-districts" };
  document.plugins = { manifestUrls: [], activePluginIds: [], mapControlPositions: {}, settings: {} };
  return document;
}

function unsafe(mutator: (project: PersistedGeoLibreProject) => void): PersistedGeoLibreProject {
  const project = structuredClone(createDefaultGeoLibreProject());
  mutator(project);
  return project;
}

describe("GeoLibre native project persistence", () => {
  it("round-trips native presentation and removes only transient Power BI payloads", () => {
    const persisted = persistGeoLibreRuntimeProject(authoredDocument());
    const native = persisted.document.layers[0];
    const powerBi = persisted.document.layers[1];
    expect(persisted.document.mapView).toMatchObject({ center: [-97.7431, 30.2672], zoom: 10, bearing: 12, pitch: 35 });
    expect(native).toMatchObject({ id: "native-districts", visible: false, opacity: 0.42, style: { fillColor: "#2563eb", lineWidth: 2 } });
    expect(native.geojson).toHaveProperty("features.0.id", "district-1");
    expect(native).not.toHaveProperty("timeFilter");
    expect(native).not.toHaveProperty("embedFilter");
    expect(powerBi).toMatchObject({ id: "hyperpbi-powerbi-locations", style: { circleColor: "#dc2626", circleRadius: 7 }, source: { type: "geojson" } });
    expect(powerBi).not.toHaveProperty("geojson");
    expect(powerBi).not.toHaveProperty("sourcePath");
    expect(persisted.document).not.toHaveProperty("plugins");
    const decoded = deserializeGeoLibreProject(serializeGeoLibreProject(persisted));
    expect(decoded).toEqual(persisted);
    expect(geoLibreProjectFingerprint(decoded)).toBe(geoLibreProjectFingerprint(persisted));
  });

  it("discards the pinned runtime's built-in plugin state before persistence", () => {
    const document = structuredClone(createDefaultGeoLibreProject("Runtime snapshot").document);
    document.plugins = {
      manifestUrls: [],
      activePluginIds: [
        "maplibre-layer-control",
        "maplibre-atmosphere-effects",
        "maplibre-deckgl-viz",
      ],
      mapControlPositions: {
        "maplibre-layer-control": "top-right",
        "maplibre-gl-geo-editor": "top-left",
      },
      settings: {},
    };
    document.mapView.zoom = 7;

    const persisted = persistGeoLibreRuntimeProject(document);

    expect(persisted.document.mapView.zoom).toBe(7);
    expect(persisted.document).not.toHaveProperty("plugins");
  });

  it("rejects executable, credential-bearing, filesystem, and plugin project state", () => {
    const cases: PersistedGeoLibreProject[] = [
      unsafe(project => { project.document.basemapStyleUrl = "javascript:alert(1)"; }),
      unsafe(project => { project.document.metadata = { onClick: "run()" }; }),
      unsafe(project => { project.document.metadata = { onclick: "run()" }; }),
      unsafe(project => { project.document.metadata = { payload: "data:text/html;base64,PHNjcmlwdD4=" }; }),
      unsafe(project => { project.document.metadata = { filePath: "C:\\Users\\private.geojson" }; }),
      unsafe(project => { project.document.preferences = { environmentVariables: [{ name: "TOKEN", value: "private" }] } as JsonObject; }),
      unsafe(project => { project.document.layers.push({ id: "file", name: "File", type: "geojson", source: { type: "geojson" }, sourcePath: "C:\\Users\\private.geojson", visible: true, opacity: 1, style: {}, metadata: {} }); }),
      unsafe(project => { project.document.layers.push({ id: "auth", name: "Auth", type: "geojson", source: { type: "geojson", headers: { Authorization: "Bearer private" } }, visible: true, opacity: 1, style: {}, metadata: {} }); }),
      unsafe(project => { project.document.plugins = { manifestUrls: ["https://plugins.example/manifest.json"], activePluginIds: [], mapControlPositions: {}, settings: {} }; }),
      unsafe(project => { project.document.plugins = { manifestUrls: [], activePluginIds: ["builtin-agent"], mapControlPositions: {}, settings: {} }; }),
      unsafe(project => { project.document.plugins = { customLoader: { url: "https://plugins.example/loader.js" } } as JsonObject; }),
      unsafe(project => { project.document.metadata = { markup: "<iframe src='https://evil.example'></iframe>" }; }),
    ];
    for (const project of cases) expect(() => sanitizePersistedGeoLibreProject(project)).toThrow(GeoLibreSecurityError);
  });

  it("resolves only pinned managed or official runtimes with embed-safe URL flags", () => {
    const managed = resolveGeoLibreRuntime(
      { capabilityProfile: "powerbi-embedded", runtime: { theme: "dark", panels: "collapsed" } },
      { hostname: "app.powerbi.com", origin: "https://app.powerbi.com" } as Location,
    );
    expect(managed).toMatchObject({ origin: "https://hyperpbi.com", channel: "managed" });
    expect(new URL(managed.url).pathname).toBe("/geolibre/");
    expect(new URL(managed.url).searchParams.get("embed")).toBe("1");
    expect(new URL(managed.url).searchParams.get("theme")).toBe("dark");
    expect(new URL(managed.url).searchParams.get("panels")).toBe("collapsed");
    const official = resolveGeoLibreRuntime({ capabilityProfile: "viewer", runtime: { channel: "official" } });
    expect(official.origin).toBe("https://web.geolibre.app");
    expect(new URL(official.url).searchParams.get("layout")).toBe("viewer");
  });

  it("locks the managed UI profile while keeping core authoring menus available", () => {
    const profile = JSON.parse(readFileSync(resolve("src/components/geolibre/runtime/admin-profile.json"), "utf8")) as Record<string, unknown>;
    expect(profile).toMatchObject({ enabled: true, level: "advanced", lock: true });
    expect(profile.hiddenMenus).toContain("plugins");
    expect(profile.hiddenDataSources).toEqual(expect.arrayContaining(["postgres", "video"]));
    expect(profile.hiddenMenuItems).toEqual(expect.arrayContaining(["settings.environment", "settings.managePlugins", "project.share", "project.exportHtml"]));
    expect(profile.hiddenMenuItems).not.toEqual(expect.arrayContaining(["project.save", "project.import", "data.add"]));
  });
});
