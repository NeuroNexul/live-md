import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewUpdate,
} from "@codemirror/view";
import { Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { MathBlockWidget } from "./widgets/math-widget.js";
import ImageBlockWidget from "./widgets/image-block-widget.js";
import HtmlBlockWidget from "./widgets/html-widget.js";

// Preset decorations for rich text editing
export const decorationHidden = Decoration.mark({ class: "cm-mark-hidden" });
export const decorationToHide = Decoration.mark({ class: "cm-mark-to-hide" });
export const decorationTag = Decoration.mark({ class: "cm-mark-tag" });

const tokenElement = [
  "InlineCode",
  "Emphasis",
  "StrongEmphasis",
  "FencedCode",
  "Link",
  "BulletList",
  "OrderedList",
  "Task",
];

const tokenHidden = [
  "HardBreak",
  "LinkMark",
  "EmphasisMark",
  "CodeMark",
  "CodeInfo",
  "URL",
  "ListMark",
  "TaskMarker",
];

export type NodeType = {
  name: string;
  from: number;
  to: number;
  parent: string;
};

export default class RichEditPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(
    view: EditorView,
    // private config: Config
    private getNodes: (nodes: NodeType[]) => void
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
    const processedHTMLs = new Set();

    const nodes: NodeType[] = [];

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

          // Push the node to the nodes array according to the structure
          nodes.push({
            name: node.name,
            from: node.from,
            to: node.to,
            parent: node.node.parent?.name || "",
          });

          if (node.name === "MarkdocTag")
            widgets.push(decorationTag.range(node.from, node.to));

          /**
           * Adding support for HTML tags.
           *
           * These tages are identified as single tag only,
           * so, we need to iterate through the syntax tree
           * to find the matching closing tag.
           *
           * Also, we need to ensure that the tag is not already processed
           * to avoid duplicate decorations.
           */
          if (node.name === "HTMLTag") {
            // If this HTML tag has already been processed, skip it.
            // This prevents reprocessing the same tag multiple times.
            if (processedHTMLs.has(node.from)) {
              return;
            }

            const tagText = view.state.doc.sliceString(node.from, node.to);

            // If the tag is a closing tag or self-closing, skip it.
            if (tagText.startsWith("</") || tagText.endsWith("/>")) return;

            // Find the tag name (e.g., "span").
            const tagNameMatch = tagText.match(/^<([a-zA-Z0-9]+)/);
            if (!tagNameMatch) return;
            const tagName = tagNameMatch[1];

            let balance = 1;
            let finalTo = -1;

            // Start a *new* iteration to scan for the matching closing tag.
            syntaxTree(view.state).iterate({
              from: node.to + 1, // Start searching *after* the current opening tag.
              enter: (innerNode) => {
                if (innerNode.name === "HTMLTag") {
                  const innerTagText = view.state.doc.sliceString(
                    innerNode.from,
                    innerNode.to
                  );
                  const innerTagNameMatch =
                    innerTagText.match(/^<\/?([a-zA-Z0-9]+)/);

                  // Only consider tags of the same kind (e.g., 'span' with 'span').
                  if (innerTagNameMatch && innerTagNameMatch[1] === tagName) {
                    if (innerTagText.startsWith("</")) {
                      balance--; // Found a closing tag.
                    } else if (!innerTagText.endsWith("/>")) {
                      balance++; // Found a nested opening tag.
                    }
                  }

                  // If balance is 0, we've found our matching closing tag.
                  if (balance === 0) {
                    finalTo = innerNode.to;
                    return false; // Stop this inner scan.
                  }
                }
              },
            });

            // If we found a complete, balanced element...
            if (finalTo !== -1) {
              // Don't render widget if cursor is inside the balanced range.
              if (!(cursor.from <= finalTo && cursor.to >= node.from)) {
                const fullHtml = view.state.doc.sliceString(node.from, finalTo);
                const deco = Decoration.replace({
                  widget: new HtmlBlockWidget(
                    fullHtml,
                    false,
                    node.from,
                    finalTo
                  ),
                });
                widgets.push(deco.range(node.from, finalTo));
              }

              // Mark all tags within this range as "processed" so we don't check them again.
              syntaxTree(view.state).iterate({
                from: node.from,
                to: finalTo,
                enter: (n) => {
                  if (n.name === "HTMLTag") {
                    processedHTMLs.add(n.from);
                  }
                },
              });

              return false;
            }
          }

          /**
           * Adding support for HTML blocks.
           *
           * HTML blocks are identified by the "HTMLBlock" node type as a whole.
           * The content of the block is extracted from the node's range.
           */
          if (node.name === "HTMLBlock") {
            const rawHtml = view.state.doc.sliceString(node.from, node.to);
            if (rawHtml.trim() === "") return;

            // Don't render widget if cursor is inside the HTML block.
            if (!(cursor.from <= node.to && cursor.to >= node.from)) {
              widgets.push(
                Decoration.widget({
                  widget: new HtmlBlockWidget(
                    rawHtml,
                    true,
                    node.from,
                    node.to
                  ),
                  block: false,
                }).range(node.to)
              );

              widgets.push(decorationHidden.range(node.from, node.to));
            }
          }

          /**
           * Adding decorations for Image blocks.
           * The ImageBlockWidget is used to render the image with its URL, alt text,
           * and title text.
           * The URL and title are extracted from the node's children, and the alt text
           * is extracted from the markdown string of the Image node.
           */
          if (node.name === "Image") {
            const content = view.state.doc.sliceString(node.from, node.to);

            // Use regex to extract alt text from the markdown string (e.g., "Windows" from ![Windows])
            const altMatch = content.match(/^!\[([^\]]*)\]/);
            const altText = altMatch ? (altMatch[1] ?? "") : "";

            let imageUrl = "";
            let titleText = "";
            let url_from = 0;
            let url_to = 0;

            // Use a cursor to find the 'URL' and 'LinkTitle' children
            let imageCursor = node.node.cursor();
            if (imageCursor.firstChild()) {
              do {
                if (imageCursor.name === "URL") {
                  imageUrl = view.state.doc.sliceString(
                    imageCursor.from,
                    imageCursor.to
                  );
                  url_from = imageCursor.from;
                  url_to = imageCursor.to;
                } else if (imageCursor.name === "LinkTitle") {
                  let rawTitle = view.state.doc.sliceString(
                    imageCursor.from,
                    imageCursor.to
                  );
                  titleText = rawTitle.replace(/^['"]|['"]$/g, ""); // Remove leading/trailing single or double quotes
                }
              } while (imageCursor.nextSibling()); // Move to the next sibling
            }

            widgets.push(
              Decoration.widget({
                block: false,
                widget: new ImageBlockWidget(
                  view,
                  {
                    url: imageUrl,
                    alt: altText,
                    title: titleText,
                    width: "auto", // TODO: Make this configurable
                    from: node.from,
                    to: node.to,
                  },
                  url_from,
                  url_to
                ),
                side: 1,
              }).range(node.to)
            );

            if (cursor.from < node.from || cursor.to > node.to)
              widgets.push(decorationHidden.range(node.from, node.to));
          }

          /**
           * Fenced code blocks are special because they can span multiple lines.
           * We need to add a decoration for each line in the block.
           * This is done by checking the start and end lines of the block
           * and adding a decoration for each line in between.
           *
           * Also, we add a decoration for the start and end lines of the block
           * to indicate the start and end of the block.
           */
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

            // Add decorations for the start and end lines of the block
            // with the language information if available else default to "plane"
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

          /**
           * Adding decorations for math blocks.
           * There are two types of math blocks:
           *    - BlockMath: This is a block-level math element that spans multiple lines.
           *    - InlineMath: This is an inline math element that spans a single line.
           *
           * Both of these are handled by the MathBlockWidget with the content and display mode.
           * The content is extracted from the node and the display mode is determined by the node name.
           */
          if (node.name === "BlockMath" || node.name === "InlineMath") {
            // Adding decoration for the math block and inline math
            // for better highlighting and styling while editing
            widgets.push(
              Decoration.mark({
                class: `cm-mark-${node.name.toLowerCase()}`,
              }).range(node.from, node.to)
            );

            // Get the content of the math block without the $$ delimiters or $ delimiters
            const content = view.state
              .sliceDoc(node.from, node.to)
              .replace(/^\$\$|\$\$$/g, "")
              .replace(/^\$|\$$/g, "");

            if (
              cursor.from < node.from ||
              cursor.to > node.to ||
              node.name === "BlockMath"
            )
              widgets.push(
                Decoration.widget({
                  widget: new MathBlockWidget(
                    content,
                    node.name === "BlockMath",
                    node.from,
                    node.to
                  ),
                  block: false,
                  side: 1,
                }).range(node.to)
              );

            if (cursor.from < node.from || cursor.to > node.to)
              widgets.push(decorationHidden.range(node.from, node.to));
          }

          /**
           * Adding decorations for BulletedList, OrderedList, and ListItem.
           * These elements are highlighted with a specific class for styling.
           */
          if (node.name === "BulletList" || node.name === "OrderedList") {
            const startLine = view.state.doc.lineAt(node.from);
            const endLine = view.state.doc.lineAt(node.to);

            for (let i = startLine.number; i <= endLine.number; i++) {
              const line = view.state.doc.line(i);
              widgets.push(
                Decoration.line({
                  class: `cm-${node.name.toLowerCase()}-line`,
                }).range(line.from)
              );
            }

            widgets.push(
              Decoration.line({
                class: `cm-${node.name.toLowerCase()}-start-line`,
              }).range(startLine.from)
            );
            widgets.push(
              Decoration.line({
                class: `cm-${node.name.toLowerCase()}-end-line`,
              }).range(endLine.from)
            );
          }

          /**
           * Adding decorations for inline elements like Emphasis, StrongEmphasis, InlineCode, etc.
           * These elements are highlighted with a specific class for styling.
           */
          if (tokenElement.includes(node.name)) {
            widgets.push(
              Decoration.mark({
                class: `cm-mark-${node.name.toLowerCase()}`,
              }).range(node.from, node.to)
            );
          }

          /**
           * Adding decorations for ATX headings (H1 to H6).
           * These are highlighted with a specific class for styling.
           */
          if (node.name.startsWith("ATXHeading"))
            widgets.push(
              Decoration.mark({
                class: `cm-mark-heading-${node.name.replace("ATXHeading", "")}`,
              }).range(node.from, node.to + 1)
            );

          /**
           * Adding a to-hide decoration for the nodes that should be hidden
           * for highlighting them in a dim color if visible, indicating
           * they are meant to be hidden.
           */
          if (node.name === "HeaderMark" || tokenHidden.includes(node.name))
            widgets.push(decorationToHide.range(node.from, node.to));

          /**
           * Hide the nodes that should be hidden when not in selection.
           * This is done by checking if the node is in the current selection.
           */
          if (node.name === "HeaderMark" || tokenHidden.includes(node.name)) {
            // Get their parent node to calculate cursor range
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

            // If the node is not in the current selection, hide it
            if (
              parent &&
              (cursor.from < parent.from || cursor.to > parent.to)
            ) {
              /**
               * Now, we are seperating CodeMark, CodeInfo from rest of the hidden tokens
               * because we want to avoid the unexpected jump behavior.
               */
              if (node.name === "CodeMark" || node.name === "CodeInfo") {
                widgets.push(
                  Decoration.mark({
                    class: `cm-mark-${node.name.toLowerCase()}`,
                  }).range(node.from, node.to)
                );
              } else {
                /**
                 * If the node is a HeaderMark or any other token that should be hidden,
                 * we add a decoration to hide it.
                 */
                widgets.push(
                  decorationHidden.range(
                    node.from,
                    node.to + (node.name === "HeaderMark" ? 1 : 0)
                  )
                );
              }
            }
          }
        },
      });
    }

    // If getNodes function is provided, call it with the nodes array
    if (this.getNodes) {
      this.getNodes(nodes);
    }

    return Decoration.set(widgets.sort((a, b) => a.from - b.from));
  }
}

/**
 * Checks if a node has a parent with a specific name.
 *
 * @param name {string[]} - Array of node names to check against
 * @param node {any} - The node to check
 * @returns {any} - The parent node if it matches any of the names, otherwise null
 */
function hasParent(name: string[], node: any): any {
  if (!node || !node.parent) return null;
  if (name.includes(node.name)) return node;
  return hasParent(name, node.parent);
}
