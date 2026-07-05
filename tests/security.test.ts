import { describe, expect, it } from "vitest";
import { sanitizeCss } from "../src/security/sanitizeCss";
import { sanitizeHtml } from "../src/security/sanitizeHtml";
import { safeUrl } from "../src/security/safeUrl";

describe("security boundaries", () => {
    it("removes executable HTML", () => {
        const result = sanitizeHtml(`<div onclick="alert(1)">Safe<script>alert(1)</script><iframe src="https://example.com"></iframe></div>`);
        expect(result.html).toContain("Safe");
        expect(result.html).not.toMatch(/script|iframe|onclick/i);
        expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("scopes CSS and blocks escape mechanisms", () => {
        const result = sanitizeCss(`@import "https://bad.test/x.css"; body .card { position: fixed; color: #123; background: url(https://bad.test/x); z-index: 9999; }`, "#hp-test");
        expect(result.css).toContain("#hp-test");
        expect(result.css).toContain("color:#123");
        expect(result.css).not.toMatch(/@import|fixed|url\(|9999/i);
    });

    it("denies network and script URLs by default", () => {
        expect(safeUrl("javascript:alert(1)")).toBeNull();
        expect(safeUrl("https://example.com/image.png")).toBeNull();
        expect(safeUrl("https://example.com/image.png", { allowExternal: true })).toBe("https://example.com/image.png");
    });
});
