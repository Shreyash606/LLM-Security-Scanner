"use client";
import Editor, { OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef } from "react";

export default function CodeViewer({
  code,      // JSON string: { slice, offset }
  path,
  highlight, // absolute lines in full file
}: {
  code: string;
  path: string;
  highlight?: { start: number; end: number };
}) {
  const parsed = useMemo(() => {
    try { return JSON.parse(code) as { slice: string; offset: number }; }
    catch { return { slice: code, offset: 1 }; }
  }, [code]);

  const ref = useRef<{ editor:any; monaco:any; dec:any } | null>(null);

  const onMount: OnMount = (editor, monaco) => {
    // Dedicated collection so decorations survive cursor/focus changes
    const dec = editor.createDecorationsCollection([]);
    // Turn off Monaco's own current-line highlight so only ours shows
    editor.updateOptions({ renderLineHighlight: "none" });
    ref.current = { editor, monaco, dec };
  };

  // Convert absolute file lines -> local slice lines
  const localHL = useMemo(() => {
    if (!highlight) return undefined;
    const start = Math.max(1, highlight.start - parsed.offset + 1);
    const end   = Math.max(start, highlight.end   - parsed.offset + 1);
    return { start, end };
  }, [highlight, parsed.offset]);

  // Persist highlight always: (re)apply on slice/offset/hl changes
  useEffect(() => {
    if (!ref.current) return;
    const { editor, monaco, dec } = ref.current;

    dec.set([]); // clear any previous
    if (localHL) {
      dec.set([{
        range: new monaco.Range(localHL.start, 1, localHL.end, 1),
        options: {
          isWholeLine: true,
          className: "code-highlight",                 // content area
          linesDecorationsClassName: "code-hl-gutter", // gutter stripe
          overviewRuler: {
            color: "rgba(245,158,11,0.85)",            // ruler mark (amber)
            position: monaco.editor.OverviewRulerLane.Full
          }
        }
      }]);
      // Keep the issue centered when first showing
      editor.revealLineInCenter(localHL.start);
    }
  }, [localHL, parsed.slice]);

  return (
    <div className="gh-card sticky-pane">
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{borderColor:"var(--gh-border)"}}>
        <span className="font-medium">Code</span>
        <span className="text-sm text-gray-600 truncate">{path}</span>
      </div>
      <Editor
        key={path + ":" + parsed.offset}
        height="60vh"
        language={guessLang(path)}
        value={parsed.slice}
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          lineNumbers: (n: number) => String(n + parsed.offset - 1),
          scrollBeyondLastLine: false,
          // keep UI stable, don't let Monaco add its own highlight
          renderLineHighlight: "none",
          renderLineHighlightOnlyWhenFocus: false,
        }}
        onMount={onMount}
      />
    </div>
  );
}

function guessLang(p: string) {
  if (p.endsWith(".ts")||p.endsWith(".tsx")) return "typescript";
  if (p.endsWith(".js")||p.endsWith(".jsx")) return "javascript";
  if (p.endsWith(".py")) return "python";
  if (p.endsWith(".go")) return "go";
  if (p.endsWith(".java")) return "java";
  if (p.endsWith(".cs")) return "csharp";
  if (p.endsWith(".rb")) return "ruby";
  if (p.endsWith(".php")) return "php";
  if (p.endsWith(".vue")) return "vue";
  if (p.endsWith(".rs")) return "rust";
  return "plaintext";
}
