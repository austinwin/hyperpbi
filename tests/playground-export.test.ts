import { describe, expect, it } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { canonicalJson } from "../src/playground/canonicalJson";
import { createPlaygroundProject } from "../src/playground/project";
import { exportProjectBundle, importProjectBundle } from "../src/playground/projectBundle";

describe("Playground exports", () => {
    it("exports canonical specification and runtime configuration JSON", () => {
        const project = createPlaygroundProject("Exported");
        expect(JSON.parse(canonicalJson(project.specification)).version).toBe("2.0");
        expect(JSON.parse(canonicalJson(project.runtimeConfiguration)).version).toBe("1.0");
        expect(canonicalJson({ z: 1, a: 2 }).indexOf('"a"')).toBeLessThan(canonicalJson({ z: 1, a: 2 }).indexOf('"z"'));
    });

    it("round-trips a complete project as a new local project", () => {
        const project = createPlaygroundProject("Portable");
        const source = parseCsvText("Name,Amount\nA,1", "portable.csv");
        project.dataWorkspace = { defaultSourceId: source.id, sources: { [source.id]: source } };
        const imported = importProjectBundle(exportProjectBundle(project));
        expect(imported.errors).toEqual([]);
        expect(imported.project?.metadata.id).not.toBe(project.metadata.id);
        expect(imported.project?.dataWorkspace.sources[source.id].data.rows).toEqual(source.data.rows);
    });

    it("rejects invalid and unsupported project bundles", () => {
        expect(importProjectBundle("not json").project).toBeUndefined();
        expect(importProjectBundle('{"format":"wrong","formatVersion":99}').errors.length).toBeGreaterThan(0);
    });
});
