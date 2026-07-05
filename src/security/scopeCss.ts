import * as csstree from "css-tree";

export function scopeCssAst(ast: csstree.CssNode, scopeSelector: string): void {
    csstree.walk(ast, {
        visit: "Rule",
        enter(node) {
            if (node.type !== "Rule" || node.prelude.type !== "SelectorList") return;
            const raw = csstree.generate(node.prelude);
            const selectors = raw.split(",").map(selector => selector.trim()).filter(Boolean);
            const scoped = selectors.map(selector => {
                const normalized = selector.replace(/:root|\bhtml\b|\bbody\b/g, "").trim();
                return normalized.startsWith(scopeSelector) ? normalized : `${scopeSelector} ${normalized || "*"}`;
            }).join(", ");
            node.prelude = csstree.parse(scoped, { context: "selectorList" }) as csstree.SelectorList;
        }
    });
}
