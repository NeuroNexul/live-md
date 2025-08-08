export let IntroMarkdown = `## LiveMD - See What You Get
Removes the barrier between Writing and Preview.

**LiveMD** is a modern, intuitive Markdown editor built on the powerful CodeMirror 6 framework, designed to bring a truly **What You See Is What You Get (WYSIWYG)** experience to your plain text. Forget the distraction of raw Markdown syntax; with LiveMD, your document transforms into a beautiful, readable preview as you type, while keeping the underlying Markdown accessible and editable.

> Trying to be a successor of [HyperMD](https://github.com/laobubu/HyperMD).
![My PlaceHolder](https://res.cloudinary.com/djoo8ogmp/image/upload/v1746213279/uploaded/image_yjzjdl.png "Hello From Minecraft")
### Key Features of LiveMD:
- **Real-time WYSIWYG Rendering:** As you write Markdown, LiveMD intelligently renders elements like headings, bold text, italics, and lists directly in the editor. This means you get a live preview of your content's final appearance, allowing you to focus on your writing rather than syntax.

- **Intuitive Cursor Placement:** LiveMD ensures a natural editing flow. When you interact with a rendered element, the cursor intelligently positions itself where you'd expect—for instance, after a displayed image, ready for you to continue typing.

- **Extensible and Performant:** Built on CodeMirror 6, LiveMD leverages a highly modular and efficient architecture, ensuring a smooth editing experience even for large documents, and offering endless possibilities for future customisations and features.

### Examples:
So far, we have seen headings, Images, and Lists. Let's explore some additional features you can utilise with LiveMD.

#### Typography
**Bold Text** Lorem ipsum *Italic Text* dolor sit amet, __Also Bold__ consectetur _Also Italic_ adipiscing elit. Nullam nec mauris ac diam luctus tempor ac in magna. Donec congue, sapien sed auctor egestas, quam arcu rutrum justo, vitae sagittis nisl augue ut mauris. Quisque ac condimentum sapien, in fringilla justo. \`This is Inline Code\` Quisque tellus arcu, viverra ut elit at, pharetra maximus sapien. Mauris et sem elementum, vestibulum erat quis, mattis leo. Phasellus nec eleifend nunc, quis ultricies felis. In mattis, arcu eget mollis bibendum, sapien libero scelerisque mauris, non venenatis ipsum mi ut nulla.
- **Subscript:** 2H~2~O => 2H~2~ + O~2~
- **Superscript:** a^2^ + b^2^ = (a+b)^2^

#### Code Blocks:
\`\`\`tsx
"use client";
import React from "react";

export default function page(props: Props) {
  return (
    <div>
        <h1>Hello World</h1>
    </div>
  )
}
\`\`\`

#### Unordered & Task Lists
1. Here's an example of **Unordered List**.
2. Here's the second Line
   1. Here's a nested List
   2. Here's a nested Second Line
- [ ] Here's a Task List
- [x] Here's a Checked Task List Item

#### Math (Katex):
Inline Math: $\\min_{(w\\in\\mathbb R^d)}\\sum_{i=1}^n(w^Tx_i-y_i)^2$
Block Math:

$$
\\begin{aligned}

\\nabla_w \\left( \\frac{1}{2 \\sigma^2} \\sum_{i=1}^n(w^Tx_i-y_i)^2 \\right)
      &= \\frac{1}{2\\sigma^2} \\sum_{i=1}^n \\nabla_w(w^Tx_i-y_i)^2 \\\\
      &= \\frac{1}{2\\sigma^2} \\sum_{i=1}^n 2(w^Tx_i-y_i)x_i\\\\
      &= \\frac{1}{\\sigma^2} \\sum_{i=1}^n (w^Tx_i-y_i)x_i

\\end{aligned}
$$
In essence, **LiveMD** represents a significant leap forward in Markdown editing, effectively dissolving the barrier between writing and previewing. By harnessing the modern, high-performance capabilities of CodeMirror 6, it provides a fluid, real-time WYSIWYG experience that intuitively renders everything from basic typography to complex elements like code blocks and KaTeX math equations. This seamless integration of Markdown's raw power with the immediate visual feedback of a rich text editor creates a focused, efficient, and powerful environment, making it an exceptional tool for writers, developers, and academics alike.

As **LiveMD is an early-stage project undergoing active development**, we invite you to help shape its future. Your feedback is invaluable, and we welcome contributions to this open-source initiative.



`;
