import { h, render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultGeoLibreProject } from "../src/components/geolibre/projectBridge";

const adapters = vi.hoisted(() => ({
  instances: [] as Array<any>,
  resizeDisconnect: vi.fn(),
}));

vi.mock("../src/components/geolibre/GeoLibreAdapter", () => ({
  GeoLibreAdapter: class {
    loadProject = vi.fn();
    highlightFeatures = vi.fn();
    destroy = vi.fn();
    start = vi.fn();
    runtime: unknown;
    callbacks: { onStatus(status: unknown): void; onUnavailable?(message: string): void };
    constructor(_iframe: HTMLIFrameElement, runtime: unknown, callbacks: { onStatus(status: unknown): void; onUnavailable?(message: string): void }) {
      this.runtime = runtime;
      this.callbacks = callbacks;
      adapters.instances.push(this);
      queueMicrotask(() => callbacks.onStatus({ state: "clean", message: "Ready" }));
    }
  },
}));

vi.mock("../src/components/geolibre/resizeBridge", () => ({
  observeGeoLibreResize: vi.fn(() => ({ notify: vi.fn(), disconnect: adapters.resizeDisconnect })),
}));

import { GeoLibreWorkspaceHost } from "../src/components/geolibre/GeoLibreWorkspaceHost";

afterEach(() => {
  document.body.replaceChildren();
  adapters.instances.length = 0;
  vi.clearAllMocks();
});

describe("GeoLibre workspace host", () => {
  it("renders a sandboxed authentic runtime surface with authoring reset/revert controls", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const saved = createDefaultGeoLibreProject("Saved");
    const reset = createDefaultGeoLibreProject("Reset");
    const onProjectChange = vi.fn();
    render(h(GeoLibreWorkspaceHost, {
      component: { type: "geolibre", id: "gis", title: "GIS authoring", height: 600 },
      persistedProject: saved,
      document: saved.document,
      dataSignature: "data-v1",
      highlightedFeatures: new Map(),
      resetProject: reset,
      resetDocument: reset.document,
      warnings: ["One invalid coordinate was skipped."],
      onProjectChange,
      onSelection: vi.fn(),
    }), host);
    await Promise.resolve();
    const section = host.querySelector(".hp-geolibre-workspace") as HTMLElement;
    const iframe = host.querySelector("iframe") as HTMLIFrameElement;
    expect(section.style.height).toBe("600px");
    expect(iframe.title).toBe("GIS authoring");
    expect(iframe.getAttribute("sandbox")).toBe("allow-scripts allow-same-origin allow-forms allow-downloads allow-modals");
    expect(iframe.getAttribute("sandbox")).not.toContain("allow-popups");
    expect(iframe.getAttribute("allow")).toContain("geolocation 'none'");
    expect(host.textContent).toContain("Power BI layer warning");
    const buttons = [...host.querySelectorAll("button")] as HTMLButtonElement[];
    await vi.waitFor(() => expect(buttons.every(button => !button.disabled)).toBe(true));
    buttons.find(button => button.textContent === "Reset project")!.click();
    expect(onProjectChange).toHaveBeenLastCalledWith(reset);
    buttons.find(button => button.textContent === "Revert")!.click();
    expect(onProjectChange).toHaveBeenLastCalledWith(saved);
    render(null, host);
    expect(adapters.instances[0].destroy).toHaveBeenCalled();
    expect(adapters.resizeDisconnect).toHaveBeenCalled();
  });

  it("keeps viewer mode free of HyperPBI authoring chrome", () => {
    const host = document.createElement("div");
    const project = createDefaultGeoLibreProject();
    render(h(GeoLibreWorkspaceHost, {
      component: { type: "geolibre", id: "viewer", capabilityProfile: "viewer", heightMode: "fill", minHeight: 320 },
      persistedProject: project,
      document: project.document,
      dataSignature: "",
      highlightedFeatures: new Map(),
      resetProject: project,
      resetDocument: project.document,
      warnings: [],
      onSelection: vi.fn(),
    }), host);
    expect(host.querySelector(".hp-geolibre-authoring-bar")).toBeNull();
    expect((host.querySelector(".hp-geolibre-workspace") as HTMLElement).style.height).toBe("100%");
  });

  it("retries the official runtime when the managed deployment cannot handshake", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const project = createDefaultGeoLibreProject();
    render(h(GeoLibreWorkspaceHost, {
      component: { type: "geolibre", id: "fallback", runtime: { channel: "managed" } },
      persistedProject: project,
      document: project.document,
      dataSignature: "",
      highlightedFeatures: new Map(),
      resetProject: project,
      resetDocument: project.document,
      warnings: [],
      onSelection: vi.fn(),
    }), host);
    await vi.waitFor(() => expect(
      adapters.instances.some(adapter => adapter.runtime?.channel === "managed"),
    ).toBe(true));
    const managedAdapters = adapters.instances.filter(adapter => adapter.runtime?.channel === "managed");
    const managedAdapter = managedAdapters[managedAdapters.length - 1];
    expect(managedAdapter.runtime).toMatchObject({
      channel: "managed",
      origin: window.location.origin,
    });
    managedAdapter.callbacks.onUnavailable?.("Managed runtime timed out.");

    await vi.waitFor(() => expect(
      adapters.instances.some(adapter => adapter.runtime?.channel === "official"),
    ).toBe(true));
    const officialAdapter = adapters.instances.find(adapter => adapter.runtime?.channel === "official");
    expect(managedAdapter.destroy).toHaveBeenCalled();
    expect(officialAdapter!.runtime).toMatchObject({
      channel: "official",
      origin: "https://web.geolibre.app",
    });
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });

  it("fails closed with a useful message when Power BI denies runtime access", () => {
    const host = document.createElement("div");
    const project = createDefaultGeoLibreProject();
    render(h(GeoLibreWorkspaceHost, {
      component: { type: "geolibre", id: "denied" },
      persistedProject: project,
      document: project.document,
      dataSignature: "",
      highlightedFeatures: new Map(),
      resetProject: project,
      resetDocument: project.document,
      warnings: [],
      availability: { state: "denied", message: "Import the Maps PBIVIZ or ask the tenant administrator to allow WebAccess." },
      onSelection: vi.fn(),
    }), host);
    expect(host.querySelector("iframe")).toBeNull();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("GeoLibre network access is unavailable");
    expect(adapters.instances).toHaveLength(0);
  });
});
