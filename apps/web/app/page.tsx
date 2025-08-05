"use client";

import React from "react";
import "./style.css";
import { Button } from "@workspace/ui/components/button";
import CodeMirror, {
  drawSelection,
  EditorView,
  Extension,
  highlightActiveLine,
  keymap,
  ReactCodeMirrorRef,
  rectangularSelection,
} from "@uiw/react-codemirror";
import { githubDark } from "@uiw/codemirror-theme-github";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { useDebouncedCallback } from "use-debounce";
import { jsonLanguage } from "@codemirror/lang-json";
import { indentOnInput } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";

import liveMDPlugin from "live-md";
import {
  Table,
  GFM,
  Autolink,
  Strikethrough,
  Subscript,
  Superscript,
  TaskList,
  Emoji,
} from "@lezer/markdown";

let defaultValue = `## Title

\`\`\`jsx
function Demo() {
  return <div>demo</div>
}
\`\`\`

\`\`\`bash
# Not dependent on uiw.
npm install @codemirror/lang-markdown --save
npm install @codemirror/language-data --save
\`\`\`

[weisit ulr](https://uiwjs.github.io/react-codemirror/)

\`\`\`go
package main
import "fmt"
func main() {
  fmt.Println("Hello, 世界")
}
\`\`\`
`;

export default function Page() {
  const id = "editor-test";

  if (typeof window !== "undefined") {
    const existingValue = localStorage.getItem(id);
    if (existingValue) {
      defaultValue = existingValue;
    }
  }

  const editor = React.useRef<ReactCodeMirrorRef>(null);
  const [value, setValue] = React.useState(defaultValue);
  const [showCode, setShowCode] = React.useState(false);

  const defaultExtensions = React.useMemo<Extension[]>(() => {
    return showCode
      ? [
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          jsonLanguage,
        ]
      : [
          liveMDPlugin({
            lezer: {
              codeLanguages: languages,
              extensions: [
                Table,
                GFM,
                Autolink,
                Strikethrough,
                Subscript,
                Superscript,
                TaskList,
                Emoji,
              ],
            },
          }),
        ];
  }, [showCode]);

  const handleChange = useDebouncedCallback(
    (value: string) => {
      setValue(value);
      if (typeof window !== "undefined") {
        localStorage.setItem(id, value);
      }
    },
    1000 // Debounce time in milliseconds
  );

  return (
    <div className="h-full p-2">
      <div className="h-full w-full flex flex-col overflow-clip rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold">CodeMirror Editor</h1>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const isDark =
                  document.documentElement.classList.toggle("dark");
                document.documentElement.setAttribute(
                  "data-theme",
                  isDark ? "dark" : "light"
                );
              }}
            >
              Theme
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCode(!showCode);
              }}
            >
              {showCode ? "Live Mode" : "Markdown Mode"}
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Character: {editor.current?.state?.doc.length || 0}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Lines: {editor.current?.state?.doc.lines || 0}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Words:{" "}
              {editor.current?.state?.doc.toString().split(/\s+/).length || 0}
            </span>
          </div>
        </div>

        <div className="flex-1 h-full overflow-hidden">
          <div className="w-full h-full flex items-stretch justify-stretch">
            <CodeMirror
              id={id}
              ref={editor}
              autoFocus
              className={"h-full w-full" + (showCode ? "" : " livemd")}
              height="100%"
              width="100%"
              value={value}
              onChange={handleChange}
              theme={githubDark}
              extensions={[
                ...defaultExtensions,
                EditorView.lineWrapping,
                history(),
                drawSelection(),
                rectangularSelection(),
                highlightActiveLine(),
                indentOnInput(),
                keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
              ]}
              basicSetup={{
                drawSelection: true,
                highlightActiveLine: true,
                rectangularSelection: true,
                indentOnInput: true,
                lineNumbers: showCode,
                foldGutter: showCode,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
