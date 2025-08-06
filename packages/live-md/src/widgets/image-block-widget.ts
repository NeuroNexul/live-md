import { EditorView, WidgetType } from "@codemirror/view";

type ImageBlockProps = {
  url: string;
  alt?: string;
  title?: string;
  width?: string;
  from: number; // Start position of the markdown image
  to: number; // End position of the markdown image
};

export default class ImageBlockWidget extends WidgetType {
  view: EditorView;
  props: ImageBlockProps;

  constructor(
    view: EditorView,
    props: ImageBlockProps,
    private url_from: number = 0,
    private url_to: number = 0
  ) {
    super();
    this.view = view;
    this.props = props;
  }

  toDOM(view: EditorView) {
    const figure = document.createElement("figure");
    figure.className = "cm-markdoc-image-figure";
    figure.style.width = this.props.width || "auto";

    const img = document.createElement("img");
    img.className = "cm-markdoc-image";

    img.src =
      this.props.url ||
      "https://placehold.co/560x350/667EEA/FFFFFF?text=Something+Went+Wrong"; // Default placeholder image
    img.alt = this.props.alt || "Image";
    img.style.width = this.props.width || "auto";
    if (this.props.title) img.title = this.props.title;

    figure.appendChild(img);

    // Optional: Add a caption for the image
    if (this.props.title) {
      const caption = document.createElement("figcaption");
      caption.className = "cm-markdoc-image-caption";
      caption.textContent = this.props.title;
      figure.appendChild(caption);
    }

    figure.addEventListener("click", (e) => {
      e.preventDefault();

      // Dispatch a transaction to move the cursor and focus the editor
      view.dispatch({
        selection: { anchor: this.url_from, head: this.url_to },
      });
      view.focus();
    });

    return figure;
  }

  eq(other: WidgetType) {
    if (!(other instanceof ImageBlockWidget)) return false;
    return (
      this.props.url === other.props.url &&
      this.props.alt === other.props.alt &&
      this.props.title === other.props.title &&
      this.props.width === other.props.width
    );
  }

  destroy(dom: HTMLElement): void {
    // Clean up if necessary
    dom.remove();
  }
}
