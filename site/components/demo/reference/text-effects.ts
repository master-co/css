import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'text-decoration': ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'],
  'text-decoration-color': ['color', 'text-decoration-color', 'text-decoration-line'],
  'text-decoration-line': ['text-decoration-line', 'text-decoration-style', 'text-decoration-color'],
  'text-decoration-style': ['text-decoration-line', 'text-decoration-style', 'text-decoration-thickness'],
  'text-decoration-thickness': ['text-decoration-line', 'text-decoration-thickness', 'text-underline-offset'],
  'text-underline-offset': ['text-underline-offset', 'text-decoration-thickness'],
  'text-fill-color': ['color', '-webkit-text-fill-color'],
  'text-shadow': ['text-shadow'],
  'text-stroke': ['-webkit-text-stroke-width', '-webkit-text-stroke-color', '-webkit-text-fill-color'],
  'text-stroke-color': ['-webkit-text-stroke-color', '-webkit-text-stroke-width', '-webkit-text-fill-color'],
  'text-stroke-width': ['-webkit-text-stroke-width', '-webkit-text-stroke-color'],
}
const captions: Record<string, string> = {
  'text-decoration': 'The readings describe the element that originates the decoration. A descendant can have no decoration of its own while the ancestor’s line still paints through its inline text.',
  'text-decoration-color': 'Compare the actual foreground and line colors. A transparent decoration hides its paint without hiding the glyphs.',
  'text-decoration-line': 'The line longhand preserves the other decoration parts. Line aliases use the full shorthand and reset omitted parts.',
  'text-decoration-style': 'The authored underline supplies a real line. The style longhand changes its pattern while preserving its thickness.',
  'text-decoration-thickness': 'The computed value can remain auto or from-font; those keywords are not pixel measurements. Explicit thickness changes paint without resizing the text box.',
  'text-underline-offset': 'The underline moves relative to the text baseline. Offset does not add padding or increase the line box.',
  'text-fill-color': 'Glyph fill is independent of the foreground color. The plain surface adds no fill, stroke or background to the subject.',
  'text-shadow': 'These are native glyph shadows. The surrounding surface gives the paint room; the shadow does not increase the text’s layout box.',
  'text-stroke': 'The authored width, edge color and fill determine the visible glyph. A transparent fill needs a visible outline; zero-width strokes paint no edge.',
  'text-stroke-color': 'Every specimen supplies a nonzero stroke width. Changing edge color leaves the fill and font geometry intact.',
  'text-stroke-width': 'Compare the same glyphs at the same font size. The width changes the painted edge; box measurements expose the unchanged layout geometry.',
}

/** Leave the authored glyph paint untouched; keep labels and readings outside it. */
export function textEffects(section: ReferenceDemoSection): DemoScene {
  return typeSpecimens(section, {
    properties: properties[section.page], caption: captions[section.page],
    appearance: 'plain', measure: true,
  })
}
