import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateSchema } from "../src/schema/validateSchema";

const temporaryDirectories: string[] = [];
const script = resolve(process.cwd(), "scripts/migrate-schema-v1-to-v2.mjs");
const fixture = resolve(process.cwd(), "tests/fixtures/schema-migration/v1-basic.json");

function temporaryDirectory(): string {
  const directory = mkdtempSync(resolve(tmpdir(), "hyperpbi-schema-migration-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("standalone schema migration utility", () => {
  it("converts an isolated schema 1.0 fixture into strict canonical schema 2.0", () => {
    const output = resolve(temporaryDirectory(), "converted.json");
    execFileSync(process.execPath, [script, fixture, output], { encoding: "utf8" });
    const converted = JSON.parse(readFileSync(output, "utf8"));
    expect(converted.version).toBe("2.0");
    expect(validateSchema(converted).errors).toEqual([]);
    expect(converted.components[0]).toHaveProperty("uiAction.type", "clearFilters");
    expect(converted.components[1].tabs[0]).toHaveProperty("children");
    expect(converted.components[1].tabs[0]).not.toHaveProperty("components");
    expect(converted.components[2].type).toBe("offcanvas");
    expect(converted.components[3]).not.toHaveProperty("selectable");
  });

  it("fails actionably and never overwrites its input without explicit permission", () => {
    const directory = temporaryDirectory();
    const input = resolve(directory, "unsupported.json");
    writeFileSync(input, JSON.stringify({ version: "1.0", components: [{ type: "button", id: "unsafe", action: "runCode" }] }));
    const samePath = spawnSync(process.execPath, [script, input, input], { encoding: "utf8" });
    expect(samePath.status).not.toBe(0);
    expect(samePath.stderr).toContain("Refusing to overwrite the input file");
    expect(JSON.parse(readFileSync(input, "utf8")).version).toBe("1.0");

    const output = resolve(directory, "output.json");
    const unsupported = spawnSync(process.execPath, [script, input, output], { encoding: "utf8" });
    expect(unsupported.status).not.toBe(0);
    expect(unsupported.stderr).toContain('unsupported legacy button action "runCode"');
  });
});
