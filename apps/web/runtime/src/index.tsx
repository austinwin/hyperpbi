import { h, render } from "preact";
import "@tabler/core/dist/css/tabler.css";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "../../../../src/styles/tabler-overrides.css";
import "../../../../src/styles/hyperpbi.css";
import "../../../../src/styles/hyperpbi-studio.css";
import "../../../../src/styles/hyperpbi-map-studio.css";
import "../../../../src/styles/hyperpbi-inspector.css";
import "../../../../src/styles/hyperpbi-shell.css";
import "../../../../src/styles/hyperpbi-map.css";
import "../../../../src/styles/hyperpbi-svg.css";
import "../../../../src/styles/hyperpbi-geolibre.css";
import "../../../playground/src/playground.css";
import { IndexedDbProjectStorage } from "@hyperpbi/playground/projectStorage";
import { importProjectBundle } from "@hyperpbi/playground/projectBundle";
import type { HyperPbiProject } from "@hyperpbi/playground/project";
import { HomePage } from "../../../playground/src/components/HomePage";
import { ProjectPage } from "../../../playground/src/components/ProjectPage";
import { PlayPage } from "../../../playground/src/components/PlayPage";
import { PlaygroundRenderer } from "../../../playground/src/components/PlaygroundRenderer";
import { MapGalleryPage } from "../../../playground/src/components/MapGalleryPage";
import { configurePlaygroundRouter } from "../../../playground/src/router";

export interface PlaygroundExampleLink {
  slug: string;
  title: string;
  summary: string;
  useCase?: string;
  theme?: "light" | "dark";
  accent?: string;
  bundle?: string;
}

export type HyperPbiIslandView =
  | {
      kind: "playground-home";
      examples?: PlaygroundExampleLink[];
    }
  | {
      kind: "playground-project";
      projectId: string;
    }
  | {
      kind: "playground-play";
      projectId: string;
    }
  | {
      kind: "dashboard-preview";
      bundle: string;
    }
  | {
      kind: "map-gallery";
    };

export interface HyperPbiIslandMountOptions {
  view: HyperPbiIslandView;
  onNavigate?: (path: string) => void;
}

const storage = new IndexedDbProjectStorage();

export function mountHyperPbiIsland(
  host: HTMLElement,
  options: HyperPbiIslandMountOptions,
): () => void {
  const resetRouter = configurePlaygroundRouter({
    basePath: "/playground",
    onNavigate: options.onNavigate,
  });
  const view = options.view;
  if (view.kind === "playground-home") {
    render(
      <HomePage storage={storage} examples={view.examples} />,
      host,
    );
  } else if (view.kind === "playground-project") {
    render(<ProjectPage projectId={view.projectId} storage={storage} />, host);
  } else if (view.kind === "playground-play") {
    render(<PlayPage projectId={view.projectId} storage={storage} />, host);
  } else if (view.kind === "map-gallery") {
    render(<MapGalleryPage />, host);
  } else {
    const parsed = parseProject(view.bundle);
    render(
      parsed.project ? (
        <PlaygroundRenderer
          project={parsed.project}
          className="pg-embedded-preview"
        />
      ) : (
        <div class="pg-render-error" role="alert">
          <strong>This dashboard example could not be loaded.</strong>
          <ul>
            {parsed.errors.map((error) => (
              <li>{error}</li>
            ))}
          </ul>
        </div>
      ),
      host,
    );
  }
  return () => {
    render(null, host);
    resetRouter();
  };
}

export async function importProjectIntoPlayground(
  bundle: string,
): Promise<{ projectId: string; path: string }> {
  const result = importProjectBundle(bundle);
  if (!result.project) {
    throw new Error(result.errors.join("\n") || "The project bundle is invalid.");
  }
  await storage.saveProject(result.project);
  return {
    projectId: result.project.metadata.id,
    path: `/playground/project/${encodeURIComponent(result.project.metadata.id)}`,
  };
}

function parseProject(bundle: string): {
  project?: HyperPbiProject;
  errors: string[];
} {
  try {
    const direct = JSON.parse(bundle) as HyperPbiProject;
    if (
      direct?.format === "hyperpbi-playground-project" &&
      direct.formatVersion === 1
    ) {
      return { project: direct, errors: [] };
    }
  } catch {
    // The shared importer below provides the actionable parse diagnostic.
  }
  return importProjectBundle(bundle);
}

export const hyperPbiIslandRuntime = {
  mount: mountHyperPbiIsland,
  importProject: importProjectIntoPlayground,
};

declare global {
  interface Window {
    HyperPbiIsland?: typeof hyperPbiIslandRuntime;
  }
}

window.HyperPbiIsland = hyperPbiIslandRuntime;
window.dispatchEvent(new Event("hyperpbi:island-ready"));
