import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { SplitLayout } from "../src/components/layout/SplitLayout";
import {
    componentSubtreeRequestsFill,
    responsiveComponentStyle,
} from "../src/components/layout/responsiveLayout";
import {
    normalizePaneSizes,
    resizeAdjacentPanes,
    validPersistedPaneSizes,
} from "../src/components/layout/splitPaneSizing";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import type { ContainerComponent, DashboardComponent } from "../src/schema/hyperpbiSchema";

afterEach(() => {
    sessionStorage.clear();
    document.body.replaceChildren();
});

describe("application layout contracts", () => {
    it("resolves mobile-first spans, order, visibility, and stacked split behavior", () => {
        const style = responsiveComponentStyle({
            type: "split",
            span: 7,
            order: 4,
            direction: "row",
            responsive: {
                sm: { visible: false, order: 2 },
                md: { visible: true, span: 9 },
                xl: { stack: true },
            },
        } as ContainerComponent);
        expect(style).toMatchObject({
            "--hp-span-xs": 12,
            "--hp-span-md": 9,
            "--hp-span-lg": 7,
            "--hp-order-sm": 2,
            "--hp-display-sm": "none",
            "--hp-display-md": "block",
            "--hp-layout-direction-xs": "column",
            "--hp-layout-direction-md": "row",
            "--hp-split-handle-display-md": "flex",
            "--hp-split-handle-display-xl": "none",
            "--hp-split-child-height-xl": "auto",
        });
        const explicitLayout = responsiveComponentStyle({
            type: "grid",
            columns: 4,
            responsive: { xs: { columns: 2, direction: "row" } },
        } as ContainerComponent);
        expect(explicitLayout).toMatchObject({
            "--hp-layout-columns-xs": 2,
            "--hp-layout-direction-xs": "row",
        });
    });

    it("propagates fill sizing through tabs and nested containers", () => {
        const component = {
            type: "tabs",
            id: "tabs",
            tabs: [{ id: "map", title: "Map", children: [{ type: "section", id: "section", children: [{ type: "map", id: "map", heightMode: "fill", layers: [] }] }] }],
        } as DashboardComponent;
        expect(componentSubtreeRequestsFill(component)).toBe(true);
        expect(componentSubtreeRequestsFill({ type: "text", id: "text", text: "Ready" })).toBe(false);
    });

    it("normalizes, constrains, and validates persisted pane sizes", () => {
        expect(normalizePaneSizes([1, 3], 2)).toEqual([25, 75]);
        expect(normalizePaneSizes([1, 99], 2)).toEqual([5, 95]);
        expect(normalizePaneSizes([0, 2], 2)).toEqual([50, 50]);
        expect(normalizePaneSizes([5, 95], 2, [20, 20], [60, 80])).toEqual([20, 80]);
        expect(resizeAdjacentPanes([30, 70], 0, 50, [20, 30], [60, 80])).toEqual([60, 40]);
        expect(resizeAdjacentPanes([30, 30, 40], 1, -50, [5, 10, 20])).toEqual([30, 10, 60]);
        expect(validPersistedPaneSizes([2, 6], 2)).toEqual([25, 75]);
        expect(validPersistedPaneSizes([2, 0], 2)).toBeUndefined();
    });

    it("supports keyboard resizing, reset, and per-instance persistence", () => {
        const host = document.createElement("div");
        const context = { instanceId: "layout-test" } as RenderContextValue;
        const component: ContainerComponent = {
            type: "split",
            id: "workspace",
            title: "Workspace",
            direction: "row",
            resizable: true,
            persist: "session",
            sizes: [30, 70],
            minSizes: [20, 20],
            children: [{ type: "text", id: "left" }, { type: "text", id: "right" }],
        };
        const renderChildren = (children: DashboardComponent[]) => children.map(child => <div data-child={child.id} />);
        act(() => render(
            <RenderContext.Provider value={context}>
                <SplitLayout component={component} renderChildren={renderChildren} />
            </RenderContext.Provider>,
            host,
        ));
        const handle = host.querySelector<HTMLElement>('[role="separator"]')!;
        act(() => handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true })));
        const panes = host.querySelectorAll<HTMLElement>(".hp-split-pane");
        expect(panes[0].style.getPropertyValue("--hp-pane-size")).toBe("35");
        expect(panes[1].style.getPropertyValue("--hp-pane-size")).toBe("65");
        expect(JSON.parse(sessionStorage.getItem("hyperpbi:layout-test:split:workspace")!)).toEqual([35, 65]);
        act(() => handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
        expect(panes[0].style.getPropertyValue("--hp-pane-size")).toBe("30");
        act(() => render(null, host));
    });
});
