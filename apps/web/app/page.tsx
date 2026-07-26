import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Braces,
  Check,
  Database,
  FileJson2,
  Gauge,
  Map,
  PanelTop,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { componentCatalog } from "@/lib/catalog";
import { listDashboardExamples } from "@/lib/examples";

export default function HomePage() {
  const exampleCount = listDashboardExamples().length;

  return (
    <>
      <section className="home-hero">
        <div className="page-shell home-hero__grid">
          <div className="home-hero__copy">
            <span className="eyebrow"><Sparkles size={14} /> Governed analytics applications</span>
            <h1>Build once.<br /><span>Run everywhere.</span></h1>
            <p>
              HyperPBI turns strict JSON and your existing data into polished dashboard
              experiences that run through the same validation and component runtime in
              Power BI and the browser.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary" href="/playground">
                Open Playground <ArrowRight size={16} />
              </Link>
              <Link className="button button--secondary" href="/docs/user-guide">
                Get started
              </Link>
            </div>
            <div className="hero-proof">
              <span><Check size={14} /> Schema 2.0</span>
              <span><Check size={14} /> No user JavaScript</span>
              <span><Check size={14} /> Local-first authoring</span>
            </div>
          </div>
          <div className="runtime-window" aria-label="HyperPBI specification and dashboard preview">
            <div className="runtime-window__bar">
              <span><i /><i /><i /></span>
              <b>operations.hyperpbi.json</b>
              <small>Preview current</small>
            </div>
            <div className="runtime-window__body">
              <pre aria-label="Example HyperPBI JSON"><code>{`{
  "version": "2.0",
  "title": "Operations overview",
  "components": [
    { "type": "kpi", "id": "revenue",
      "field": "revenue", "format": "$0.0a" },
    { "type": "lineChart", "id": "trend",
      "category": "month", "measure": "revenue" }
  ]
}`}</code></pre>
              <div className="runtime-window__preview">
                <header><span>Operations</span><small>Last 12 months</small></header>
                <div className="preview-kpis">
                  <span><small>Revenue</small><strong>$8.42M</strong><em>+12.8%</em></span>
                  <span><small>Margin</small><strong>28.4%</strong><em>+2.1%</em></span>
                  <span><small>Orders</small><strong>12,840</strong><em>+8.6%</em></span>
                </div>
                <div className="preview-chart">
                  {[34, 45, 39, 58, 51, 64, 72, 67, 82, 78, 92, 88].map((height, index) => (
                    <i key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats">
        <div className="page-shell home-stats__grid">
          <div><strong>{componentCatalog.componentCount}</strong><span>governed components</span></div>
          <div><strong>{componentCatalog.categories.length}</strong><span>component families</span></div>
          <div><strong>{exampleCount || "8"}</strong><span>complete dashboards</span></div>
          <div><strong>2</strong><span>first-class hosts</span></div>
        </div>
      </section>

      <section className="content-section">
        <div className="page-shell">
          <div className="section-heading section-heading--center">
            <span className="eyebrow">One authoring model</span>
            <h2>From data to a governed dashboard</h2>
            <p>Every surface shares the same schema, preparation pipeline, safety rules, and runtime behavior.</p>
          </div>
          <div className="workflow-grid">
            <article><span><Database size={20} /></span><small>01</small><h3>Bring your data</h3><p>Bind Power BI Values or upload local CSV and XLSX sources in the Playground.</p></article>
            <article><span><Braces size={20} /></span><small>02</small><h3>Author visually or with AI</h3><p>Use the Studio, strict JSON, reusable patterns, or an approved external AI workflow.</p></article>
            <article><span><ShieldCheck size={20} /></span><small>03</small><h3>Validate the whole app</h3><p>Resolve fields, datasets, interactions, styles, and security policies before render.</p></article>
            <article><span><PanelTop size={20} /></span><small>04</small><h3>Run in both hosts</h3><p>Use one portable specification with explicit browser and Power BI host bridges.</p></article>
          </div>
        </div>
      </section>

      <section className="content-section content-section--soft">
        <div className="page-shell feature-layout">
          <div>
            <span className="eyebrow">A serious component runtime</span>
            <h2>Dashboards that feel like complete products</h2>
            <p className="feature-layout__lede">
              Go beyond disconnected charts with responsive application shells, controls,
              overlays, logical datasets, declarative actions, analytical maps, and safe SVG.
            </p>
            <div className="feature-list">
              <span><Blocks size={18} /><b>Responsive application layout</b><small>Grids, split panes, sidebars, navigation, and bounded fill sizing.</small></span>
              <span><Gauge size={18} /><b>Charts, tables, and metrics</b><small>Semantic components backed by governed ECharts and native data displays.</small></span>
              <span><Map size={18} /><b>Operational maps</b><small>Power BI geometry, ArcGIS services, legends, joins, selection, and map tools.</small></span>
              <span><FileJson2 size={18} /><b>Portable by construction</b><small>Export the specification, Runtime Configuration, or a complete local project.</small></span>
            </div>
            <Link className="text-link" href="/components">Explore all components <ArrowRight size={15} /></Link>
          </div>
          <div className="feature-cards" aria-hidden="true">
            <article className="feature-card feature-card--wide"><small>Monthly revenue</small><strong>$2.84M</strong><em>+14.2%</em><div className="mini-line" /></article>
            <article><small>On-time</small><strong>94%</strong><div className="mini-ring" /></article>
            <article><small>At risk</small><strong>12</strong><div className="mini-bars"><i /><i /><i /><i /></div></article>
            <article className="feature-card feature-card--map"><small>Live regions</small><div><i /><i /><i /></div></article>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="page-shell cta-panel">
          <div><span className="eyebrow">Start with something real</span><h2>Open a complete dashboard, then make it yours.</h2></div>
          <div><Link className="button button--light" href="/examples">Browse examples <ArrowRight size={16} /></Link><Link className="button button--ghost-light" href="/playground">Launch Playground</Link></div>
        </div>
      </section>
    </>
  );
}
