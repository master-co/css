import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'text-align': ['text-align', 'direction'], 'text-indent': ['text-indent'],
  'text-transform': ['text-transform'], 'text-wrap': ['text-wrap'],
  'white-space': ['white-space'], 'word-break': ['word-break'],
  'overflow-wrap': ['overflow-wrap'], 'hyphens': ['hyphens'],
  'line-clamp': ['-webkit-line-clamp', 'display', 'overflow'],
  'text-overflow': ['text-overflow', 'white-space', 'overflow'],
  'direction': ['direction', 'unicode-bidi'],
  'writing-mode': ['writing-mode', 'text-orientation'],
  'text-orientation': ['writing-mode', 'text-orientation'],
  'text-rendering': ['text-rendering'],
}
const captions: Record<string, string> = {
  'text-align': 'The blue outline is the paragraph’s box. Alignment moves its inline content; it does not position the paragraph itself.',
  'text-indent': 'Follow the first line’s starting edge. Later lines retain their normal position inside the same paragraph.',
  'text-transform': 'The browser changes the presentation. The authored words, language and underlying text remain intact.',
  'text-wrap': 'The text and line width are identical across the comparison. Exact breaks depend on the browser’s wrapping algorithm and loaded font.',
  'white-space': 'The specimens preserve the exact spaces and line breaks in the adjacent source. Annotation text stays outside that context.',
  'word-break': 'Real text and native line-breaking rules determine the result. Any deliberate overflow remains available in the named scroll region.',
  'overflow-wrap': 'Compare the authored constraints and actual box sizes. Emergency breaks and intrinsic width are separate parts of text layout.',
  'hyphens': 'Automatic hyphenation depends on the declared language and the browser’s dictionaries. Manual soft hyphens provide explicit opportunities.',
  'line-clamp': 'Clamping limits the visible lines. Preserve the complete source and provide another reading path whenever the omitted text is needed.',
  'text-overflow': 'A marker needs actual clipped inline content. The example owns its width, display, wrapping and overflow rules.',
  'direction': 'Language and semantic direction remain in the markup. CSS direction sets the local base direction without reversing the source characters.',
  'writing-mode': 'Writing mode sets line orientation and block progression. The authored dimensions make the column direction visible.',
  'text-orientation': 'These are native vertical text runs. Compare Latin and CJK glyph orientation without rotating the entire element.',
  'text-rendering': 'This is a rendering hint, not a measured speed or quality improvement. Visible differences depend on the browser, platform and font.',
}

/** Use the authored language, whitespace, nested context and clipping prerequisites. */
export function textFlow(section: ReferenceDemoSection): DemoScene {
  return typeSpecimens(section, {
    properties: properties[section.page], measure: true,
    caption: section.page === 'text-wrap' && section.id === 'prevent-wrapping'
      ? 'The label occupies one constrained block. Hidden overflow clips the single line, and the ellipsis marks the omitted text.'
      : section.page === 'text-wrap' && section.id === 'apply-conditionally'
        ? 'The heading keeps the same reading width. Resize the iframe to change its native wrapping strategy; exact breaks depend on the browser and font.'
        : captions[section.page],
    pseudo: section.page === 'text-transform' && section.id === 'sentence' ? '::first-letter' : undefined,
  })
}
