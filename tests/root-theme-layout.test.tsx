import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData } from "../src/data/normalizeData";
import { HyperPbiRoot } from "../src/render/HyperPbiRoot";
import type { HyperPbiSchema } from "../src/schema/hyperpbiSchema";
import { createRuntimeSettings } from "../src/runtime/runtimeSettings";
import { resolveSchemaRuntimeSettings } from "../src/styles/tokens";

const rows = [{ category: "A", amount: 10 }];
const fields: NormalizedData["fields"] = {
    category: { key: "category", displayName: "Category", type: "dimension", roles: ["values"] },
    amount: { key: "amount", displayName: "Amount", type: "measure", roles: ["values"] },
};
const data: NormalizedData = {
    rows,
    rowKeys: ["row-0"],
    fields,
    aggregates: calculateAggregates(rows),
    map: normalizeMapBindings(rows, fields),
};

class ContainerResizeObserver {
    static instances: ContainerResizeObserver[] = [];
    private target?: Element;

    constructor(private readonly callback: ResizeObserverCallback) {
        ContainerResizeObserver.instances.push(this);
    }

    observe(target: Element): void {
        this.target = target;
    }

    unobserve(): void {}
    disconnect(): void {}

    emit(width: number): void {
        if (!this.target) throw new Error("ResizeObserver target is unavailable.");
        this.callback(
            [{ target: this.target, contentRect: { width } } as unknown as ResizeObserverEntry],
            this as unknown as ResizeObserver,
        );
    }
}

function mount(schema: HyperPbiSchema): HTMLDivElement {
    const host = document.createElement("div");
    document.body.append(host);
    act(() => render(
        <HyperPbiRoot
            instanceId={`root-layout-${document.body.children.length}`}
            schema={schema}
            data={data}
            settings={createRuntimeSettings()}
            renderMs={0}
        />,
        host,
    ));
    return host;
}

afterEach(() => {
    document.body.replaceChildren();
    ContainerResizeObserver.instances.length = 0;
    vi.unstubAllGlobals();
});

describe("root theme and layout contracts", () => {
    it("resolves schema theme values into the settings consumed by canvas renderers", () => {
        const settings = createRuntimeSettings({
            theme: { primary: "#111111", surface: "#ffffff", text: "#222222" },
        });
        const resolved = resolveSchemaRuntimeSettings({
            mode: "dark",
            density: "spacious",
            primaryColor: "#7c3aed",
            accentColor: "#22d3ee",
            surfaceColor: "#0b1020",
            textColor: "#f8fafc",
            borderColor: "#334155",
            gap: 18,
            cardPadding: 20,
        }, settings);

        expect(resolved.theme).toMatchObject({
            mode: "dark",
            primary: "#7c3aed",
            accent: "#22d3ee",
            surface: "#0b1020",
            text: "#f8fafc",
            border: "#334155",
        });
        expect(resolved.layout).toMatchObject({ density: "spacious", gap: 18, cardPadding: 20 });
        expect(settings.theme.primary).toBe("#111111");

        expect(resolveSchemaRuntimeSettings({ mode: "dark" }, settings).theme).toMatchObject({
            mode: "dark",
            surface: "#182433",
            text: "#f1f5f9",
            border: "#334155",
        });
    });

    it("uses observed app-container width for mobile navbar and sidebar behavior", () => {
        vi.stubGlobal("ResizeObserver", ContainerResizeObserver);
        const host = mount({
            version: "2.0",
            app: {
                enabled: true,
                navbar: { showSidebarToggle: true },
                sidebar: {
                    mobileBreakpoint: 700,
                    navigation: [{ id: "home", label: "Home" }],
                },
            },
            components: [{ type: "text", id: "main", text: "Main" }],
        });
        const observer = ContainerResizeObserver.instances[0];
        expect(observer).toBeDefined();

        act(() => observer.emit(600));
        expect(host.querySelector(".hp-app-shell")?.classList).toContain("hp-app-mobile");
        expect(host.querySelector(".hp-sidebar-app")?.classList).toContain("hp-sidebar-mobile");

        act(() => (host.querySelector(".hp-navbar-toggle") as HTMLButtonElement).click());
        expect(host.querySelector(".hp-sidebar-app")?.classList).toContain("hp-sidebar-mobile-open");

        act(() => observer.emit(900));
        expect(host.querySelector(".hp-app-shell")?.classList).not.toContain("hp-app-mobile");
        expect(host.querySelector(".hp-sidebar-app")?.classList).not.toContain("hp-sidebar-mobile");
        expect(host.querySelector(".hp-sidebar-app")?.classList).not.toContain("hp-sidebar-mobile-open");

        act(() => (host.querySelector(".hp-navbar-toggle") as HTMLButtonElement).click());
        expect(host.querySelector(".hp-sidebar-app")?.classList).toContain("hp-sidebar-collapsed");
    });

    it("keeps rightPanel beside the primary dashboard in app and plain root layouts", () => {
        const base: HyperPbiSchema = {
            version: "2.0",
            components: [{ type: "text", id: "main", text: "Main" }],
            rightPanel: [{ type: "text", id: "details", text: "Details" }],
        };
        const plain = mount(base);
        const plainLayout = plain.querySelector(".hp-main > .hp-dashboard-layout.hp-with-right-panel");
        expect(plainLayout?.querySelector(":scope > .hp-dashboard-primary")).not.toBeNull();
        expect(plainLayout?.querySelector(":scope > .hp-right-panel")).not.toBeNull();

        const app = mount({
            ...base,
            app: { enabled: true },
        });
        const appLayout = app.querySelector(".hp-app-main > .hp-dashboard-layout.hp-with-right-panel");
        expect(appLayout?.querySelector(":scope > .hp-dashboard-primary")).not.toBeNull();
        expect(appLayout?.querySelector(":scope > .hp-right-panel")).not.toBeNull();

        const css = readFileSync(resolve(process.cwd(), "src/styles/hyperpbi.css"), "utf8");
        expect(css).toContain("@container (min-width: 900px)");
        expect(css).toMatch(/\.hp-dashboard-layout\.hp-with-right-panel\s*\{\s*grid-template-columns:/);
    });
});
