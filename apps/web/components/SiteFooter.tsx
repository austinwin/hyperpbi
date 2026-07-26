import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="site-brand site-brand--footer" href="/">
          <span className="site-brand__mark" aria-hidden="true">H</span>
          <span><strong>HyperPBI</strong><small>Portable analytics runtime</small></span>
        </Link>
        <p>One governed dashboard specification for Power BI and the web.</p>
      </div>
      <div className="site-footer__links">
        <Link href="/components">Components</Link>
        <Link href="/playground">Playground</Link>
        <Link href="/examples">Examples</Link>
        <Link href="/docs">Documentation</Link>
        <a href="https://github.com/austinwin/hyperpbi">Source</a>
      </div>
    </footer>
  );
}
