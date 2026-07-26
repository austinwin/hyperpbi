"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, BookOpen, FlaskConical, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/components", label: "Components", icon: Blocks },
  { href: "/playground", label: "Playground", icon: FlaskConical },
  { href: "/examples", label: "Examples", icon: LayoutDashboard },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" onClick={() => setOpen(false)}>
          <span className="site-brand__mark" aria-hidden="true">H</span>
          <span>
            <strong>HyperPBI</strong>
            <small>Build analytics once</small>
          </span>
        </Link>
        <nav className={open ? "site-nav is-open" : "site-nav"} aria-label="Main navigation">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "is-active" : undefined}
                href={href}
                key={href}
                onClick={() => setOpen(false)}
              >
                <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <a className="site-header__github" href="https://github.com/austinwin/hyperpbi">
          GitHub
          <span aria-hidden="true">↗</span>
        </a>
        <button
          className="site-menu-button"
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
