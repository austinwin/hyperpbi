import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GEOLIBRE_RUNTIME_HANDSHAKE_TIMEOUT_MS,
  GeoLibreAdapter,
} from "../src/components/geolibre/GeoLibreAdapter";
import { createDefaultGeoLibreProject, powerBiLayerId } from "../src/components/geolibre/projectBridge";
import { GEOLIBRE_VERSION } from "../src/components/geolibre/types";

const embed = vi.hoisted(() => {
  const listeners = new Map<string, (event: any) => void>();
  const disconnectListener = vi.fn();
  const client = {
    on: vi.fn((name: string, listener: (event: any) => void) => {
      listeners.set(name, listener);
      return disconnectListener;
    }),
    disconnect: vi.fn(),
    highlightFeature: vi.fn(async () => undefined),
  };
  return { listeners, disconnectListener, client, connect: vi.fn(async () => client) };
});

vi.mock("@geolibre/embed", () => ({ connect: embed.connect }));

function inbound(iframe: HTMLIFrameElement, origin: string, data: unknown): void {
  window.dispatchEvent(new MessageEvent("message", { data, origin, source: iframe.contentWindow }));
}

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
  embed.listeners.clear();
  vi.clearAllMocks();
});

describe("GeoLibre iframe adapter", () => {
  it("handshakes once per document, persists safe state, and enforces source/origin/version", async () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");
    const callbacks = { onProject: vi.fn(), onSelection: vi.fn(), onStatus: vi.fn() };
    const runtime = { url: "https://runtime.example/geolibre/?embed=1", origin: "https://runtime.example", channel: "managed" as const };
    const adapter = new GeoLibreAdapter(iframe, runtime, callbacks);
    const project = createDefaultGeoLibreProject();
    adapter.loadProject(project.document, "data-v1");
    iframe.dispatchEvent(new Event("load"));
    expect(postMessage).not.toHaveBeenCalled();
    inbound(iframe, runtime.origin, { type: "geolibre:ready", version: "999.0.0" });
    expect(postMessage).not.toHaveBeenCalled();
    expect(callbacks.onStatus).toHaveBeenLastCalledWith(expect.objectContaining({ state: "error", runtimeVersion: "999.0.0" }));
    inbound(iframe, runtime.origin, { type: "geolibre:ready", version: GEOLIBRE_VERSION });
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "geolibre:load-project", project: project.document, seq: 1, trustedWidget: false }), runtime.origin);
    inbound(iframe, runtime.origin, { source: "geolibre", v: 2, type: "ready", payload: { version: GEOLIBRE_VERSION } });
    expect(postMessage).toHaveBeenCalledTimes(1);
    inbound(iframe, "https://attacker.example", { type: "geolibre:state", project: { ...project.document, name: "Attack" } });
    expect(callbacks.onProject).not.toHaveBeenCalled();

    const changed = structuredClone(project.document);
    changed.name = "Authored in GeoLibre";
    changed.layers.push({ id: powerBiLayerId("points"), name: "Points", type: "geojson", source: { type: "geojson" }, visible: true, opacity: 1, style: { circleColor: "#f00" }, metadata: {}, geojson: { type: "FeatureCollection", features: [{ type: "Feature", id: "row-private", geometry: { type: "Point", coordinates: [0, 0] }, properties: {} }] } });
    inbound(iframe, runtime.origin, { type: "geolibre:state", project: changed });
    expect(callbacks.onProject).toHaveBeenCalledTimes(1);
    expect(callbacks.onProject.mock.calls[0][0]).toMatchObject({ document: { name: "Authored in GeoLibre", layers: [{ id: powerBiLayerId("points"), style: { circleColor: "#f00" } }] } });
    expect(callbacks.onProject.mock.calls[0][0].document.layers[0]).not.toHaveProperty("geojson");

    const unsafe = structuredClone(project.document);
    unsafe.metadata = { onclick: "run()" };
    inbound(iframe, runtime.origin, { type: "geolibre:state", project: unsafe });
    expect(callbacks.onProject).toHaveBeenCalledTimes(1);
    expect(callbacks.onStatus).toHaveBeenLastCalledWith(expect.objectContaining({ state: "error" }));
    adapter.destroy();
  });

  it("deduplicates baseline/enhanced selection and mirrors external highlights", async () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const callbacks = { onProject: vi.fn(), onSelection: vi.fn(), onStatus: vi.fn() };
    const runtime = { url: "https://runtime.example/geolibre/?embed=1", origin: "https://runtime.example", channel: "managed" as const };
    const adapter = new GeoLibreAdapter(iframe, runtime, callbacks);
    adapter.start();
    await vi.waitFor(() => expect(embed.connect).toHaveBeenCalled());
    iframe.dispatchEvent(new Event("load"));
    inbound(iframe, runtime.origin, { source: "geolibre", v: 2, type: "ready", payload: { version: GEOLIBRE_VERSION } });
    inbound(iframe, runtime.origin, { type: "geolibre:event", event: "selection-change", payload: { layerId: "layer", featureId: 42 } });
    inbound(iframe, runtime.origin, { type: "geolibre:event", event: "selection-change", payload: { layerId: "layer", featureId: 42 } });
    expect(callbacks.onSelection).toHaveBeenCalledTimes(1);
    expect(callbacks.onSelection).toHaveBeenLastCalledWith({ layerId: "layer", featureIds: ["42"] });
    embed.listeners.get("selectionChanged")?.({ layerId: "layer", featureIds: ["42", "43"] });
    expect(callbacks.onSelection).toHaveBeenLastCalledWith({ layerId: "layer", featureIds: ["42", "43"] });
    adapter.highlightFeatures(new Map([["layer", ["42", "43"]]]));
    await vi.waitFor(() => expect(embed.client.highlightFeature).toHaveBeenCalledWith({ layerId: "layer", featureIds: ["42", "43"], fit: false }));
    adapter.highlightFeatures(new Map());
    await vi.waitFor(() => expect(embed.client.highlightFeature).toHaveBeenLastCalledWith({ layerId: "layer", featureIds: [], fit: false }));
    adapter.destroy();
    expect(embed.client.disconnect).toHaveBeenCalled();
    expect(embed.disconnectListener).toHaveBeenCalled();
    expect(iframe.hasAttribute("src")).toBe(false);
  });

  it("does not fail the runtime when only the enhanced API handshake times out", async () => {
    embed.connect.mockRejectedValueOnce(new Error("Timed out waiting for GeoLibre"));
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");
    const callbacks = {
      onProject: vi.fn(),
      onSelection: vi.fn(),
      onStatus: vi.fn(),
      onUnavailable: vi.fn(),
    };
    const runtime = { url: "https://runtime.example/geolibre/index.html?embed=1", origin: "https://runtime.example", channel: "managed" as const };
    const adapter = new GeoLibreAdapter(iframe, runtime, callbacks);
    const project = createDefaultGeoLibreProject();
    adapter.loadProject(project.document, "data-v1");

    adapter.start();
    await vi.waitFor(() => expect(callbacks.onStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        state: "initializing",
        enhancedApiAvailable: false,
      }),
    ));
    expect(callbacks.onUnavailable).not.toHaveBeenCalled();

    iframe.dispatchEvent(new Event("load"));
    inbound(iframe, runtime.origin, { type: "geolibre:ready", version: GEOLIBRE_VERSION });

    expect(callbacks.onUnavailable).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "geolibre:load-project", project: project.document }),
      runtime.origin,
    );
    expect(callbacks.onStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: "clean", message: "GeoLibre workspace loaded." }),
    );
    adapter.destroy();
  });

  it("fails only after the independent pinned runtime handshake deadline and stays terminal", async () => {
    vi.useFakeTimers();
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const callbacks = { onProject: vi.fn(), onSelection: vi.fn(), onStatus: vi.fn() };
    const runtime = { url: "https://runtime.example/geolibre/index.html?embed=1", origin: "https://runtime.example", channel: "managed" as const };
    const adapter = new GeoLibreAdapter(iframe, runtime, callbacks);

    adapter.start();
    await vi.advanceTimersByTimeAsync(GEOLIBRE_RUNTIME_HANDSHAKE_TIMEOUT_MS);

    expect(callbacks.onStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        state: "error",
        message: "GeoLibre did not announce the pinned runtime version within 60 seconds.",
      }),
    );
    iframe.dispatchEvent(new Event("load"));
    inbound(iframe, runtime.origin, { type: "geolibre:ready", version: GEOLIBRE_VERSION });

    expect(callbacks.onStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({
        state: "error",
        message: "GeoLibre did not announce the pinned runtime version within 60 seconds.",
      }),
    );
    adapter.destroy();
  });
});
