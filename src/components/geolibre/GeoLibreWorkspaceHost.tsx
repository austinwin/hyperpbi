import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { GeoLibreAdapter } from "./GeoLibreAdapter";
import { observeGeoLibreResize } from "./resizeBridge";
import { resolveGeoLibreRuntime } from "./securityPolicy";
import type {
  GeoLibreComponent,
  GeoLibreProjectDocument,
  GeoLibreRuntimeStatus,
  GeoLibreSelectionEvent,
  PersistedGeoLibreProject,
} from "./types";

export interface GeoLibreWorkspaceHostProps {
  component: GeoLibreComponent;
  persistedProject: PersistedGeoLibreProject;
  document: GeoLibreProjectDocument;
  dataSignature: string;
  highlightedFeatures: Map<string, string[]>;
  resetProject: PersistedGeoLibreProject;
  resetDocument: GeoLibreProjectDocument;
  warnings: string[];
  availability?: { state: "checking" | "denied"; message: string };
  onProjectChange?: (project: PersistedGeoLibreProject) => void;
  onSelection: (event: GeoLibreSelectionEvent) => void;
}

export function GeoLibreWorkspaceHost({
  component,
  persistedProject,
  document,
  dataSignature,
  highlightedFeatures,
  resetProject,
  resetDocument,
  warnings,
  availability,
  onProjectChange,
  onSelection,
}: GeoLibreWorkspaceHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameShellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const adapterRef = useRef<GeoLibreAdapter>();
  const savedProjectRef = useRef(persistedProject);
  const savedDocumentRef = useRef(document);
  const callbacksRef = useRef({ onProjectChange, onSelection });
  callbacksRef.current = { onProjectChange, onSelection };
  const [status, setStatus] = useState<GeoLibreRuntimeStatus>({
    state: "initializing",
    message: "Starting the GeoLibre workspace…",
  });
  const requestedRuntime = useMemo(
    () => resolveGeoLibreRuntime(component),
    [component.runtime, component.capabilityProfile],
  );
  const officialRuntime = useMemo(
    () => resolveGeoLibreRuntime({
      capabilityProfile: component.capabilityProfile,
      runtime: { ...component.runtime, channel: "official" },
    }),
    [component.runtime, component.capabilityProfile],
  );
  const requestedRuntimeKey = `${requestedRuntime.origin}\u0000${requestedRuntime.url}`;
  const [fallbackForRuntime, setFallbackForRuntime] = useState<string>();
  const runtime = fallbackForRuntime === requestedRuntimeKey
    ? officialRuntime
    : requestedRuntime;
  const authoring = Boolean(onProjectChange);
  const fixedHeight = Math.max(280, component.height ?? 520);
  const hostStyle =
    component.heightMode === "fill"
      ? { height: "100%", minHeight: `${component.minHeight ?? 280}px` }
      : { height: `${fixedHeight}px`, minHeight: `${component.minHeight ?? 280}px` };

  useEffect(() => {
    if (availability) return;
    const host = hostRef.current;
    const frameShell = frameShellRef.current;
    const iframe = iframeRef.current;
    if (!host || !frameShell || !iframe) return;
    const adapter = new GeoLibreAdapter(iframe, runtime, {
      onProject(project) {
        callbacksRef.current.onProjectChange?.(project);
      },
      onSelection(event) {
        callbacksRef.current.onSelection(event);
      },
      onStatus: setStatus,
      onUnavailable(message) {
        if (runtime.channel === "managed") {
          setStatus({
            state: "initializing",
            message: "The managed runtime is unavailable; trying the official GeoLibre fallback.",
          });
          setFallbackForRuntime(requestedRuntimeKey);
        } else {
          setStatus({ state: "error", message });
        }
      },
    });
    adapterRef.current = adapter;
    adapter.loadProject(document, dataSignature);
    const resize = observeGeoLibreResize(frameShell, iframe);
    adapter.start();
    return () => {
      resize.disconnect();
      adapter.destroy();
      if (adapterRef.current === adapter) adapterRef.current = undefined;
    };
  }, [runtime.url, runtime.origin, requestedRuntimeKey, availability?.state, availability?.message]);

  useEffect(() => {
    adapterRef.current?.loadProject(document, dataSignature);
  }, [document, dataSignature]);

  useEffect(() => {
    adapterRef.current?.highlightFeatures(highlightedFeatures);
  }, [highlightedFeatures]);

  const restore = () => {
    callbacksRef.current.onProjectChange?.(savedProjectRef.current);
    adapterRef.current?.loadProject(
      savedDocumentRef.current,
      dataSignature,
      true,
    );
    setStatus({ state: "clean", message: "Restored the last saved GeoLibre project." });
  };
  const reset = () => {
    callbacksRef.current.onProjectChange?.(resetProject);
    adapterRef.current?.loadProject(resetDocument, dataSignature, true);
    setStatus({ state: "dirty", message: "Reset to a new GeoLibre project. Save the HyperPBI draft to persist it." });
  };

  return (
    <section
      ref={hostRef}
      class={`hp-geolibre-workspace hp-geolibre-state-${status.state}`}
      style={hostStyle}
      aria-label={component.ariaLabel ?? component.title ?? "GeoLibre GIS workspace"}
    >
      {authoring ? (
        <header class="hp-geolibre-authoring-bar">
          <div>
            <span class="hp-geolibre-status" data-state={status.state}>
              {status.state}
            </span>
            <span title={status.message}>{status.message ?? "GeoLibre workspace"}</span>
          </div>
          <div>
            <button type="button" onClick={restore} disabled={status.state === "initializing"}>
              Revert
            </button>
            <button type="button" onClick={reset} disabled={status.state === "initializing"}>
              Reset project
            </button>
          </div>
        </header>
      ) : null}
      <div ref={frameShellRef} class="hp-geolibre-frame-shell">
        {availability ? (
          <div class={availability.state === "denied" ? "hp-geolibre-error" : "hp-geolibre-loading"} role={availability.state === "denied" ? "alert" : "status"}>
            <strong>{availability.state === "denied" ? "GeoLibre network access is unavailable." : "Checking GeoLibre network access…"}</strong>
            <span>{availability.message}</span>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            class="hp-geolibre-frame"
            title={component.title ?? "GeoLibre GIS workspace"}
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals"
            allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
        {!availability && status.state === "initializing" ? (
          <div class="hp-geolibre-loading" role="status">
            <strong>Loading GeoLibre…</strong>
            <span>{status.message}</span>
          </div>
        ) : null}
        {!availability && status.state === "error" ? (
          <div class="hp-geolibre-error" role="alert">
            <strong>GeoLibre could not load safely.</strong>
            <span>{status.message}</span>
          </div>
        ) : null}
      </div>
      {warnings.length > 0 ? (
        <details class="hp-geolibre-warnings">
          <summary>{warnings.length} Power BI layer warning{warnings.length === 1 ? "" : "s"}</summary>
          <ul>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </details>
      ) : null}
    </section>
  );
}
