import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { createPlaygroundProject } from "../src/playground/project";
import { IndexedDbProjectStorage } from "../src/playground/projectStorage";

describe("IndexedDB project storage", () => {
    it("saves and restores complete normalized projects", async () => {
        const storage = new IndexedDbProjectStorage({ databaseName: "hyperpbi-test", indexedDb: new IDBFactory() });
        const project = createPlaygroundProject("Stored project");
        const source = parseCsvText("ID,Value\n001,12", "stored.csv");
        project.dataWorkspace = { defaultSourceId: source.id, sources: { [source.id]: source } };
        await storage.saveProject(project);
        const restored = await storage.getProject(project.metadata.id);
        expect(restored?.metadata.name).toBe("Stored project");
        expect(restored?.dataWorkspace.sources[source.id].data.rows[0]).toEqual({ id: "001", value: 12 });
        expect(restored?.dataWorkspace.sources[source.id].data.rowKeys).toEqual(source.data.rowKeys);
        expect(await storage.listProjects()).toHaveLength(1);
        await storage.deleteProject(project.metadata.id);
        expect(await storage.listProjects()).toEqual([]);
    });
});
