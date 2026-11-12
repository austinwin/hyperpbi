import { validSvgViewBox } from "../components/svg/svgSchema";

export const svgNamespace = "http://www.w3.org/2000/svg";

export function parseSvgDocument(input: string): Element | undefined {
    const namespacedInput = /^\s*<svg\b[^>]*\bxmlns\s*=/.test(input)
        ? input : input.replace(/^\s*<svg\b/i, `<svg xmlns="${svgNamespace}"`);
    const document = new DOMParser().parseFromString(namespacedInput, "image/svg+xml");
    const root = document.documentElement;
    if (!document.querySelector("parsererror") && root.localName.toLowerCase() === "svg") return root;
}

export function svgContainAlignment(value: string | null | undefined): string {
    const alignment = /^(x(?:Min|Mid|Max)Y(?:Min|Mid|Max))(?:\s+(?:meet|slice))?$/.exec(value?.trim() ?? "");
    return `${alignment?.[1] ?? "xMidYMid"} meet`;
}

export function fitSvgViewport(root: Element, fallbackViewBox?: string): boolean {
    for (const { name } of Array.from(root.attributes)) {
        if (["viewbox", "preserveaspectratio"].includes(name.toLowerCase()) && name !== "viewBox" && name !== "preserveAspectRatio") root.removeAttribute(name);
    }
    if (!validSvgViewBox(root.getAttribute("viewBox"))) {
        const dimensions = ["width", "height"].map(name => /^(\d+(?:\.\d+)?|\.\d+)(?:px)?$/.exec(root.getAttribute(name)?.trim() ?? "")?.[1]);
        const intrinsicViewBox = `0 0 ${dimensions.join(" ")}`;
        const viewBox = validSvgViewBox(intrinsicViewBox) ? intrinsicViewBox : fallbackViewBox;
        if (!viewBox || !validSvgViewBox(viewBox)) return false;
        root.setAttribute("viewBox", viewBox);
    }
    root.setAttribute("preserveAspectRatio", svgContainAlignment(root.getAttribute("preserveAspectRatio")));
    root.removeAttribute("width");
    root.removeAttribute("height");
    return true;
}
