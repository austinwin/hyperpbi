import { basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef, useState } from "preact/hooks";

export function CodeEditor({ value, onChange, theme, fontSize, wordWrap, ariaLabel }: { value: string; onChange: (value: string) => void; theme: string; fontSize: number; wordWrap: boolean; ariaLabel: string }) {
    const host = useRef<HTMLDivElement>(null); const view = useRef<EditorView>(); const changeHandler = useRef(onChange); const [fallback, setFallback] = useState(false); changeHandler.current = onChange;
    useEffect(() => {
        if (!host.current || fallback) return;
        let disposed = false;
        const frame = requestAnimationFrame(() => {
            if (disposed || !host.current) return;
            try {
                const extensions = [basicSetup, json(), EditorView.theme({ "&": { height: "100%", minHeight: "120px", fontSize: `${fontSize}px` }, ".cm-scroller": { overflow: "auto", fontFamily: "Cascadia Code, Consolas, monospace" }, ".cm-content": { minHeight: "100%" } }), EditorView.contentAttributes.of({ "aria-label": ariaLabel }), EditorView.updateListener.of(update => { if (update.docChanged) changeHandler.current(update.state.doc.toString()); })];
                if (wordWrap) extensions.push(EditorView.lineWrapping); if (theme === "dark") extensions.push(oneDark);
                view.current = new EditorView({ state: EditorState.create({ doc: value, extensions }), parent: host.current });
            } catch { setFallback(true); }
        });
        return () => { disposed = true; cancelAnimationFrame(frame); view.current?.destroy(); view.current = undefined; };
    }, [theme, fontSize, wordWrap, ariaLabel, fallback]);
    useEffect(() => { const editor = view.current; if (!editor || editor.state.doc.toString() === value) return; editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } }); }, [value]);
    if (fallback) return <textarea class="hp-code-editor-fallback" value={value} onInput={event => onChange(event.currentTarget.value)} aria-label={ariaLabel} spellcheck={false} />;
    return <div ref={host} class="hp-code-editor" data-editor-ready={Boolean(view.current)} />;
}
