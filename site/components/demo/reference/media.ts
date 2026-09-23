import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'object-fit': ['object-fit', 'object-position'],
  'object-position': ['object-position', 'object-fit'],
  'fill': ['fill', 'stroke'],
  'stroke': ['stroke', 'stroke-width', 'fill'],
  'stroke-width': ['stroke-width', 'stroke'],
}
const captions: Record<string, string> = {
  'object-fit': 'The source is 320 × 200. The measured box belongs to the image element; fitting changes the content inside it.',
  'object-position': 'The 240 × 100 image box contains a 240 × 150 cover image. Positioning changes its crop without moving the element.',
  'fill': 'The shapes and paint are explicitly authored. Fill is inherited independently of stroke; controls retain their native accessible names.',
  'stroke': 'Paint, width and paths remain explicit. The values are inherited by the actual shapes, including the icon inside a native control.',
  'stroke-width': 'The 24 × 24 viewBox scales into a 96 × 96 viewport. Computed width and final painted thickness are different measurements.',
}

/** Preserve actual image content boxes, SVG viewports and inherited paint. */
export function media(section: ReferenceDemoSection): DemoScene {
  return {
    ...typeSpecimens(section, {
      appearance: 'plain',
      properties: section.id === 'apply-conditionally' && /^(fill|stroke)$/.test(section.page) ? [section.page] : properties[section.page],
      measure: true, caption: captions[section.page],
    }),
    theme: section.id === 'use-theme-colors' || undefined,
  }
}
