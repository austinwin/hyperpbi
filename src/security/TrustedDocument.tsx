import { useEffect, useRef, useState } from "preact/hooks";

export const TRUSTED_HOST_NOTICE = "Trusted markup stays in an opaque-origin sandbox. Scripts and event handlers cannot execute. External resources, frames, forms and fonts remain subject to browser CSP, CORS, Power BI WebAccess and tenant policy. Host services and report credentials are not exposed.";

/** No allow-same-origin, navigation, popups, host bridge, or report data channel. */
export function TrustedDocument({ markup, css = "", title = "Trusted content" }: { markup: string; css?: string; title?: string }) {
    const frame = useRef<HTMLIFrameElement>(null);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => { setLoaded(false); }, [markup, css]);
    // Styles are inserted as a DOM text node so authored </style> cannot break the wrapper.
    const doc = new DOMParser().parseFromString(markup, "text/html");
    const viewport = doc.createElement("meta"); viewport.name = "viewport"; viewport.content = "width=device-width, initial-scale=1"; doc.head.prepend(viewport);
    const defaults = doc.createElement("style"); defaults.textContent = "html{color-scheme:light dark}body{margin:0;font:14px system-ui}img,video,svg{max-width:100%}*{box-sizing:border-box}"; doc.head.prepend(defaults);
    if (css) { const style = doc.createElement("style"); style.textContent = css; doc.head.append(style); }
    return <div class="hp-trusted-document" style={{ minWidth: 0, width: "100%", overflow: "hidden" }}>
        <iframe ref={frame} title={title} sandbox="allow-forms allow-downloads" referrerPolicy="no-referrer" srcDoc={`<!doctype html>${doc.documentElement.outerHTML}`} onLoad={() => setLoaded(true)} style={{ display: "block", width: "100%", height: "100%", minHeight: "240px", border: 0 }} />
        <details class="hp-trusted-notice" style={{ fontSize: "11px" }}><summary>Trusted content · host limitations{loaded ? "" : " · loading"}</summary>{TRUSTED_HOST_NOTICE}</details>
    </div>;
}
