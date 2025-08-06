import { EditorView, WidgetType } from "@codemirror/view";
import katex from "katex";

export class MathBlockWidget extends WidgetType {
  constructor(
    private content: string,
    private displayMode: boolean,
    public from: number = 0,
    public to: number = 0
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("span");
    container.className = this.displayMode
      ? "cm-markdoc-math-block"
      : "cm-markdoc-math-inline";

    try {
      container.innerHTML = katex.renderToString(this.content, {
        displayMode: this.displayMode,
        throwOnError: false,
      });
    } catch (e) {
      container.textContent = this.content;
    }

    container.addEventListener("click", (e) => {
      e.preventDefault();

      const offset = this.displayMode ? 3 : 1; // Adjust for display mode

      // Dispatch a transaction to move the cursor and focus the editor
      view.dispatch({
        selection: { anchor: this.from + offset, head: this.to - offset }, // Place cursor after '$$'
      });
      view.focus();
    });

    return container;
  }

  eq(other: WidgetType): boolean {
    return (
      other instanceof MathBlockWidget &&
      other.content === this.content &&
      other.displayMode === this.displayMode
    );
  }
}
