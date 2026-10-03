import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";
import type { Language } from "../../../shared/api";

export function CodeEditor({
  path,
  value,
  language,
  readOnly,
  onChange,
}: {
  path: string;
  value: string;
  language: Language | "javascript";
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const languageExtension =
      language === "python"
        ? [python()]
        : language === "typescript" || language === "javascript"
          ? [javascript({ typescript: language === "typescript" })]
          : [];
    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          ...languageExtension,
          EditorView.editable.of(!readOnly),
          EditorState.readOnly.of(readOnly),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.contentAttributes.of({ dir: "ltr", "aria-label": path }),
          EditorView.theme({
            "&": {
              height: "100%",
              minHeight: "50vh",
              direction: "ltr",
              textAlign: "start",
              backgroundColor: "#1C1917",
              color: "#F5F5F4",
              fontSize: "14px",
            },
            ".cm-scroller": {
              direction: "ltr",
              fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
              fontSize: "14px",
              lineHeight: "1.5",
            },
            ".cm-content, .cm-line, .cm-gutters": {
              fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
              fontSize: "14px",
              lineHeight: "1.5",
            },
            ".cm-content": { direction: "ltr", caretColor: "#F5F5F4" },
            ".cm-gutters": { direction: "ltr", backgroundColor: "#1C1917", color: "#A8A29E", border: "none" },
            ".cm-activeLine": { backgroundColor: "#292524" },
            ".cm-activeLineGutter": { backgroundColor: "#292524" },
          }, { dark: true }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is recreated when the buffer identity changes. Value sync is below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, language, readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value, path, language, readOnly]);

  return <div className="editor-host" dir="ltr" ref={hostRef} />;
}
