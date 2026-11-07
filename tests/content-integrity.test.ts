// @vitest-environment node
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { componentDefinitions } from "../src/catalog/componentDefinitions";
import { prepareRemoteFragment } from "../src/fragments/prepareRemoteFragment";
import catalog from "../apps/web/generated/component-catalog.json";

const read = (file: string) => readFileSync(file, "utf8");
const docs = ["README.md", ...readdirSync("docs", { recursive: true }).filter((file): file is string => typeof file === "string" && file.endsWith(".md")).map(file => `docs/${file}`)];
describe("published documentation and examples", () => {
    it("keeps local documentation links resolvable", () => {
        const failures: string[] = [];
        for (const file of docs) {
            const content = read(file).replace(/```[\s\S]*?```/g, "");
            for (const match of content.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
                const link = match[1].split("#")[0];
                if (!link || /^(?:[a-z]+:|\/|\{)/i.test(link)) continue;
                if (!existsSync(resolve(dirname(file), decodeURIComponent(link)))) failures.push(`${file}: ${link}`);
            }
        }
        expect(failures).toEqual([]);
    });

    it("derives public component counts from the canonical catalog", () => {
        expect(catalog.componentCount).toBe(componentDefinitions.length);
        expect(catalog.components.length).toBe(componentDefinitions.length);
        for (const file of docs) {
            const content = read(file);
            for (const count of content.replace(/(?:previous|earlier) \d+-component/g, "historical inventory").matchAll(/\b(\d+) (?:governed |supported )?component (?:types|library)|\b(\d+)-component/g)) expect(Number(count[1] ?? count[2]), file).toBe(componentDefinitions.length);
        }
    });

    it("publishes executable API responses with the canonical contract", () => {
        for (const file of readdirSync("examples/remote-fragments").filter(file => file.endsWith(".json"))) expect(prepareRemoteFragment(JSON.parse(read(`examples/remote-fragments/${file}`)), "example").schema.components.length).toBeGreaterThan(0);
    });

    it("does not contradict current source host and popup support", () => {
        const content = docs.map(read).join("\n");
        expect(content).not.toMatch(/(?:only `miniup\.function` is portable|`rest\.get` \(web only\)|direct `miniup\.table` and `rest\.get` are web-only|default is `https:\/\/\*\.miniup\.app`)/i);
        expect(content).not.toMatch(/"popup"\s*:\s*\{\s*"enabled"/);
        const guide = read("docs/remote-fragments.md");
        for (const host of ["https://miniup.app", "https://*.miniup.app", "https://miniup.io", "https://*.miniup.io"]) expect(guide).toContain(host);
        expect(guide).toContain("does not override CORS");
    });
});
