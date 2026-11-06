import { render, type ComponentChildren } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";

/** An explicitly owned mount. Callers provide their own context inside children. */
export function ExternalMount({ container, children }: { container: Element | ShadowRoot; children: ComponentChildren }) {
    const ownedMount = useRef<HTMLDivElement>();
    useLayoutEffect(() => {
        const mount = document.createElement("div");
        ownedMount.current = mount;
        mount.style.display = "contents";
        container.appendChild(mount);
        return () => { render(null, mount); mount.remove(); ownedMount.current = undefined; };
    }, [container]);
    useLayoutEffect(() => {
        const mount = ownedMount.current;
        if (mount) render(<>{children}</>, mount);
    }, [container, children]);
    return null;
}
