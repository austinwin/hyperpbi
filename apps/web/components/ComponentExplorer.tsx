"use client";

import { Check, Copy, Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import type { CatalogComponent } from "@/lib/catalog";

export function ComponentExplorer({
  components,
  categories,
}: {
  components: CatalogComponent[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [maturity, setMaturity] = useState("All");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(
    () =>
      components.filter((component) => {
        if (category !== "All" && component.category !== category) return false;
        if (maturity !== "All" && component.maturity !== maturity) return false;
        if (!deferredQuery) return true;
        return [
          component.type,
          component.label,
          component.category,
          component.useWhen,
          component.summary,
          component.maturity,
          ...component.allowed,
        ]
          .join(" ")
          .toLowerCase()
          .includes(deferredQuery);
      }),
    [category, components, deferredQuery, maturity],
  );

  return (
    <div className="component-explorer">
      <div className="component-explorer__toolbar">
        <label className="search-field">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Search components</span>
          <input
            type="search"
            placeholder="Search type, property, or use case…"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <kbd>/</kbd>
        </label>
        <label className="select-field">
          <SlidersHorizontal aria-hidden="true" size={15} />
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>
            <option>All</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="select-field">
          <span className="sr-only">Filter by maturity</span>
          <select value={maturity} onChange={(event) => setMaturity(event.currentTarget.value)}>
            <option>All</option>
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
            <option value="experimental">Experimental</option>
          </select>
        </label>
      </div>
      <div className="component-explorer__result">
        <span><strong>{filtered.length}</strong> of {components.length} components</span>
        {(query || category !== "All" || maturity !== "All") && (
          <button type="button" onClick={() => { setQuery(""); setCategory("All"); setMaturity("All"); }}>
            Clear filters
          </button>
        )}
      </div>
      {filtered.length ? (
        <div className="component-grid">
          {filtered.map((component) => (
            <ComponentCard component={component} key={component.type} />
          ))}
        </div>
      ) : (
        <div className="empty-result">
          <Search size={24} aria-hidden="true" />
          <strong>No components match those filters</strong>
          <span>Try a type such as “chart”, a property such as “dataset”, or clear the category.</span>
        </div>
      )}
    </div>
  );
}

function ComponentCard({ component }: { component: CatalogComponent }) {
  const [copied, setCopied] = useState(false);
  const example = JSON.stringify(component.example, null, 2);

  const copy = async () => {
    await navigator.clipboard.writeText(example);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <article className="component-card">
      <header>
        <div>
          <code>{component.type}</code>
          <h2>{component.label}</h2>
        </div>
        <span className={`maturity-badge is-${component.maturity}`}>{component.maturity}</span>
      </header>
      <p>{component.useWhen}</p>
      <div className="component-card__meta">
        <span>{component.category}</span>
        <span>{component.complexity}</span>
        {component.interaction.defaultEnabled && <span>interactive</span>}
      </div>
      <details>
        <summary>Contract and JSON</summary>
        <div className="component-card__details">
          <div className="property-list">
            <strong>Required</strong>
            <span>{component.required.map((property) => <code key={property}>{property}</code>)}</span>
          </div>
          <div className="property-list">
            <strong>Properties</strong>
            <span>{component.allowed.slice(0, 14).map((property) => <code key={property}>{property}</code>)}</span>
            {component.allowed.length > 14 && <small>+{component.allowed.length - 14} more in the full reference</small>}
          </div>
          <div className="code-sample">
            <button type="button" aria-label={`Copy ${component.type} JSON`} onClick={() => void copy()}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <pre><code>{example}</code></pre>
          </div>
        </div>
      </details>
    </article>
  );
}
