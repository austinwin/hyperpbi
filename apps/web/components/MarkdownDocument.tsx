import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownDocument({
  content,
  currentSlug,
}: {
  content: string;
  currentSlug: string;
}) {
  return (
    <article className="markdown-document">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href = "", children, ...props }) {
            const destination = documentationHref(href, currentSlug);
            if (destination.startsWith("/")) {
              return <Link href={destination}>{children}</Link>;
            }
            return <a href={destination} {...props}>{children}</a>;
          },
          pre({ children }) {
            return <pre tabIndex={0}>{children}</pre>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

function documentationHref(href: string, _currentSlug: string): string {
  if (!href || href.startsWith("#")) return href;
  if (/^[a-z]+:/i.test(href)) return href;
  const [target, fragment] = href.split("#", 2);
  if (/^(?:\.\.\/)?examples\/map(?:\/|$)/.test(target)) {
    return "/examples/maps";
  }
  if (/^(?:\.\.\/)?examples\/dashboards(?:\/|$)/.test(target)) {
    return "/examples";
  }
  if (target.startsWith("../examples/") || target.startsWith("examples/")) {
    return "https://github.com/austinwin/hyperpbi/tree/main/examples";
  }
  if (target.endsWith(".md")) {
    const slug = target
      .replace(/^\.\//, "")
      .replace(/^docs\//, "")
      .replace(/\.md$/, "");
    if (slug === "README" || slug === "../README") return "/";
    return `/docs/${slug}${fragment ? `#${fragment}` : ""}`;
  }
  return href;
}
