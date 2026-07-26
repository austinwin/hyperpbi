import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileJson2, PackageCheck } from "lucide-react";
import { IslandRuntime } from "@/components/IslandRuntime";
import { LoadExampleButton } from "@/components/LoadExampleButton";
import {
  dashboardExample,
  listDashboardExamples,
  readDashboardAsset,
  readDashboardBundle,
} from "@/lib/examples";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...listDashboardExamples().map((example) => ({ slug: example.slug })), { slug: "maps" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "maps") return { title: "Analytical Map Gallery" };
  const example = dashboardExample(slug);
  return example
    ? { title: example.title, description: example.summary }
    : { title: "Dashboard example" };
}

export default async function ExamplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "maps") {
    return (
      <IslandRuntime
        className="runtime-island--map-gallery"
        label="Loading analytical map examples…"
        view={{ kind: "map-gallery" }}
      />
    );
  }

  const example = dashboardExample(slug);
  if (!example) notFound();
  const bundle = readDashboardBundle(example);
  const specification = readDashboardAsset(example, "specification");
  const runtime = readDashboardAsset(example, "runtime");

  return (
    <div className={`example-detail is-${example.theme}`} style={{ "--example-accent": example.accent } as React.CSSProperties}>
      <div className="page-shell">
        <Link className="back-link" href="/examples"><ArrowLeft size={15} /> All examples</Link>
        <header className="example-detail__hero">
          <div>
            <span className="eyebrow">{example.useCase}</span>
            <h1>{example.title}</h1>
            <p>{example.description}</p>
            <div className="example-detail__actions">
              <LoadExampleButton bundle={bundle} />
              <a className="button button--secondary" download={`${example.slug}.hyperpbi.json`} href={`data:application/json;charset=utf-8,${encodeURIComponent(specification)}`}>
                <FileJson2 size={16} /> Download specification
              </a>
            </div>
          </div>
          <dl>
            <div><dt>Host parity</dt><dd><CheckCircle2 size={15} /> Playground + Power BI</dd></div>
            <div><dt>Package</dt><dd><PackageCheck size={15} /> {example.powerBiPackage}</dd></div>
            <div><dt>Files</dt><dd>Specification · Runtime · CSV · Project</dd></div>
          </dl>
        </header>
      </div>
      <section className="example-preview-section">
        <div className="example-preview-frame">
          <div className="example-preview-frame__bar">
            <span><i /><i /><i /></span>
            <b>Live HyperPBI preview</b>
            <small>Shared browser runtime</small>
          </div>
          <IslandRuntime
            className="runtime-island--example"
            label={`Preparing ${example.title}…`}
            view={{ kind: "dashboard-preview", bundle }}
          />
        </div>
      </section>
      <div className="page-shell example-detail__notes">
        <article><span>Expected behavior</span><p>{example.expected}</p></article>
        <article><span>Power BI portability</span><p>This example uses the <code>{example.powerBiPackage}</code> package profile and the portable <code>powerbi</code> source alias.</p></article>
        <article><span>Known limitations</span><p>{example.limitations}</p></article>
      </div>
      <div className="page-shell example-json-grid">
        <details>
          <summary>Specification JSON</summary>
          <pre><code>{specification}</code></pre>
        </details>
        <details>
          <summary>Runtime Configuration</summary>
          <pre><code>{runtime}</code></pre>
        </details>
      </div>
    </div>
  );
}
