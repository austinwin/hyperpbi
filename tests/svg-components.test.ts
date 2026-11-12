import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { aggregateSvgRow, compileSvgPosition, renderSvgTemplate, resolveSvgValue } from "../src/components/svg/svgBindings";
import { compileSvgAnimation, svgAnimationPresets } from "../src/components/svg/svgAnimationCompiler";
import { createSvgIdMap, createSvgNamespace, rewriteSvgLocalReference } from "../src/components/svg/svgIdIsolation";
import type { SvgElementDefinition } from "../src/components/svg/svgTypes";
import { resolveSvgScale } from "../src/components/svg/svgScales";
import { validateV2Schema } from "../src/schema/validateV2Schema";
import { initialDashboardState } from "../src/render/stateStore";
import { sanitizeCss } from "../src/security/sanitizeCss";
import { resolveSvgMarkupTemplates, sanitizeSvg } from "../src/security/sanitizeSvg";
import { parseCsvText } from "../src/data/fileImport";
import { prepareSpecification } from "../src/schema/prepareSpecification";
import { compileSvgImage } from "../src/security/compileSvgImage";

const elements: SvgElementDefinition[] = [{ type: "defs", children: [{ type: "linearGradient", id: "gradient", children: [{ type: "stop", offset: "0%", stopColor: "#fff" }] }] }, { type: "rect", id: "mark", x: 0, y: 0, width: 20, height: 20, fill: "url(#gradient)" }];
const state = initialDashboardState();

describe("declarative SVG schema", () => {
    it("keeps all five canonical SVG specifications schema-valid", () => { for (const file of ["svg-progress-card.json", "svg-flowing-pipeline.json", "svg-process-flow.json", "svg-pictorial-status.json", "svg-raw-sanitized-example.json"]) { const result = validateV2Schema(JSON.parse(readFileSync(resolve("examples/specs", file), "utf8"))); expect(result.diagnostics.filter(item => item.severity === "error"), file).toEqual([]); } });
    it("accepts strict data-bound SVG", () => { const result = validateV2Schema({ version: "2.0", components: [{ type: "svg", id: "progress", viewBox: "0 0 800 200", ariaLabel: "Progress", elements: [{ type: "rect", id: "bar", x: 0, y: 0, width: { bind: "completion", scale: { domain: [0, 100], range: [0, 800], clamp: true } }, height: 20, animation: { preset: "progress-fill", durationMs: 1000 } }] }] }); expect(result.valid).toBe(true); });
    it.each([
        { type: "svg", id: "diagram", viewBox: "0 0 100 50", elements: [] },
        { type: "svgMarkup", id: "drawing", svg: '<svg viewBox="0 0 100 50"><rect width="100" height="50"/></svg>' },
    ])("validates panZoom as an optional boolean on $type", component => {
        const validate = (panZoom?: unknown) => validateV2Schema({ version: "2.0", components: [{ ...component, panZoom }] });
        for (const panZoom of [undefined, false, true]) expect(validate(panZoom).valid).toBe(true);
        expect(validate("true").diagnostics).toContainEqual(expect.objectContaining({
            code: "INVALID_PROPERTY_TYPE", path: "/components/0/panZoom",
        }));
    });
    it("rejects unknown elements, properties, animation, duplicate IDs, and references", () => { const result = validateV2Schema({ version: "2.0", components: [{ type: "svg", id: "badSvg", viewBox: "0 0 10 10", elements: [{ type: "script", id: "x" }, { type: "rect", id: "same", evil: true }, { type: "circle", id: "same", fill: "url(#missing)", animation: { preset: "teleport", durationMs: 20 } }] }] }); const codes = result.diagnostics.map(item => item.code); expect(codes).toContain("SVG_UNKNOWN_ELEMENT"); expect(codes).toContain("SVG_UNKNOWN_ATTRIBUTE"); expect(codes).toContain("SVG_DUPLICATE_ID"); expect(codes).toContain("SVG_UNKNOWN_LOCAL_REFERENCE"); expect(codes).toContain("SVG_INVALID_ANIMATION_PRESET"); expect(codes).toContain("SVG_INVALID_ANIMATION_DURATION"); });
    it("rejects invalid viewBox, unsafe keyframes, unbounded repeats, and infinite policy", () => { const result = validateV2Schema({ version: "2.0", components: [{ type: "svg", id: "badMotion", viewBox: "0 0 -1 10", elements: [{ type: "g", repeat: { limit: 999, children: [{ type: "circle", animation: { preset: "fade-in", iterationCount: "infinite", keyframes: [{ offset: 0, display: "none" }] } }] } }] }] }); const codes = result.diagnostics.map(item => item.code); expect(codes).toContain("SVG_INVALID_VIEWBOX"); expect(codes).toContain("SVG_REPEAT_LIMIT"); expect(codes).toContain("SVG_INFINITE_ANIMATION_POLICY"); expect(codes).toContain("SVG_UNSAFE_KEYFRAME_PROPERTY"); });
    it("accounts for worst-case repeated nodes and animations in performance limits", () => { const result = validateV2Schema({ version: "2.0", components: [{ type: "svg", id: "heavyRepeat", viewBox: "0 0 10 10", elements: [{ type: "g", repeat: { limit: 250, keyField: "id", children: [{ type: "circle", animation: { preset: "pulse" } }, { type: "rect" }, { type: "line" }] } }] }] }); const codes = result.diagnostics.map(item => item.code); expect(codes).toContain("SVG_ELEMENT_LIMIT"); expect(codes).toContain("SVG_ANIMATION_LIMIT"); });
});

describe("SVG bindings and scales", () => {
    const context = { row: { completion: 75, status: "Watch", assetId: "A-1" }, rows: [{ completion: 0 }, { completion: 100 }], state: { ...state, values: { selectedAsset: "A-1" } }, index: 2, count: 5, warnings: [] as string[] };
    it("resolves literals, fields, templates, maps, conditions, and state", () => { expect(resolveSvgValue(12, context)).toBe(12); expect(resolveSvgValue({ bind: "completion" }, context)).toBe(75); expect(renderSvgTemplate("{{completion}}% {{assetId}}", context)).toBe("75% A-1"); expect(resolveSvgValue({ bind: "status", map: { Watch: "orange" }, fallback: "gray" }, context)).toBe("orange"); expect(resolveSvgValue({ when: { field: "status", operator: "=", value: "Watch" }, then: false, else: true }, context)).toBe(false); expect(resolveSvgValue({ state: "selectedAsset", equals: { template: "{{assetId}}" }, then: 1, else: .4 }, context)).toBe(1); });
    it("supports linear, clamped, ordinal, threshold, and automatic scales", () => { expect(resolveSvgScale(50, { domain: [0, 100], range: [0, 720] })).toBe(360); expect(resolveSvgScale(150, { domain: [0, 100], range: [0, 720], clamp: true })).toBe(720); expect(resolveSvgScale("Watch", { type: "ordinal", domain: ["Good", "Watch"], range: ["green", "orange"] })).toBe("orange"); expect(resolveSvgScale(8, { type: "threshold", domain: [5, 10], range: ["low", "mid", "high"] })).toBe("mid"); expect(resolveSvgScale(50, { domain: "auto", range: [0, 10] }, [0, 100])).toBe(5); });
    it("compiles safe positions and aggregate context", () => { expect(compileSvgPosition({ x: { bind: "completion" }, y: 10, rotate: 5, scale: 2 }, context)).toBe("translate(75 10) rotate(5) scale(2)"); expect(aggregateSvgRow([{ amount: 2, status: "Open" }, { amount: 3, status: "Closed" }])).toEqual({ amount: 5, status: "Open" }); });
});

describe("SVG isolation and animation", () => {
    it("isolates identical local IDs between component instances", () => { const first = createSvgIdMap(elements, createSvgNamespace("visual8", "one")), second = createSvgIdMap(elements, createSvgNamespace("visual8", "two")); expect(first.get("gradient")).not.toBe(second.get("gradient")); expect(rewriteSvgLocalReference("url(#gradient)", first)).toBe(`url(#${first.get("gradient")})`); expect(() => rewriteSvgLocalReference("url(https://bad.test/x)", first)).toThrow(); });
    it("compiles every preset and explicit safe keyframes to scoped CSS", () => { for (const preset of Object.keys(svgAnimationPresets) as Array<keyof typeof svgAnimationPresets>) { const element = ["draw-path", "flow-dash"].includes(preset) ? "path" : preset === "progress-fill" ? "rect" : "g"; const result = compileSvgAnimation({ preset }, element, "hp-v-c", "mark", false); expect(result.css).toContain("hp-v-c"); } const explicit = compileSvgAnimation({ durationMs: 1000, keyframes: [{ offset: 0, opacity: .5 }, { offset: 1, opacity: 1 }] }, "circle", "hp-v-c", "dot", false); expect(explicit.css).toContain("opacity:0.5"); });
    it("reduces animation to a meaningful static state", () => { const result = compileSvgAnimation({ preset: "rotate", iterationCount: "infinite" }, "g", "hp-v-c", "spinner", true); expect(result.css).toContain("animation:none"); });
});

describe("raw SVG and CSS security", () => {
    it("treats XML serialization differences as normal", () => {
        expect(sanitizeSvg('<svg><rect width="10" height="10"/></svg>', "hp-safe").warnings).toEqual([]);
    });
    it.each([
        ["script", `<svg><script>alert(1)</script><rect width="10" height="10"/></svg>`],
        ["event", `<svg><rect onclick="alert(1)" width="10" height="10"/></svg>`],
        ["foreignObject", `<svg><foreignObject><div>bad</div></foreignObject></svg>`],
        ["external image", `<svg><image href="https://bad.test/x.png"/></svg>`],
        ["external use", `<svg><use href="https://bad.test/x.svg#x"/></svg>`],
        ["xlink", `<svg><use xlink:href="https://bad.test/x.svg#x"/></svg>`],
        ["iframe", `<svg><iframe src="https://bad.test"></iframe></svg>`],
        ["object", `<svg><object data="https://bad.test"></object></svg>`],
        ["embed", `<svg><embed src="https://bad.test"/></svg>`],
        ["mixed case", `<svg><ScRiPt>alert(1)</ScRiPt></svg>`],
    ])("blocks %s", (_name, markup) => { const result = sanitizeSvg(markup, "hp-safe"); expect(result.svg).not.toMatch(/script|onclick|foreignObject|<image|<use|xlink|iframe|object|embed|https:\/\//i); });
    it("rewrites local IDs and references but rejects external filters", () => { const result = sanitizeSvg(`<svg><defs><linearGradient id="gradient"><stop offset="0%" stop-color="#fff"/></linearGradient></defs><rect id="mark" fill="url(#gradient)" filter="url(https://bad.test/f)"/></svg>`, "hp-safe"); expect(result.svg).toContain("hp-safe-gradient"); expect(result.svg).toContain("url(#hp-safe-gradient)"); expect(result.svg).not.toContain("bad.test"); });
    it("scopes keyframes without treating percentages as selectors", () => { const result = sanitizeCss(`@keyframes fade { 0% { opacity: 0 } 100% { opacity: 1 } } .mark { animation: fade 500ms ease 0ms 1 both; fill: #fff; }`, "#scope", { keyframeNamespace: "hp-svg" }); expect(result.css).toContain("@keyframes hp-svg-fade"); expect(result.css).toContain("0%"); expect(result.css).not.toContain("#scope 0%"); expect(result.css).toContain("animation:hp-svg-fade"); });
    it("escapes raw field templates and forbids structural or path injection", () => { const context = { row: { status: `\"><script>bad()</script>`, tag: "script", path: "M0 0" }, rows: [], state, warnings: [] }; expect(resolveSvgMarkupTemplates(`<svg><text>{{status}}</text></svg>`, context)).toContain("&lt;script&gt;"); expect(() => resolveSvgMarkupTemplates(`<svg><{{tag}}/></svg>`, context)).toThrow(); expect(() => resolveSvgMarkupTemplates(`<svg><path d="{{path}}"/></svg>`, context)).toThrow(); });
    it("blocks CSS URLs, expressions, behavior, unsafe durations, and infinite raw animation", () => { const result = sanitizeCss(`.x{fill:url(https://bad.test);color:expression(alert(1));behavior:url(x);animation:spin 20ms linear infinite}`, "#scope", { keyframeNamespace: "hp" }); expect(result.css).not.toMatch(/url\(|expression|behavior|20ms|infinite/i); });
});

describe("data-bound svgMarkup", () => {
    const component = {
        type: "svgMarkup", id: "schematic", ariaLabel: "Facility schematic",
        svgBinding: { mode: "data", keyField: "facilityId", svgField: "svgText" },
    };
    const specification = (value: unknown) => ({ version: "2.0", components: [value] });

    it("validates the binding and resolves field aliases in its dataset", () => {
        const { data } = parseCsvText("Station ID,Schematic\nINT-01,example", "StationSchematics.csv");
        const input = specification({ ...component, dataset: "registry" });
        const prepared = prepareSpecification({
            ...input, data: { datasets: { registry: { source: "powerbi", select: ["facilityId", "svgText"] } } },
        }, data, { repair: false, aliasOverrides: { station_id: "facilityId", schematic: "svgText" } });
        expect(prepared.errors).toEqual([]);
        expect(prepared.schema?.components[0]).toMatchObject({
            svgBinding: { mode: "data", keyField: "station_id", svgField: "schematic" },
        });
        expect(validateV2Schema(specification({ ...component, svgBinding: undefined })).valid).toBe(false);
        expect(validateV2Schema(specification({ ...component, svgBinding: { ...component.svgBinding, svgField: "" } })).valid).toBe(false);
        expect(validateV2Schema(specification({ ...component, svgBinding: { ...component.svgBinding, mode: "url" } })).valid).toBe(false);
        expect(validateV2Schema(specification({ ...component, svgBinding: { ...component.svgBinding, renderMode: "image" } })).valid).toBe(true);
        expect(validateV2Schema(specification({ ...component, svgBinding: { ...component.svgBinding, renderMode: "iframe" } })).valid).toBe(false);
    });

    it("translates only bounded numeric animation and strips resource loads", () => {
        const markup = String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 20 100 40" preserveAspectRatio="none">
            <defs><linearGradient id="paint"><stop offset="0" stop-color="blue"/></linearGradient></defs>
            <rect id="mark" fill="url( '#paint' )" stroke="URL(/outside.svg)" onclick="unsafe()" data-hp-svg-motion="0">
                <animate attributeName="opacity" from="0.5" to="1" dur="2s" repeatCount="indefinite"/>
            </rect>
            <path FILL="url(/outside.svg)" stroke="u\72l(/outside.svg)" d="M10 20H40">
                <animate attributeName="opacity" values="0;1" dur="10ms"/>
                <animate attributeName="href" from="0" to="1" dur="2s"/>
                <animate attributeName="opacity" from="0" to="1" dur="2s" begin="mark.click"/>
                <animate attributeName="opacity" from="0" to="1" dur="2s" href="#mark"/>
            </path>
            <circle data-hp-svg-motion="0"/>
            <style>@import "/outside.css";</style><image href="/outside.svg"/><script>unsafe()</script>
        </svg>`;
        const result = sanitizeSvg(markup, "hp-bound", { bound: { maxElements: 500, maxAnimations: 20 }, mode: "trusted" });
        expect(result.svg).toContain('viewBox="10 20 100 40"');
        expect(result.svg).toContain('preserveAspectRatio="xMidYMid meet"');
        expect(result.svg).toContain('fill="url(#hp-bound-paint)"');
        expect(result.svg).not.toMatch(/onclick|animate|outside|<style|<image|<script|unsafe/);
        expect(result.svg.match(/data-hp-svg-motion=/g)).toHaveLength(1);
        expect(result.animatedElementCount).toBe(1);
        expect(result.motionCss).toContain("opacity:0.5");
        expect(sanitizeSvg(markup, "hp-static").motionCss).toBe("");
    });

    it("rejects invalid, empty, and oversized drawings", () => {
        const bound = { maxElements: 500, maxAnimations: 20 };
        const wrap = (content: string) => `<svg viewBox="0 0 100 50">${content}</svg>`;
        for (const markup of [
            "data:image/svg+xml;base64,example", '<svg viewBox="0 0 10 10">', wrap(""),
            wrap("<rect/>".repeat(501)), wrap("<g>".repeat(22) + "<rect/>" + "</g>".repeat(22)),
            wrap(" ".repeat(250_001)), wrap(`<path d="${"M0 0".repeat(5_001)}"/>`),
        ]) expect(sanitizeSvg(markup, "hp-bound", { bound }).svg).toBe("");
        expect(sanitizeSvg('<svg width="160px" height="90"><rect width="20" height="20"/></svg>', "hp-bound", { bound }).svg)
            .toContain('viewBox="0 0 160 90"');
    });
});

describe("SVG image compatibility", () => {
    const drawing = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="40">
        <title>Intake valve</title>
        <style>.steel{fill:#246;animation: pulse 2s infinite}@keyframes pulse{to{opacity:0.5}}</style>
        <defs><symbol id="valve"><rect class="steel" width="100" height="40"/></symbol><filter id="shadow"><feGaussianBlur stdDeviation="1"/></filter></defs>
        <use xlink:href="#valve" filter="url(#shadow)" style="stroke:#fff;animation:pulse 2s infinite">
            <animateTransform attributeName="transform" type="translate" from="0" to="1" dur="2s"/>
        </use>
        <script>example()</script><image href="https://example.invalid/remote.png"/>
        <rect onclick="example()" width="2" height="2"/><foreignObject width="1" height="1"/>
    </svg>`;
    const decode = (result: ReturnType<typeof compileSvgImage>) => {
        expect(result).toHaveProperty("src");
        return "src" in result ? decodeURIComponent(result.src.split(",", 2)[1]) : "";
    };

    it("keeps local SVG design features inside the image and removes active markup", () => {
        const result = compileSvgImage(drawing, false);
        expect(result).toHaveProperty("title", "Intake valve");
        const svg = decode(result);
        for (const value of ['viewBox="0 0 100 40"', '<symbol id="valve">', 'xlink:href="#valve"', '<feGaussianBlur', '@keyframes pulse', '<animateTransform']) {
            expect(svg).toContain(value);
        }
        expect(svg).not.toMatch(/<script|onclick|<foreignObject|remote\.png/);
    });

    it("keeps ordinary style and suppresses SVG and CSS motion in reduced mode", () => {
        const svg = decode(compileSvgImage(drawing, true));
        expect(svg).toContain('fill:#246');
        expect(svg).toContain('stroke:#fff');
        expect(svg).not.toMatch(/animateTransform|animation:|@keyframes/);
    });

    it("allows larger drawings and rejects malformed XML, DTDs, and excess size", () => {
        const wrap = (content: string) => `<svg viewBox="0 0 100 40">${content}</svg>`;
        expect(compileSvgImage(wrap("<rect/>".repeat(600)), true)).toHaveProperty("src");
        expect(compileSvgImage(wrap("<rect/>".repeat(5_001)), true)).toHaveProperty("error");
        expect(compileSvgImage(wrap(" ".repeat(1_000_000)), true)).toHaveProperty("error");
        expect(compileSvgImage("<svg>", false)).toHaveProperty("error");
        expect(compileSvgImage("<!DOCTYPE svg>" + drawing, false)).toHaveProperty("error");
    });
});
