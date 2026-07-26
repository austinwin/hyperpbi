import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hyperpbi.com"),
  title: {
    default: "HyperPBI — portable dashboards for Power BI and the web",
    template: "%s · HyperPBI",
  },
  description:
    "Build governed, portable analytics applications with one HyperPBI specification and runtime for Power BI and the browser.",
  applicationName: "HyperPBI",
  openGraph: {
    type: "website",
    siteName: "HyperPBI",
    title: "HyperPBI — portable dashboards for Power BI and the web",
    description:
      "Author once, validate once, and run the same governed dashboard in Power BI or the browser.",
    images: [
      {
        url: "/og.png",
        width: 1715,
        height: 909,
        alt: "HyperPBI — portable dashboards for Power BI and the web",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HyperPBI — portable dashboards for Power BI and the web",
    description:
      "Author once, validate once, and run the same governed dashboard in Power BI or the browser.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content" className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
