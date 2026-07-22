import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");

function productionDependencyGraph(entry: string): Set<string> {
  const files = new Set<string>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    const source = readFileSync(file, "utf8");
    const imports = source.matchAll(/(?:import|export)\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g);
    for (const match of imports) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;
      const base = resolve(dirname(file), specifier);
      const dependency = [base, `${base}.ts`, `${base}.tsx`, resolve(base, "index.ts"), resolve(base, "index.tsx")].find(existsSync);
      if (dependency?.startsWith(sourceRoot)) visit(dependency);
    }
  };
  visit(entry);
  return files;
}

describe("production schema migration boundary", () => {
  it("keeps migration-only code outside the dependency graph rooted at visual.ts", () => {
    const graph = productionDependencyGraph(resolve(sourceRoot, "visual.ts"));
    const combined = [...graph].map((file) => `${file}\n${readFileSync(file, "utf8")}`).join("\n");
    expect(combined).not.toContain("schemaMigrations");
    expect(combined).not.toContain("migrateFieldReferences");
    expect(combined).not.toContain("migrate-schema-v1-to-v2");
    expect([...graph].some((file) => file.includes(`${resolve(process.cwd(), "scripts")}`))).toBe(false);
    expect(existsSync(resolve(sourceRoot, "schema/schemaMigrations.ts"))).toBe(false);
    expect(existsSync(resolve(sourceRoot, "schema/migrateFieldReferences.ts"))).toBe(false);
  });
});
