import { afterEach, describe, expect, it } from "vitest";
import {
  createGeoLibrePowerBiCompatMap,
  isPowerBiVisualSandbox,
} from "../src/components/geolibre/powerBiCompat";
import type {
  GeoLibreComponent,
  GeoLibreProjectDocument,
} from "../src/components/geolibre/types";
import { powerBiLayerId } from "../src/components/geolibre/projectBridge";

afterEach(() => {
  document.body.replaceChildren();
});

describe("GeoLibre Power BI compatibility renderer", () => {
  it("detects only the Power BI visual host marker", () => {
    expect(isPowerBiVisualSandbox()).toBe(false);
    const visualHost = document.createElement("div");
    visualHost.className = "hyperpbi-visual-host";
    document.body.append(visualHost);
    expect(isPowerBiVisualSandbox()).toBe(true);
  });

  it("translates GeoLibre Power BI bindings into the bundled map runtime", () => {
    const component: GeoLibreComponent = {
      type: "geolibre",
      id: "austin_gis",
      dataset: "facilities",
      title: "Austin Field Operations",
      subtitle: "GeoLibre demo",
      span: 12,
      heightMode: "fixed",
      height: 640,
      capabilityProfile: "powerbi-embedded",
      runtime: { channel: "managed", panels: "open", theme: "light" },
      powerBi: {
        layers: [
          {
            id: "facilities",
            title: "Service facilities",
            dataset: "facilities",
            geometry: {
              type: "coordinates",
              latitudeField: "latitude",
              longitudeField: "longitude",
            },
            fields: ["siteid", "sitename", "status"],
            initialStyle: {
              fillColor: "#2563eb",
              strokeColor: "#ffffff",
              fillOpacity: 0.9,
              strokeWidth: 1.5,
              circleRadius: 7,
            },
            visible: true,
            opacity: 1,
          },
        ],
        selection: {
          enabled: true,
          externalHighlight: true,
          maxSelectionCount: 1000,
        },
      },
      interaction: {
        enabled: true,
        trigger: "click",
        internalMode: "highlight",
        internalScope: "all",
        externalMode: "selection",
        selectionMode: "replace",
        multiSelect: true,
        clearOnSecondClick: true,
      },
    };
    const layerId = powerBiLayerId("facilities");
    const document: GeoLibreProjectDocument = {
      version: "0.2.0",
      name: "Austin Field Operations",
      mapView: {
        center: [-97.7431, 30.2672],
        zoom: 10,
        bearing: 0,
        pitch: 0,
      },
      basemapStyleUrl: "https://tiles.openfreemap.org/styles/liberty",
      basemapVisible: true,
      basemapOpacity: 1,
      layers: [
        {
          id: layerId,
          name: "Service facilities",
          type: "geojson",
          source: { type: "geojson" },
          visible: true,
          opacity: 1,
          style: {
            fillColor: "#2563eb",
            strokeColor: "#ffffff",
            fillOpacity: 0.9,
            strokeWidth: 1.5,
            circleRadius: 7,
          },
          metadata: {},
        },
      ],
      layerGroups: [],
      styles: {},
      preferences: {},
      legend: {},
      comments: [],
      metadata: {},
    };

    const map = createGeoLibrePowerBiCompatMap(component, document);

    expect(map).toMatchObject({
      type: "map",
      engine: "leaflet",
      id: "austin_gis",
      dataset: "facilities",
      height: 640,
      view: {
        center: [30.2672, -97.7431],
        zoom: 10,
        fitMode: "none",
        preserveView: true,
      },
      basemap: { type: "osm", visible: true },
      layerPanel: { visible: true, defaultOpen: true },
      tools: { selection: { maxSelectionCount: 1000 } },
    });
    expect(map.layers).toHaveLength(1);
    expect(map.layers?.[0]).toMatchObject({
      id: layerId,
      name: "Service facilities",
      dataset: "facilities",
      visible: true,
      opacity: 1,
      source: {
        type: "powerbi",
        bindings: {
          latitude: "latitude",
          longitude: "longitude",
          tooltip: ["siteid", "sitename", "status"],
          details: ["siteid", "sitename", "status"],
        },
      },
      renderer: {
        type: "simple",
        symbol: {
          fillColor: "#2563eb",
          outlineColor: "#ffffff",
          fillOpacity: 0.9,
          outlineWidth: 1.5,
          radius: 7,
        },
      },
    });
  });

  it("keeps inline native GeoJSON layers available in compatibility mode", () => {
    const component: GeoLibreComponent = {
      type: "geolibre",
      id: "gis",
      powerBi: { layers: [] },
    };
    const document: GeoLibreProjectDocument = {
      version: "0.2.0",
      name: "Inline layer",
      mapView: { center: [0, 0], zoom: 2, bearing: 0, pitch: 0 },
      basemapStyleUrl: "",
      basemapVisible: false,
      basemapOpacity: 1,
      layers: [{
        id: "native",
        name: "Native GeoJSON",
        type: "geojson",
        source: { type: "geojson" },
        visible: true,
        opacity: 0.8,
        style: { fillColor: "#16a34a" },
        metadata: {},
        geojson: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: {},
          }],
        },
      }],
      styles: {},
      preferences: {},
      metadata: {},
    };

    const map = createGeoLibrePowerBiCompatMap(component, document);
    expect(map.basemap).toEqual({ type: "none", visible: false });
    expect(map.layers?.[0]).toMatchObject({
      id: "native",
      source: { type: "geoJson" },
      renderer: { type: "simple", symbol: { fillColor: "#16a34a" } },
    });
  });
});
