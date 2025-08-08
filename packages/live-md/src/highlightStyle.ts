import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

export default HighlightStyle.define([
  { tag: t.heading1, fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '2em', textDecoration: 'none' },
  { tag: t.heading2, fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '1.75em', textDecoration: 'none' },
  { tag: t.heading3, fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '1.5em', textDecoration: 'none' },
  { tag: t.heading4, fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '1.375em', textDecoration: 'none' },
  { tag: t.heading5, fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '1.25em', textDecoration: 'none' },
  { tag: t.heading6, fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '1.125em', textDecoration: 'none' },
  { tag: t.link, fontFamily: 'sans-serif', textDecoration: 'underline', color: 'var(--color-link)' },
  { tag: t.emphasis, fontFamily: 'sans-serif', fontStyle: 'italic' },
  { tag: t.strong, fontFamily: 'sans-serif', fontWeight: 'bold' },
  { tag: t.monospace, fontFamily: 'var(--font-jetbrains-mono)' },
  { tag: t.content, fontFamily: 'sans-serif' },
  { tag: t.meta, color: 'darkgrey' },
]);