import { EditorView, WidgetType } from "@codemirror/view";

export default class HtmlBlockWidget extends WidgetType {
  rawHtml: string;
  block: boolean;
  from: number;
  to: number;

  constructor(rawHtml: string, block: boolean, from: number, to: number) {
    super();
    this.rawHtml = rawHtml;
    this.block = block;
    this.from = from;
    this.to = to;
  }

  toDOM(view: EditorView) {
    const template = document.createElement("template");
    template.innerHTML = this.rawHtml;
    const content = template.content;

    let renderedElement;

    if (content.children.length === 1) {
      renderedElement = content.children[0];
    } else {
      renderedElement = document.createElement("span");
      renderedElement.appendChild(content.cloneNode(true));
    }

    if (renderedElement instanceof HTMLElement) {
      renderedElement.style.display = this.block ? "block" : "inline-block";
      renderedElement.style.whiteSpace = "normal"

      // Add the click handler to select the source
      renderedElement.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({
          selection: { anchor: this.from, head: this.to },
        });
        view.focus();
      });
    } else {
      // Fallback in the rare case the content isn't an element
      renderedElement = document.createElement("span");
    }

    return renderedElement;
  }

  eq(other: WidgetType) {
    if (!(other instanceof HtmlBlockWidget)) return false;
    return (
      this.rawHtml === other.rawHtml &&
      this.from === other.from &&
      this.to === other.to
    );
  }

  destroy(dom: HTMLElement): void {
    // Clean up if necessary
    dom.remove();
  }
}
