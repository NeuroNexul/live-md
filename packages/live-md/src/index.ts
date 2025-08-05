import { ViewPlugin } from "@codemirror/view";
import { LanguageDescription, syntaxHighlighting } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { MarkdownConfig } from "@lezer/markdown";

import RichEditPlugin from "./rich-edit.js";
import highlightStyle from "./highlightStyle.js";
import tagParser from "./tagParser.js";

export type LiveMDPluginConfig = {
  lezer?: {
    codeLanguages: LanguageDescription[];
    extensions: (MarkdownConfig | MarkdownConfig[])[];
  };
};

export default function liveMDPlugin(config: LiveMDPluginConfig) {
  const mergedConfig = {
    ...(config.lezer ?? []),
    extensions: [tagParser, ...(config.lezer?.extensions ?? [])],
  };

  return ViewPlugin.define((view) => new RichEditPlugin(view), {
    decorations: (v) => v.decorations,
    provide: (v) => [
      syntaxHighlighting(highlightStyle),
      markdown(mergedConfig),
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
  });
}
