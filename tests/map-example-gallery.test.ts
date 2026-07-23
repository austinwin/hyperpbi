import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateV2Schema } from "../src/schema/validateV2Schema";

interface ManifestEntry {
  id: string;
  group: string;
  spec: string;
  data: string;
  expected: string;
  limitations: string;
}

describe("dedicated map example gallery", () => {
  const root = resolve(process.cwd(), "examples/map");
  const manifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf8")) as { examples: ManifestEntry[] };

  it("indexes every focused group with runnable files and explanatory metadata", () => {
    expect(manifest.examples).toHaveLength(29);
    expect(new Set(manifest.examples.map((entry) => entry.group)).size).toBe(29);
    expect(new Set(manifest.examples.map((entry) => entry.id)).size).toBe(29);
    for (const entry of manifest.examples) {
      expect(existsSync(resolve(root, entry.spec)), entry.spec).toBe(true);
      expect(existsSync(resolve(root, entry.data)), entry.data).toBe(true);
      expect(entry.expected.length).toBeGreaterThan(20);
      expect(entry.limitations.length).toBeGreaterThan(10);
    }
  });

  it("keeps every copyable gallery specification aligned with strict schema 2.0", () => {
    const failures: string[] = [];
    for (const entry of manifest.examples) {
      let specification: unknown;
      try {
        specification = JSON.parse(readFileSync(resolve(root, entry.spec), "utf8"));
      } catch (error) {
        failures.push(`${entry.spec} invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      const validation = validateV2Schema(specification);
      for (const item of validation.diagnostics.filter((diagnostic) => diagnostic.severity === "error"))
        failures.push(`${entry.spec} ${item.path} ${item.code}`);
    }
    expect(failures).toEqual([]);
  });

  it("wires the dedicated route and automatic manifest loading", () => {
    const route = readFileSync(resolve(process.cwd(), "apps/playground/src/router.ts"), "utf8");
    const page = readFileSync(resolve(process.cwd(), "apps/playground/src/components/MapGalleryPage.tsx"), "utf8");
    expect(route).toContain("mapGallery");
    expect(route).toContain("components");
    expect(page).toContain("import.meta.glob");
    expect(page).toContain("Copy spec");
    expect(page).toContain("Power BI behavior");
  });
});
