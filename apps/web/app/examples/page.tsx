import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import { listDashboardExamples } from "@/lib/examples";

export const metadata: Metadata = {
  title: "Dashboard Examples",
  description: "Load polished, portable HyperPBI dashboard projects for real-world use cases.",
};

export const dynamic = "force-static";

export default function ExamplesPage() {
  const examples = listDashboardExamples();
  return (
    <div className="page-shell page-stack">
      <header className="page-hero">
        <span className="eyebrow">Portable by design</span>
        <h1>Dashboard examples</h1>
        <p>
          Complete projects with specification JSON, Runtime Configuration, realistic data,
          documentation, and a Playground bundle. Every example uses the same runtime as Power BI.
        </p>
      </header>
      <div className="example-grid">
        {examples.map((example) => (
          <Link
            className={`example-card is-${example.theme}`}
            href={`/examples/${example.slug}`}
            key={example.slug}
            style={{ "--example-accent": example.accent } as React.CSSProperties}
          >
            <DashboardThumbnail theme={example.theme} />
            <div className="example-card__body">
              <span>{example.useCase}</span>
              <h2>{example.title}</h2>
              <p>{example.summary}</p>
              <div>{example.tags.slice(0, 3).map((tag) => <small key={tag}>{tag}</small>)}</div>
              <b>View dashboard <ArrowRight size={15} /></b>
            </div>
          </Link>
        ))}
        <Link className="example-card example-card--maps" href="/examples/maps">
          <div className="example-card__map"><Map size={32} /><i /><i /><i /></div>
          <div className="example-card__body">
            <span>Component gallery</span>
            <h2>Analytical maps</h2>
            <p>Explore 29 focused map configurations, from simple points to ArcGIS services and spatial selection.</p>
            <b>Open map gallery <ArrowRight size={15} /></b>
          </div>
        </Link>
      </div>
    </div>
  );
}

function DashboardThumbnail({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className={`dashboard-thumbnail is-${theme}`} aria-hidden="true">
      <aside><i /><i /><i /><i /></aside>
      <div className="dashboard-thumbnail__main">
        <header><span /><b /></header>
        <section><i /><i /><i /></section>
        <div><span /><span /></div>
      </div>
    </div>
  );
}
