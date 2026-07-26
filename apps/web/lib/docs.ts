import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { repositoryRoot } from "./content-root";

export interface DocumentationEntry {
  slug: string;
  title: string;
  summary: string;
  content: string;
}

const preferredOrder = [
  "user-guide",
  "hyperpbi-spec-reference",
  "data-model",
  "interactions",
  "ai-authoring",
  "custom-components",
  "svg-visuals",
  "maps",
  "map-services",
  "security",
  "calculations-dsl",
  "repair-workflow",
  "migration-versioning",
  "architecture",
  "hyperpbi-component-catalog-reference",
  "hyperpbi-ai-skill",
  "chatgpt-guideline",
];

const summaries: Record<string, string> = {
  "user-guide": "Build, validate, preview, and publish HyperPBI dashboards.",
  "hyperpbi-spec-reference": "The strict version 2.0 dashboard contract.",
  "data-model": "Fields, aliases, logical datasets, calculations, and lineage.",
  interactions: "Internal state and Power BI selection/filter behavior.",
  "ai-authoring": "Generate safe, reviewable dashboards with external AI tools.",
  "custom-components": "Choose governed text, HTML, custom, and SVG surfaces.",
  "svg-visuals": "Declarative diagrams, schematics, gauges, and motion.",
  maps: "Build analytical maps from Power BI and service data.",
  "map-services": "Provider access, ArcGIS behavior, and package profiles.",
  security: "Sanitization, provider boundaries, and safe authoring.",
  "calculations-dsl": "Derived fields and metrics with the bounded expression DSL.",
  "repair-workflow": "Diagnose and repair invalid dashboards without losing work.",
  "migration-versioning": "Schema boundaries and explicit legacy conversion.",
  architecture: "Shared runtime, hosts, persistence, and portability.",
  "hyperpbi-component-catalog-reference":
    "Canonical properties and valid JSON for every component.",
  "hyperpbi-ai-skill": "The generated portable AI authoring reference.",
  "chatgpt-guideline": "Concise response rules for external AI authoring.",
};

function docsDirectory(): string {
  return path.join(repositoryRoot(), "docs");
}

export function documentationSlugs(): string[] {
  const available = new Set(
    readdirSync(docsDirectory())
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -3)),
  );
  return [
    ...preferredOrder.filter((slug) => available.delete(slug)),
    ...Array.from(available).sort(),
  ];
}

export function readDocumentation(slug: string): DocumentationEntry | undefined {
  if (!/^[a-z0-9-]+$/.test(slug)) return undefined;
  const file = path.join(docsDirectory(), `${slug}.md`);
  try {
    const content = readFileSync(file, "utf8");
    const title =
      content.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
      slug.replaceAll("-", " ").replace(/\b\w/g, (value) => value.toUpperCase());
    return {
      slug,
      title,
      summary: summaries[slug] ?? firstParagraph(content),
      content,
    };
  } catch {
    return undefined;
  }
}

export function listDocumentation(): DocumentationEntry[] {
  return documentationSlugs()
    .map(readDocumentation)
    .filter((entry): entry is DocumentationEntry => Boolean(entry));
}

function firstParagraph(content: string): string {
  return (
    content
      .split(/\n\s*\n/)
      .map((value) => value.replace(/^#+\s+/, "").trim())
      .find((value) => value && !value.startsWith("<!--") && !value.startsWith("```"))
      ?.slice(0, 180) ?? "HyperPBI documentation."
  );
}
