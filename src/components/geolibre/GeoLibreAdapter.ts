import type { GeoLibreEmbedClient } from "@geolibre/embed";
import {
  assertCompatibleGeoLibreRuntimeVersion,
  type ResolvedGeoLibreRuntime,
} from "./securityPolicy";
import {
  geoLibreProjectFingerprint,
  persistGeoLibreRuntimeProject,
} from "./projectBridge";
import type {
  GeoLibreProjectDocument,
  GeoLibreRuntimeStatus,
  GeoLibreSelectionEvent,
  PersistedGeoLibreProject,
} from "./types";

export interface GeoLibreAdapterCallbacks {
  onProject(project: PersistedGeoLibreProject): void;
  onSelection(event: GeoLibreSelectionEvent): void;
  onStatus(status: GeoLibreRuntimeStatus): void;
  onUnavailable?(message: string): void;
}

export const GEOLIBRE_RUNTIME_HANDSHAKE_TIMEOUT_MS = 60_000;

const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export class GeoLibreAdapter {
  private destroyed = false;
  private frameLoaded = false;
  private runtimeVersionValidated = false;
  private runtimeUnavailable = false;
  private runtimeHandshakeTimer?: number;
  private enhancedConnectionStarted = false;
  private projectSentForNavigation = false;
  private sequence = 0;
  private project?: GeoLibreProjectDocument;
  private dataSignature = "";
  private lastSentPersistent = "";
  private lastReceivedPersistent = "";
  private lastSentDataSignature = "";
  private lastSelection = "";
  private enhancedClient?: GeoLibreEmbedClient;
  private enhancedDisconnectors: Array<() => void> = [];
  private highlightedLayers = new Set<string>();
  private pendingHighlights = new Map<string, string[]>();

  constructor(
    private readonly iframe: HTMLIFrameElement,
    private readonly runtime: ResolvedGeoLibreRuntime,
    private readonly callbacks: GeoLibreAdapterCallbacks,
  ) {
    window.addEventListener("message", this.onMessage);
    iframe.addEventListener("load", this.onLoad);
  }

  start(): void {
    if (this.destroyed) return;
    this.iframe.src = this.runtime.url;
    this.startRuntimeHandshakeTimeout();
    if (!this.enhancedConnectionStarted) {
      this.enhancedConnectionStarted = true;
      void this.connectEnhancedApi();
    }
  }

  loadProject(
    document: GeoLibreProjectDocument,
    dataSignature = "",
    force = false,
  ): void {
    if (this.destroyed) return;
    this.project = document;
    this.dataSignature = dataSignature;
    const persistent = geoLibreProjectFingerprint(
      persistGeoLibreRuntimeProject(document),
    );
    if (!force &&
      persistent === this.lastReceivedPersistent &&
      dataSignature === this.lastSentDataSignature
    ) {
      return;
    }
    if (!force &&
      persistent === this.lastSentPersistent &&
      dataSignature === this.lastSentDataSignature
    ) {
      return;
    }
    this.postProject(force);
  }

  requestState(): void {
    if (!this.runtimeVersionValidated) return;
    this.post({ type: "geolibre:request-state" });
  }

  highlightFeatures(featuresByLayer: Map<string, string[]>): void {
    this.pendingHighlights = new Map(featuresByLayer);
    void this.flushHighlights();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearRuntimeHandshakeTimeout();
    window.removeEventListener("message", this.onMessage);
    this.iframe.removeEventListener("load", this.onLoad);
    this.enhancedDisconnectors.forEach((disconnect) => disconnect());
    this.enhancedDisconnectors = [];
    this.enhancedClient?.disconnect();
    this.enhancedClient = undefined;
    this.iframe.removeAttribute("src");
  }

  private startRuntimeHandshakeTimeout(): void {
    this.clearRuntimeHandshakeTimeout();
    this.runtimeHandshakeTimer = window.setTimeout(() => {
      this.runtimeHandshakeTimer = undefined;
      if (this.destroyed || this.runtimeVersionValidated || this.runtimeUnavailable) return;
      this.runtimeUnavailable = true;
      const seconds = GEOLIBRE_RUNTIME_HANDSHAKE_TIMEOUT_MS / 1000;
      const message = `GeoLibre did not announce the pinned runtime version within ${seconds} seconds.`;
      if (this.callbacks.onUnavailable) {
        this.callbacks.onUnavailable(message);
      } else {
        this.callbacks.onStatus({
          state: "error",
          message,
          enhancedApiAvailable: false,
        });
      }
    }, GEOLIBRE_RUNTIME_HANDSHAKE_TIMEOUT_MS);
  }

  private clearRuntimeHandshakeTimeout(): void {
    if (this.runtimeHandshakeTimer === undefined) return;
    window.clearTimeout(this.runtimeHandshakeTimer);
    this.runtimeHandshakeTimer = undefined;
  }

  private readonly onLoad = () => {
    if (this.destroyed) return;
    this.frameLoaded = true;
    if (!this.runtimeVersionValidated && !this.runtimeUnavailable) {
      this.callbacks.onStatus({
        state: "initializing",
        message: "Waiting for the pinned GeoLibre runtime handshake.",
      });
    }
  };

  private postProject(force = false): void {
    if (
      this.destroyed ||
      !this.frameLoaded ||
      !this.runtimeVersionValidated ||
      !this.project ||
      !force && this.projectSentForNavigation &&
        this.lastSentPersistent === geoLibreProjectFingerprint(persistGeoLibreRuntimeProject(this.project)) &&
        this.lastSentDataSignature === this.dataSignature
    ) {
      return;
    }
    const persistent = geoLibreProjectFingerprint(
      persistGeoLibreRuntimeProject(this.project),
    );
    this.sequence += 1;
    this.post({
      type: "geolibre:load-project",
      project: this.project,
      seq: this.sequence,
      // HyperPBI never requests credential-bearing snapshots.
      trustedWidget: false,
    });
    this.projectSentForNavigation = true;
    this.lastSentPersistent = persistent;
    this.lastSentDataSignature = this.dataSignature;
    this.callbacks.onStatus({ state: "clean", message: "GeoLibre workspace loaded." });
  }

  private post(message: unknown): void {
    if (this.destroyed) return;
    this.iframe.contentWindow?.postMessage(message, this.runtime.origin);
  }

  private readonly onMessage = (event: MessageEvent) => {
    if (
      this.destroyed ||
      event.source !== this.iframe.contentWindow ||
      event.origin !== this.runtime.origin ||
      !object(event.data)
    ) {
      return;
    }
    const data = event.data;
    if (data.type === "geolibre:ready" && typeof data.version === "string") {
      this.acceptRuntimeReady(data.version);
      return;
    }
    if (
      data.source === "geolibre" &&
      data.v === 2 &&
      data.type === "ready" &&
      object(data.payload) &&
      typeof data.payload.version === "string"
    ) {
      this.acceptRuntimeReady(data.payload.version);
      return;
    }
    if (!this.runtimeVersionValidated) return;
    if (data.type === "geolibre:state") {
      try {
        const persisted = persistGeoLibreRuntimeProject(data.project);
        this.lastReceivedPersistent = geoLibreProjectFingerprint(persisted);
        this.callbacks.onProject(persisted);
        this.callbacks.onStatus({
          state: "dirty",
          message: "GeoLibre project changed. Save the HyperPBI draft to persist it.",
          enhancedApiAvailable: Boolean(this.enhancedClient),
        });
      } catch (error) {
        this.callbacks.onStatus({
          state: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return;
    }
    if (data.type === "geolibre:error") {
      this.callbacks.onStatus({
        state: "error",
        message: typeof data.message === "string" ? data.message : "GeoLibre rejected the project.",
      });
      return;
    }
    if (data.type === "geolibre:event" && data.event === "selection-change" && object(data.payload)) {
      const layerId = typeof data.payload.layerId === "string" ? data.payload.layerId : null;
      const featureId =
        typeof data.payload.featureId === "string" || typeof data.payload.featureId === "number"
          ? String(data.payload.featureId)
          : undefined;
      this.emitSelection({ layerId, featureIds: featureId ? [featureId] : [] });
    }
  };

  private acceptRuntimeReady(version: string): void {
    if (this.destroyed || this.runtimeUnavailable) return;
    try {
      assertCompatibleGeoLibreRuntimeVersion(version);
      if (this.runtimeVersionValidated) return;
      this.clearRuntimeHandshakeTimeout();
      // A child can announce readiness before the iframe's load event reaches
      // the parent. Receiving the exact-window message is sufficient proof that
      // this navigation can accept the project.
      this.frameLoaded = true;
      this.runtimeVersionValidated = true;
      this.callbacks.onStatus({
        state: "initializing",
        message: "GeoLibre is ready; restoring the project.",
        runtimeVersion: version,
        enhancedApiAvailable: Boolean(this.enhancedClient),
      });
      this.postProject();
      void this.flushHighlights();
    } catch (error) {
      this.clearRuntimeHandshakeTimeout();
      this.runtimeVersionValidated = false;
      this.runtimeUnavailable = true;
      this.callbacks.onStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
        runtimeVersion: version,
      });
    }
  }

  private emitSelection(event: GeoLibreSelectionEvent): void {
    if (!this.runtimeVersionValidated) return;
    const signature = JSON.stringify([event.layerId, [...event.featureIds].sort()]);
    if (signature === this.lastSelection) return;
    this.lastSelection = signature;
    this.callbacks.onSelection(event);
  }

  private async connectEnhancedApi(): Promise<void> {
    try {
      const { connect } = await import("@geolibre/embed");
      if (this.destroyed) return;
      const client = await connect(this.iframe, {
        origin: this.runtime.origin,
        timeoutMs: GEOLIBRE_RUNTIME_HANDSHAKE_TIMEOUT_MS,
        requestTimeoutMs: 15_000,
      });
      if (this.destroyed) {
        client.disconnect();
        return;
      }
      this.enhancedClient = client;
      this.enhancedDisconnectors.push(
        client.on("selectionChanged", ({ layerId, featureIds }) =>
          this.emitSelection({
            layerId,
            featureIds: featureIds.map(String),
          }),
        ),
      );
      if (this.runtimeVersionValidated) {
        this.callbacks.onStatus({
          state: "clean",
          message: "GeoLibre enhanced interaction bridge connected.",
          enhancedApiAvailable: true,
        });
      }
      await this.flushHighlights();
    } catch {
      // The enhanced API is optional. Its ready event can arrive later than the
      // native project bridge on a heavy GIS startup, so its timeout must not
      // declare the entire runtime unavailable. The independent pinned-version
      // handshake timer owns fallback/error decisions.
      if (!this.destroyed) {
        if (this.runtimeVersionValidated) {
          this.callbacks.onStatus({
            state: "clean",
            message: "GeoLibre project bridge connected.",
            enhancedApiAvailable: false,
          });
        } else if (!this.runtimeUnavailable) {
          this.callbacks.onStatus({
            state: "initializing",
            message: "GeoLibre is still starting; waiting for the pinned runtime handshake.",
            enhancedApiAvailable: false,
          });
        }
      }
    }
  }

  private async flushHighlights(): Promise<void> {
    const client = this.enhancedClient;
    if (!client || this.destroyed || !this.runtimeVersionValidated) return;
    const layerIds = new Set([
      ...this.highlightedLayers,
      ...this.pendingHighlights.keys(),
    ]);
    for (const layerId of layerIds) {
      const featureIds = this.pendingHighlights.get(layerId) ?? [];
      try {
        await client.highlightFeature({ layerId, featureIds, fit: false });
      } catch {
        // Layers can disappear while an authored binding is being edited. A
        // later bridge refresh retries the current highlight set.
      }
    }
    this.highlightedLayers = new Set(this.pendingHighlights.keys());
  }
}
