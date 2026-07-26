import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Compass, Map, ShieldCheck, Sparkles } from "lucide-react";
import { listDocumentation } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn HyperPBI authoring, schema, data, interactions, maps, security, and deployment.",
};

export const dynamic = "force-static";

const icons = [Compass, Braces, Sparkles, Map, ShieldCheck, BookOpen];

export default function DocsPage() {
  const docs = listDocumentation();
  return (
    <div className="page-shell page-stack">
      <header className="page-hero">
        <span className="eyebrow">Learn HyperPBI</span>
        <h1>Documentation</h1>
        <p>Start with the authoring workflow, then go deeper into the strict schema, data model, interactions, maps, security, and runtime architecture.</p>
      </header>
      <section className="docs-start">
        <div>
          <span>Start here</span>
          <h2>Build your first portable dashboard</h2>
          <p>Follow the complete workflow from data and field aliases through Studio validation, Play Mode, and Power BI export.</p>
          <Link className="button button--primary" href="/docs/user-guide">Read the user guide <ArrowRight size={16} /></Link>
        </div>
        <pre><code>{`{
  "version": "2.0",
  "components": [
    {
      "type": "kpi",
      "id": "total_sales",
      "field": "sales",
      "aggregation": "sum"
    }
  ]
}`}</code></pre>
      </section>
      <section>
        <div className="section-heading"><span className="eyebrow">Reference library</span><h2>Explore every part of the platform</h2></div>
        <div className="docs-grid">
          {docs.map((doc, index) => {
            const Icon = icons[index % icons.length];
            return (
              <Link href={`/docs/${doc.slug}`} key={doc.slug}>
                <span><Icon size={18} /></span>
                <div><h2>{doc.title}</h2><p>{doc.summary}</p></div>
                <ArrowRight size={16} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
