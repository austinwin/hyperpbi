import { validSvgViewBox } from "../components/svg/svgSchema";

export const svgNamespace = "http://www.w3.org/2000/svg";

export function parseSvgDocument(input: string): Element | undefined {
    const namespacedInput = /^\s*<svg\b[^>]*\bxmlns\s*=/.test(input)
        ? input : input.replace(/^\s*<svg\b/i, `<svg xmlns="${svgNamespace}"`);
    const document = new DOMParser().parseFromString(namespacedInput, "image/svg+xml");
    const root = document.documentElement;
    if (!document.querySelector("parsererror") && root.localName.toLowerCase() === "svg") return root;
}

export function fitSvgViewport(root: Element): boolean {
    for (const { name } of Array.from(root.attributes)) {
        if (["viewbox", "preserveaspectratio"].includes(name.toLowerCase()) && name !== "viewBox" && name !== "preserveAspectRatio") root.removeAttribute(name);
    }
    if (!validSvgViewBox(root.getAttribute("viewBox"))) {
        const dimensions = ["width", "height"].map(name => /^(\d+(?:\.\d+)?|\.\d+)(?:px)?$/.exec(root.getAttribute(name)?.trim() ?? "")?.[1]);
        const viewBox = `0 0 ${dimensions.join(" ")}`;
        if (!validSvgViewBox(viewBox)) return false;
        root.setAttribute("viewBox", viewBox);
    }
    const alignment = /^x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?:\s+(?:meet|slice))?$/.exec(root.getAttribute("preserveAspectRatio")?.trim() ?? "");
    root.setAttribute("preserveAspectRatio", alignment ? `${alignment[0].split(/\s/)[0]} meet` : "xMidYMid meet");
    root.removeAttribute("width");
    root.removeAttribute("height");
    return true;
}
