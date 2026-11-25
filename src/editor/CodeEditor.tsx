import { basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { Annotation, Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

const hostChange = Annotation.define<boolean>();

export function CodeEditor({ value, onChange, theme, fontSize, wordWrap, ariaLabel }: {
    value: string;
    onChange: (value: string) => void;
    theme: string;
    fontSize: number;
    wordWrap: boolean;
    ariaLabel: string;
}) {
    const host = useRef<HTMLDivElement>(null);
    const editor = useRef<EditorView>();
    const [fallback, setFallback] = useState(false);
    const appearance = useMemo(() => new Compartment(), []);
    const presentation = useMemo(() => {
        const extensions: Extension[] = [
            EditorView.theme({
                "&": { height: "100%", minHeight: "120px", fontSize: `${fontSize}px` },
                ".cm-scroller": { overflow: "auto", fontFamily: "Cascadia Code, Consolas, monospace" },
                ".cm-content": { minHeight: "100%" },
            }),
            EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
        ];
        if (wordWrap) extensions.push(EditorView.lineWrapping);
        if (theme === "dark") extensions.push(oneDark);
        return extensions;
    }, [ariaLabel, fontSize, theme, wordWrap]);
    const current = useRef({ value, presentation, onChange });
    current.current = { value, presentation, onChange };

    useEffect(() => {
        if (fallback) return;
        const frame = requestAnimationFrame(() => {
            if (!host.current) return;
            try {
                editor.current = new EditorView({
                    state: EditorState.create({
                        doc: current.current.value,
                        extensions: [
                            basicSetup, json(), appearance.of(current.current.presentation),
                            EditorView.updateListener.of(update => {
                                if (update.docChanged && update.transactions.some(transaction => !transaction.annotation(hostChange))) {
                                    current.current.onChange(update.state.doc.toString());
                                }
                            }),
                        ],
                    }),
                    parent: host.current,
                });
            } catch {
                setFallback(true);
            }
        });
        return () => {
            cancelAnimationFrame(frame);
            editor.current?.destroy();
            editor.current = undefined;
        };
    }, [appearance, fallback]);

    useEffect(() => {
        editor.current?.dispatch({ effects: appearance.reconfigure(presentation) });
    }, [appearance, presentation]);
    useEffect(() => {
        const view = editor.current;
        if (!view || view.state.doc.toString() === value) return;
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: value },
            annotations: hostChange.of(true),
        });
    }, [value]);

    if (fallback) return <textarea class="hp-code-editor-fallback" value={value} onInput={event => onChange(event.currentTarget.value)} aria-label={ariaLabel} spellcheck={false} />;
    return <div ref={host} class="hp-code-editor" data-editor-ready={Boolean(editor.current)} />;
}
