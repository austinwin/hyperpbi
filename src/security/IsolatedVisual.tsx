import type { ComponentChildren } from "preact";
import { ExternalMount } from "../render/ExternalMount";
import { useLayoutEffect, useRef, useState } from "preact/hooks";

/** Shadow styles cannot select another visual; paint containment clips fixed/positioned content. */
export function IsolatedVisual({ enabled, children }: { enabled: boolean; children: ComponentChildren }) {
    const host = useRef<HTMLDivElement>(null);
    const [root, setRoot] = useState<ShadowRoot>();
    useLayoutEffect(() => {
        if (!enabled || !host.current) return;
        const shadow = host.current.shadowRoot ?? host.current.attachShadow({ mode: "open" });
        const styles = document.createElement("div"); styles.setAttribute("data-hp-runtime-styles", "");
        const sync = () => { styles.replaceChildren(...Array.from(document.querySelectorAll("style,link[rel=stylesheet]")).map(node => node.cloneNode(true))); };
        sync(); shadow.prepend(styles); setRoot(shadow);
        const observer = new MutationObserver(sync); observer.observe(document.head, { childList: true, subtree: true, characterData: true });
        return () => { observer.disconnect(); styles.remove(); };
    }, [enabled]);
    if (!enabled) return <>{children}</>;
    return <div class="hp-isolated-visual" style={{ display: "block", width: "100%", height: "100%", minWidth: 0, minHeight: 0, contain: "layout paint style", isolation: "isolate", overflow: "hidden" }}><div ref={host} style={{ width: "100%", height: "100%", minWidth: 0 }}>{root && <ExternalMount container={root}>{children}</ExternalMount>}</div></div>;
}
