const motionTargets = new Set(["g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan"]);
const motionAttributes = new Set(["attributeName", "from", "to", "values", "dur", "repeatCount"]);
const numericValue = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;

/** Translate a small numeric SMIL subset without placing SMIL in the DOM. */
export function compileBoundSvgMotion(element: Element, namespace: string, index: number): string | undefined {
    if (element.children.length || Array.from(element.attributes).some(attribute => !motionAttributes.has(attribute.name))) return;

    const property = element.getAttribute("attributeName");
    if (property !== "opacity" && property !== "stroke-dashoffset") return;
    if (!motionTargets.has(element.parentElement?.localName ?? "")) return;

    const values = element.getAttribute("values");
    const from = element.getAttribute("from");
    const to = element.getAttribute("to");
    const frames = values !== null && from === null && to === null ? values.split(";", 6)
        : values === null && from !== null && to !== null ? [from, to] : [];
    if (frames.length < 2 || frames.length > 5) return;
    const numbers = frames.map(frame => numericValue.test(frame.trim()) ? Number(frame) : NaN);
    const min = property === "opacity" ? 0 : -10_000;
    const max = property === "opacity" ? 1 : 10_000;
    if (numbers.some(value => !Number.isFinite(value) || value < min || value > max)) return;

    const duration = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(element.getAttribute("dur") ?? "");
    const milliseconds = duration ? Number(duration[1]) * (duration[2] === "s" ? 1_000 : 1) : NaN;
    if (!Number.isFinite(milliseconds) || milliseconds < 1_000 || milliseconds > 60_000) return;
    const repeat = element.getAttribute("repeatCount") ?? "1";
    if (repeat !== "indefinite" && !/^(?:[1-9]|1\d|20)$/.test(repeat)) return;

    const name = "svg-motion-" + namespace.replace(/[.:]/g, "_") + "-" + index;
    const keyframes = numbers.map((value, frame) => (100 * frame / (numbers.length - 1)) + "%{" + property + ":" + value + "}").join("");
    const selector = '[data-hp-svg="' + namespace + '"] [data-hp-svg-motion="' + index + '"]';
    return "@keyframes " + name + "{" + keyframes + "}" + selector + "{animation:" + name + " " + milliseconds + "ms linear " + (repeat === "indefinite" ? "infinite" : repeat) + "}";
}
