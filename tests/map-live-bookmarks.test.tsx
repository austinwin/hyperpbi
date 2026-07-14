import { render } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { MapStudio } from "../src/editor/map-studio/MapStudio";
import { mapStudioData, mapStudioSpecification, button } from "./map-studio-fixture";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";

function mount(live = true) {
    const host = document.createElement("div"); let latest = mapStudioSpecification;
    function Harness() { const [json, setJson] = useState(mapStudioSpecification); return <MapStudio json={json} data={mapStudioData} configurationJson={defaultConfigJson} selectedComponentId="operations" liveViewport={live ? { bounds: [-97, 28, -93, 32], center: [30.5, -94.5], zoom: 11, width: 800, height: 600 } : undefined} onChange={next => { latest = next; setJson(next); }} />; }
    act(() => render(<Harness />, host)); act(() => button(host, "Basemap & view").click()); return { host, json: () => latest };
}

describe("live viewport bookmarks", () => {
    it("captures the actual preview center and zoom only when requested", () => {
        const mounted = mount(); const before = mounted.json(); expect(mounted.host.textContent).toContain("Capturing live preview view"); expect(mounted.json()).toBe(before);
        act(() => button(mounted.host, "Add current view").click());
        expect(JSON.parse(mounted.json()).components[0].bookmarks[0]).toMatchObject({ center: [30.5, -94.5], zoom: 11 });
    });
    it("labels the authored fallback honestly", () => { const mounted = mount(false); expect(mounted.host.textContent).toContain("No live preview available; using authored view"); });
});
