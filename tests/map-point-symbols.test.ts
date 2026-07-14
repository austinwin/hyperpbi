import * as L from "leaflet";
import { describe, expect, it } from "vitest";
import { createLeafletPointLayer, safePointSvg } from "../src/components/maps/createLeafletPointLayer";
import type { LeafletFeatureStyle } from "../src/maps/renderers/mapFeatureSymbol";

const base: LeafletFeatureStyle = { shape: "circle", color: "#123456", fillColor: "#abcdef", fillOpacity: 0.8, opacity: 0.6, weight: 2, radius: 7 };

describe("safe Leaflet point symbols", () => {
    it("uses circleMarker only for circles", () => {
        expect(createLeafletPointLayer([1, 2], base, "points", 0.5)).toBeInstanceOf(L.CircleMarker);
        for (const shape of ["square", "diamond", "triangle"] as const) expect(createLeafletPointLayer([1, 2], { ...base, shape }, "points", 0.5)).toBeInstanceOf(L.Marker);
    });
    it.each(["square", "diamond", "triangle"] as const)("generates controlled %s SVG with bounded style", shape => {
        const svg = safePointSvg(shape, { ...base, shape }, 0.5);
        expect(svg).toContain("<polygon"); expect(svg).toContain('fill="#abcdef"'); expect(svg).toContain('fill-opacity="0.4"'); expect(svg).toContain('stroke-opacity="0.3"');
        expect(svg).not.toMatch(/<script|onload=|javascript:/i);
    });
    it("escapes unsafe author color text", () => {
        expect(safePointSvg("square", { ...base, fillColor: `red" onload="alert(1)` }, 1)).not.toContain('onload="alert');
    });
});
