"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface PlaygroundExamplePayload {
  slug: string;
  title: string;
  summary: string;
  useCase?: string;
  theme?: "light" | "dark";
  accent?: string;
  bundle?: string;
}

export type IslandView =
  | { kind: "playground-home"; examples?: PlaygroundExamplePayload[] }
  | { kind: "playground-project"; projectId: string }
  | { kind: "playground-play"; projectId: string }
  | { kind: "dashboard-preview"; bundle: string }
  | { kind: "map-gallery" };

interface IslandRuntimeApi {
  mount(
    host: HTMLElement,
    options: {
      view: IslandView;
      onNavigate?: (path: string) => void;
    },
  ): () => void;
  importProject(bundle: string): Promise<{ projectId: string; path: string }>;
}

declare global {
  interface Window {
    HyperPbiIsland?: IslandRuntimeApi;
  }
}

let runtimePromise: Promise<IslandRuntimeApi> | undefined;

export function loadIslandRuntime(): Promise<IslandRuntimeApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("The HyperPBI runtime is browser-only."));
  }
  if (window.HyperPbiIsland) return Promise.resolve(window.HyperPbiIsland);
  if (runtimePromise) return runtimePromise;

  runtimePromise = new Promise<IslandRuntimeApi>((resolve, reject) => {
    const ready = () => {
      if (window.HyperPbiIsland) resolve(window.HyperPbiIsland);
      else reject(new Error("The HyperPBI runtime loaded without exposing its mount API."));
    };

    if (!document.querySelector('link[data-hyperpbi-runtime="styles"]')) {
      const styles = document.createElement("link");
      styles.rel = "stylesheet";
      styles.href = "/runtime/hyperpbi-island.css";
      styles.dataset.hyperpbiRuntime = "styles";
      document.head.append(styles);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-hyperpbi-runtime="script"]',
    );
    if (existing) {
      existing.addEventListener("load", ready, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("The HyperPBI runtime asset could not be loaded.")),
        { once: true },
      );
      window.addEventListener("hyperpbi:island-ready", ready, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "/runtime/hyperpbi-island.js";
    script.dataset.hyperpbiRuntime = "script";
    script.addEventListener("load", ready, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("The HyperPBI runtime asset could not be loaded.")),
      { once: true },
    );
    window.addEventListener("hyperpbi:island-ready", ready, { once: true });
    document.head.append(script);
  });

  return runtimePromise;
}

export function IslandRuntime({
  view,
  className = "",
  label = "Loading the HyperPBI runtime…",
}: {
  view: IslandView;
  className?: string;
  label?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let disposed = false;
    let unmount: (() => void) | undefined;
    setError("");
    setMounted(false);
    void loadIslandRuntime()
      .then((runtime) => {
        if (disposed || !host.current) return;
        unmount = runtime.mount(host.current, {
          view,
          onNavigate: (path) => router.push(path),
        });
        setMounted(true);
      })
      .catch((reason) => {
        if (!disposed) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      });
    return () => {
      disposed = true;
      unmount?.();
    };
  }, [router, view]);

  return (
    <div
      className={`runtime-island ${mounted ? "is-mounted" : ""} ${className}`}
      data-runtime-mounted={mounted ? "true" : "false"}
    >
      {error ? (
        <div className="runtime-island__error" role="alert">
          <strong>The interactive runtime could not start.</strong>
          <span>{error}</span>
        </div>
      ) : null}
      <div className="runtime-island__loading" aria-hidden={Boolean(error)}>
        <span />
        {label}
      </div>
      <div className="runtime-island__host" ref={host} />
    </div>
  );
}
