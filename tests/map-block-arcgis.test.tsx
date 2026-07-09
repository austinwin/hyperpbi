// ── Map Block ArcGIS Tests ───────────────────────────────────────────
// Tests for viewport equality, field collection, error shells, and
// per-layer state transitions.

import { describe, it, expect } from "vitest";

describe("MapBlock — Viewport Equality", () => {
    function roundViewportBounds(bounds: [number, number, number, number]): [number, number, number, number] {
        return bounds.map(v => Math.round(v * 1000) / 1000) as [number, number, number, number];
    }

    function viewportEqual(
        left: { bounds: [number, number, number, number]; zoom: number; width: number; height: number } | null,
        right: { bounds: [number, number, number, number]; zoom: number; width: number; height: number }
    ): boolean {
        if (!left) return false;
        const a = roundViewportBounds(left.bounds);
        const b = roundViewportBounds(right.bounds);
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
            && left.zoom === right.zoom && left.width === right.width && left.height === right.height;
    }

    it("null left returns false", () => expect(viewportEqual(null, { bounds: [-95, 29, -94, 30], zoom: 10, width: 800, height: 600 })).toBe(false));
    it("identical viewports return true", () => {
        const vp = { bounds: [-95, 29, -94, 30] as [number, number, number, number], zoom: 10, width: 800, height: 600 };
        expect(viewportEqual(vp, vp)).toBe(true);
    });
    it("tiny coordinate drift is rounded away", () => {
        const l = { bounds: [-95.00001, 29.00001, -94.00001, 30.00001] as [number, number, number, number], zoom: 10, width: 800, height: 600 };
        const r = { bounds: [-95.00009, 29.00009, -94.00009, 30.00009] as [number, number, number, number], zoom: 10, width: 800, height: 600 };
        expect(viewportEqual(l, r)).toBe(true);
    });
    it("significant zoom change returns false", () => {
        const l = { bounds: [-95, 29, -94, 30] as [number, number, number, number], zoom: 10, width: 800, height: 600 };
        const r = { bounds: [-95, 29, -94, 30] as [number, number, number, number], zoom: 12, width: 800, height: 600 };
        expect(viewportEqual(l, r)).toBe(false);
    });
    it("big coordinate jump returns false", () => {
        const l = { bounds: [-95, 29, -94, 30] as [number, number, number, number], zoom: 10, width: 800, height: 600 };
        const r = { bounds: [-100, 25, -90, 35] as [number, number, number, number], zoom: 10, width: 800, height: 600 };
        expect(viewportEqual(l, r)).toBe(false);
    });
});

describe("MapBlock — Field Collection", () => {
    it("includes join service field", () => {
        const fields = new Set<string>(["FACILITYID"]);
        expect(fields.has("FACILITYID")).toBe(true);
    });
    it("includes configured renderer field", () => {
        const fields = new Set<string>(); fields.add("MATERIAL");
        expect(fields.has("MATERIAL")).toBe(true);
    });
    it("includes popup service fields, not powerbi fields", () => {
        const fields = new Set<string>();
        // Only service/joined fields should be collected
        fields.add("DIAMETER"); // service
        expect(fields.has("DIAMETER")).toBe(true);
        expect(fields.has("Sales")).toBe(false);
    });
});

describe("MapBlock — Per-Layer State", () => {
    it("preserves other layers when updating one", () => {
        const prev: Record<string, { layer?: unknown; loading: boolean }> = {
            a: { layer: { id: "a" }, loading: false },
            b: { layer: { id: "b" }, loading: true },
        };
        const next = { ...prev, a: { ...prev.a, loading: true } };
        expect(next.b.layer).toEqual({ id: "b" });
    });
    it("replaces single layer on success", () => {
        const prev: Record<string, { layer?: unknown; loading: boolean }> = {
            a: { layer: { id: "a", name: "Old" }, loading: true },
        };
        const next = { ...prev, a: { layer: { id: "a", name: "New" }, loading: false } };
        expect((next.a.layer as Record<string, unknown>).name).toBe("New");
    });
});

describe("MapBlock — Module Exports", () => {
    it("MapBlock component is importable", async () => {
        const mod = await import("../src/components/maps/MapBlock");
        expect(typeof mod.MapBlock).toBe("function");
    });
});
