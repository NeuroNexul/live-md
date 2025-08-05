import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewUpdate,
} from "@codemirror/view";
import { Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

// Preset decorations for rich text editing
export const decorationHidden = Decoration.mark({ class: "cm-mark-hidden" });
export const decorationToHide = Decoration.mark({ class: "cm-mark-to-hide" });
export const decorationCode = Decoration.mark({ class: "cm-mark-code" });
export const decorationTag = Decoration.mark({ class: "cm-mark-tag" });

const tokenElement = [
  "InlineCode",
  "Emphasis",
  "StrongEmphasis",
  "FencedCode",
  "Link",
];

const tokenHidden = [
  "HardBreak",
  "LinkMark",
  "EmphasisMark",
  "CodeMark",
  "CodeInfo",
  "URL",
];

export default class RichEditPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(
    view: EditorView
    // private config: Config
  ) {
    this.decorations = this.process(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet)
      this.decorations = this.process(update.view);
  }

  process(view: EditorView): DecorationSet {
    let widgets: Range<Decoration>[] = [];
    let [cursor] = view.state.selection.ranges;
    const lines = view.state.doc.toString().split("\n");

    if (!cursor) {
      return Decoration.set(widgets);
    }

    // Other blocks
    for (let { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter(node) {
          // console.log(`Node: ${node.name}, From: ${node.from}, To: ${node.to}`);

          if (node.name === "MarkdocTag")
            widgets.push(decorationTag.range(node.from, node.to));

          if (node.name === "FencedCode") {
            const startLine = view.state.doc.lineAt(node.from);
            const endLine = view.state.doc.lineAt(node.to);

            for (let i = startLine.number + 1; i <= endLine.number - 1; i++) {
              const line = view.state.doc.line(i);
              widgets.push(
                Decoration.line({ class: "cm-fenced-code-line dark" }).range(
                  line.from
                )
              );
            }

            widgets.push(
              Decoration.line({
                class: "cm-fenced-code-start-line dark",
                attributes: {
                  "data-lang": startLine.text.replace(/`/g, "") || "plane",
                },
              }).range(startLine.from)
            );
            widgets.push(
              Decoration.line({ class: "cm-fenced-code-end-line dark" }).range(
                endLine.from
              )
            );
          }

          if (tokenElement.includes(node.name)) {
            widgets.push(
              Decoration.mark({
                class: `cm-mark-${node.name.toLowerCase()}`,
              }).range(node.from, node.to)
            );
          }

          if (node.name.startsWith("ATXHeading"))
            widgets.push(
              Decoration.mark({
                class: `cm-mark-heading-${node.name.replace("ATXHeading", "")}`,
              }).range(node.from, node.to + 1)
            );

          if (node.name === "HeaderMark" || tokenHidden.includes(node.name))
            widgets.push(decorationToHide.range(node.from, node.to));

          const parent = hasParent(
            [
              "ATXHeading1",
              "ATXHeading2",
              "ATXHeading3",
              "ATXHeading4",
              "ATXHeading5",
              "ATXHeading6",
              ...tokenElement,
            ],
            node.node.parent
          ) as typeof node.node.parent;

          if (parent && (cursor.from < parent.from || cursor.to > parent.to)) {
            if (node.name === "HeaderMark")
              widgets.push(decorationHidden.range(node.from, node.to + 1));

            if (tokenHidden.includes(node.name))
              widgets.push(decorationHidden.range(node.from, node.to));
          }
        },
      });
    }

    return Decoration.set(widgets.sort((a, b) => a.from - b.from));
  }
}

function hasParent(name: string[], node: any): any {
  if (!node || !node.parent) return null;
  if (name.includes(node.name)) return node;
  return hasParent(name, node.parent);
}
