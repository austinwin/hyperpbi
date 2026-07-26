import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarkdownDocument } from "@/components/MarkdownDocument";
import { documentationSlugs, readDocumentation } from "@/lib/docs";

export const dynamicParams = false;

export function generateStaticParams() {
  return documentationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = readDocumentation(slug);
  return doc ? { title: doc.title, description: doc.summary } : { title: "Documentation" };
}

export default async function DocumentationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = readDocumentation(slug);
  if (!doc) notFound();
  const slugs = documentationSlugs();
  const index = slugs.indexOf(slug);
  const previous = index > 0 ? readDocumentation(slugs[index - 1]) : undefined;
  const next = index >= 0 && index < slugs.length - 1 ? readDocumentation(slugs[index + 1]) : undefined;

  return (
    <div className="docs-layout page-shell">
      <aside className="docs-sidebar">
        <Link className="back-link" href="/docs"><ArrowLeft size={14} /> Documentation home</Link>
        <nav aria-label="Documentation pages">
          {slugs.map((item) => {
            const entry = readDocumentation(item);
            return <Link className={item === slug ? "is-active" : undefined} href={`/docs/${item}`} key={item}>{entry?.title ?? item}</Link>;
          })}
        </nav>
      </aside>
      <div className="docs-content">
        <MarkdownDocument content={doc.content} currentSlug={slug} />
        <nav className="docs-pagination" aria-label="Previous and next documentation">
          {previous ? <Link href={`/docs/${previous.slug}`}><small>Previous</small><span><ArrowLeft size={14} /> {previous.title}</span></Link> : <span />}
          {next ? <Link href={`/docs/${next.slug}`}><small>Next</small><span>{next.title} <ArrowRight size={14} /></span></Link> : <span />}
        </nav>
      </div>
    </div>
  );
}
