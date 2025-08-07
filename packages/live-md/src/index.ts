import { ViewPlugin } from "@codemirror/view";
import { LanguageDescription, syntaxHighlighting } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { MarkdownConfig } from "@lezer/markdown";

import RichEditPlugin, { NodeType } from "./rich-edit.js";
import highlightStyle from "./highlightStyle.js";
import tagParser from "./tagParser.js";
import "katex/dist/katex.min.css"; // Ensure KaTeX styles are imported

export type LiveMDPluginConfig = {
  lezer?: {
    codeLanguages: LanguageDescription[];
    extensions: (MarkdownConfig | MarkdownConfig[])[];
  };
  getNodes: (nodes: NodeType[]) => void;
};

export default function liveMDPlugin(config: LiveMDPluginConfig) {
  return ViewPlugin.define(
    (view) => new RichEditPlugin(view, config.getNodes),
    {
      decorations: (v) => v.decorations,
      provide: (v) => [
        syntaxHighlighting(highlightStyle),
        markdown({
          ...(config.lezer ?? []),
          base: markdownLanguage,
          addKeymap: true,
          extensions: [tagParser, ...(config.lezer?.extensions ?? [])],
          completeHTMLTags: true,
        }),
      ],
      eventHandlers: {
        mousedown({ target }, view) {
          if (
            target instanceof Element &&
            target.matches(".cm-mark-render-block *")
          )
            view.dispatch({ selection: { anchor: view.posAtDOM(target) } });
        },
      },
    }
  );
}
