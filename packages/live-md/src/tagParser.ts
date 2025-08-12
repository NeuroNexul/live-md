import { tags as t } from "@lezer/highlight";
import type { MarkdownConfig } from "@lezer/markdown";

export default {
  defineNodes: [
    { name: "MarkdocTag", block: true, style: t.meta },
    { name: "InlineMath", style: t.literal },
    { name: "BlockMath", block: true, style: t.special(t.content) },
  ],
  parseBlock: [
    {
      name: "MarkdocTag",
      endLeaf(_cx, line, _leaf) {
        return (
          line.next == 123 && line.text.slice(line.pos).trim().startsWith("{%")
        );
      },
      parse(cx, line) {
        if (line.next != 123) return false;

        const content = line.text.slice(line.pos).trim();
        if (!content.startsWith("{%") || !content.endsWith("%}")) return false;

        cx.addElement(
          cx.elt("MarkdocTag", cx.lineStart, cx.lineStart + line.text.length)
        );
        cx.nextLine();
        return true;
      },
    },
    {
      name: "BlockMath",
      parse(cx, line) {
        // The block must start with '$$' on a line by itself
        if (line.text.slice(line.pos).trim() !== "$$") return false;

        const start = cx.lineStart + line.text.indexOf("$$");

        // Keep reading lines until we find the closing '$$'
        while (cx.nextLine()) {
          if (line.text.slice(line.pos).trim() === "$$") {
            const end = cx.lineStart + line.text.length;

            // Found the end. Create the element.
            cx.addElement(cx.elt("BlockMath", start, end));
            // Move past the closing line
            cx.nextLine();
            return true;
          }
        }

        // If we reach the end of the doc without a close, it's not a valid block
        return false;
      },
    },
  ],

  parseInline: [
    {
      name: "InlineMath",
      parse(cx, next, pos) {
        // Trigger is '$', but not '$$'
        if (next !== 36 /* $ */ || cx.char(pos + 1) === 36) {
          return -1;
        }

        // Find the next '$' on the same line
        let close = -1;
        for (let i = pos + 1; i < cx.end; i++) {
          if (cx.char(i) === 36 /* $ */) {
            close = i;
            break;
          }
        }

        // If no closing delimiter is found on the line, fail
        if (close === -1) return -1;

        // Create the element from the opening '$' to the closing '$'
        return cx.addElement(cx.elt("InlineMath", pos, close + 1));
      },
    },
  ],
} as MarkdownConfig;
