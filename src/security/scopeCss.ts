import * as csstree from "css-tree";

export function scopeCssAst(ast: csstree.CssNode, scopeSelector: string): void {
    let keyframeDepth = 0;
    csstree.walk(ast, {
        enter(node: csstree.CssNode) {
            if (node.type === "Atrule" && /^(?:-webkit-)?keyframes$/i.test(node.name)) { keyframeDepth++; return; }
            if (keyframeDepth > 0) return;
            if (node.type !== "Rule" || node.prelude.type !== "SelectorList") return;
            const raw = csstree.generate(node.prelude);
            const selectors = raw.split(",").map(selector => selector.trim()).filter(Boolean);
            const scoped = selectors.map(selector => {
                const normalized = selector.replace(/:root|\bhtml\b|\bbody\b/g, "").trim();
                return normalized.startsWith(scopeSelector) ? normalized : `${scopeSelector} ${normalized || "*"}`;
            }).join(", ");
            node.prelude = csstree.parse(scoped, { context: "selectorList" }) as csstree.SelectorList;
        },
        leave(node: csstree.CssNode) {
            if (node.type === "Atrule" && /^(?:-webkit-)?keyframes$/i.test(node.name)) keyframeDepth--;
        }
    });
}
