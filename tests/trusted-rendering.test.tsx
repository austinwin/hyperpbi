import { describe, expect, it } from "vitest";
import { render, h } from "preact";
import { act } from "preact/test-utils";
import { renderTrustedTemplate } from "../src/security/trustedTemplate";
import { TrustedDocument } from "../src/security/TrustedDocument";
import { IsolatedVisual } from "../src/security/IsolatedVisual";
import { sanitizeCss } from "../src/security/sanitizeCss";
import { sanitizeSvg } from "../src/security/sanitizeSvg";
import { parseConfig } from "../src/config/hyperpbiConfig";
import type { NormalizedData } from "../src/data/normalizeData";

const data = { rows: [], fields: {}, aggregates: {}, calculatedMetrics: {} } as unknown as NormalizedData;
describe("trusted author isolation", () => {
    it("preserves full CSS, imports, filters, positioning and infinite animation", () => {
        const css = '@import "https://example.com/fonts.css";@font-face{font-family:map;src:url(font.woff2)}@keyframes pulse{to{opacity:0}}:root{--custom:red}body::before{position:fixed;filter:blur(2px);animation:pulse 1s infinite;z-index:99999}';
        expect(sanitizeCss(css, "#visual", { mode: "trusted" })).toEqual({ css, warnings: [] });
        expect(sanitizeCss(css, "#visual").css).not.toContain("@import");
    });
    it("retains SVG filters, symbols, references, foreignObject and animation", () => {
        const svg = '<svg><defs><symbol id="pin"><circle r="5"/></symbol><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><use href="#pin" filter="url(#blur)"/><foreignObject><div xmlns="http://www.w3.org/1999/xhtml">HTML</div></foreignObject><animate attributeName="opacity" values="0;1" dur="1s" repeatCount="indefinite"/></svg>';
        expect(sanitizeSvg(svg, "test", { mode: "trusted" }).svg).toBe(svg);
        expect(sanitizeSvg(svg, "test").svg).not.toContain("foreignObject");
    });
    it("binds HTML fields as inert text and attributes after parsing", () => {
        const payload = '"><img src=x onerror=alert(1)>';
        const result = renderTrustedTemplate('<section data-custom="{{row.name}}">{{row.name}}</section><input><iframe></iframe><script>window.author=true</script>', data, {}, "", { row: { name: payload } });
        const doc = new DOMParser().parseFromString(result, "text/html");
        expect(doc.querySelector("section")?.textContent).toBe(payload);
        expect(doc.querySelector("section")?.getAttribute("data-custom")).toBe(payload);
        expect(doc.querySelector("img")).toBeNull();
        expect(doc.querySelector("script")?.textContent).toBe("window.author=true");
    });
    it.each(['<script>{{row.name}}</script>', '<style>{{row.name}}</style>', '<button onclick="{{row.name}}">Click</button>', '<iframe srcdoc="{{row.name}}"></iframe>', '<a href="{{row.name}}">Link</a>'])("rejects executable binding contexts: %s", template => {
        expect(() => renderTrustedTemplate(template, data, {}, "", { row: { name: "javascript:alert(1)" } })).toThrow();
    });
    it("uses an opaque-origin sandbox without a host bridge", () => {
        const host = document.createElement("div");
        act(() => render(<TrustedDocument markup='<form><input><button>Submit</button></form><script>window.test=true</script>' />, host));
        const frame = host.querySelector("iframe")!;
        expect(frame.getAttribute("sandbox")).toBe("allow-forms allow-downloads");
        expect(frame.srcdoc).toContain("<script>");
        expect(frame.srcdoc).toContain("<form>");
        expect(frame.srcdoc).not.toContain("postMessage");
        act(() => render(null, host));
    });
    it("mounts unrestricted styles in a shadow tree behind outer paint containment", () => {
        const host = document.createElement("div"); document.body.append(host);
        act(() => render(<IsolatedVisual enabled><style>{"body{color:red}"}</style><div>Isolated</div></IsolatedVisual>, host));
        expect(host.querySelector(".hp-isolated-visual > div")?.shadowRoot?.textContent).toContain("Isolated");
        expect(host.querySelector(".hp-isolated-visual")?.getAttribute("style")).toContain("contain");
        act(() => render(null, host)); host.remove();
    });
    it("requires an explicit valid SVG trust selection", () => {
        expect(parseConfig('{"security":{"svgMode":"trusted"}}').config?.security?.svgMode).toBe("trusted");
        expect(parseConfig('{"security":{"svgMode":"bad"}}').errors).toContain("security.svgMode must be sanitized or trusted.");
    });
});
