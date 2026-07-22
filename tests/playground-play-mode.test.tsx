import { act } from "preact/test-utils";
import { render } from "preact";
import { describe, expect, it } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { createPlaygroundProject } from "../src/playground/project";
import { createDefaultSchema } from "../src/schema/defaultSchema";
import { PlaygroundRenderer } from "../apps/playground/src/components/PlaygroundRenderer";

describe("Playground Play Mode", () => {
    it("renders the shared HyperPbiRoot with local project data", () => {
        const project = createPlaygroundProject("Playable");
        const source = parseCsvText("Status,Amount\nOpen,10\nClosed,20", "play.csv");
        project.dataWorkspace = { defaultSourceId: source.id, sources: { [source.id]: source } };
        project.specification = createDefaultSchema(source.data);
        const host = document.createElement("div");
        document.body.append(host);
        act(() => render(<PlaygroundRenderer project={project} />, host));
        expect(host.querySelector(".hyperpbi-root")).not.toBeNull();
        expect(host.textContent).toContain("Record Details");
        expect(host.textContent).toContain("Open");
        act(() => render(null, host));
        host.remove();
    });
});
