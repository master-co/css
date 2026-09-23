import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'border-collapse': ['border-collapse', 'border-spacing'],
  'border-image': ['border-image-source', 'border-image-width', 'border-image-repeat'],
  'border-image-source': ['border-image-source', 'border-width'],
  'border-image-slice': ['border-image-slice', 'border-image-width'],
  'border-image-width': ['border-image-width', 'border-width'],
  'border-image-outset': ['border-image-outset', 'border-width'],
  'border-image-repeat': ['border-image-repeat'],
  'box-decoration-break': ['box-decoration-break', '-webkit-box-decoration-break'],
}
const captions: Record<string, string> = {
  'border-collapse': 'Cell borders and spacing are explicitly authored. Compare the actual shared seams as well as the computed table properties.',
  'border-image': 'The border image paints within the authored geometry. Its shorthand resets omitted image components without changing the regular border width.',
  'border-image-source': 'The source changes while the slice, painted width and measured layout box remain the same.',
  'border-image-slice': 'The 96 × 96 source uses 24-unit corners. Slice boundaries belong to the source; painted widths belong to the destination border.',
  'border-image-width': 'A bare number multiplies regular border width. The box reading measures layout, so paint can grow without changing it.',
  'border-image-outset': 'Outset extends paint beyond the measured border box. The explicit margin reserves room around that paint.',
  'border-image-repeat': 'The first repeat value controls top and bottom edges; the second controls left and right. The source pattern makes individual tiles visible.',
  'box-decoration-break': 'One inline element creates real line fragments. The readings expose standard and WebKit property support; the container controls wrapping.',
}

/** Keep authored table cells, source geometry and inline fragments intact. */
export function borderPaint(section: ReferenceDemoSection): DemoScene {
  return typeSpecimens(section, {
    appearance: 'plain', properties: properties[section.page],
    measure: section.page !== 'box-decoration-break', caption: captions[section.page],
  })
}
