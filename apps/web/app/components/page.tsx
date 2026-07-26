import type { Metadata } from "next";
import { ComponentExplorer } from "@/components/ComponentExplorer";
import { componentCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Component Explorer",
  description: "Search the canonical HyperPBI component catalog and copy valid schema 2.0 JSON.",
};

export default function ComponentsPage() {
  return (
    <div className="page-shell page-stack">
      <header className="page-hero page-hero--compact">
        <span className="eyebrow">Canonical schema inventory</span>
        <h1>Component Explorer</h1>
        <p>
          Search {componentCatalog.componentCount} implemented components, inspect their strict
          contracts, and copy valid HyperPBI 2.0 JSON directly into Studio.
        </p>
      </header>
      <ComponentExplorer
        categories={componentCatalog.categories}
        components={componentCatalog.components}
      />
    </div>
  );
}
