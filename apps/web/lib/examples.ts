import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { repositoryRoot } from "./content-root";

export interface DashboardExample {
  id: string;
  slug: string;
  title: string;
  useCase: string;
  summary: string;
  description: string;
  theme: "light" | "dark";
  accent: string;
  tags: string[];
  referenceImages: number[];
  folder: string;
  specification: string;
  runtime: string;
  data: string;
  project: string;
  powerBiPackage: "core" | "maps";
  expected: string;
  limitations: string;
}

interface DashboardManifest {
  version: string;
  examples: DashboardExample[];
}

function examplesDirectory(): string {
  return path.join(repositoryRoot(), "examples", "dashboards");
}

export function dashboardManifest(): DashboardManifest {
  const manifestFile = path.join(examplesDirectory(), "manifest.json");
  if (!existsSync(manifestFile)) return { version: "1.0", examples: [] };
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8")) as DashboardManifest;
  return {
    version: manifest.version,
    examples: manifest.examples.filter(
      (example) =>
        example.id === example.slug &&
        example.folder === example.slug &&
        /^[a-z0-9-]+$/.test(example.slug),
    ),
  };
}

export function listDashboardExamples(): DashboardExample[] {
  return dashboardManifest().examples;
}

export function dashboardExample(slug: string): DashboardExample | undefined {
  if (!/^[a-z0-9-]+$/.test(slug)) return undefined;
  return listDashboardExamples().find((example) => example.slug === slug);
}

export function readDashboardBundle(example: DashboardExample): string {
  const expectedPrefix = `${example.folder}/`;
  if (!example.project.startsWith(expectedPrefix)) {
    throw new Error(`Example “${example.slug}” has an invalid project path.`);
  }
  return readFileSync(path.join(examplesDirectory(), example.project), "utf8");
}

export function readDashboardAsset(
  example: DashboardExample,
  property: "specification" | "runtime" | "data",
): string {
  const relative = example[property];
  if (!relative.startsWith(`${example.folder}/`)) {
    throw new Error(`Example “${example.slug}” has an invalid ${property} path.`);
  }
  return readFileSync(path.join(examplesDirectory(), relative), "utf8");
}
