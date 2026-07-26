import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found page-shell">
      <span>404</span>
      <h1>That page is not part of this dashboard.</h1>
      <p>Return home, browse examples, or open the documentation to keep building.</p>
      <div><Link className="button button--primary" href="/">Go home</Link><Link className="button button--secondary" href="/docs">Open docs</Link></div>
    </div>
  );
}
