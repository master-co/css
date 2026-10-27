import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'shape-outside': ['shape-outside'],
  'shape-margin': ['shape-outside', 'shape-margin'],
  'shape-image-threshold': ['shape-outside', 'shape-image-threshold'],
}

const captions: Record<string, string> = {
  'shape-outside': 'The artwork and float box are explicit. Shape-outside changes the space available to adjacent inline content without clipping the artwork.',
  'shape-margin': 'The same painted circle and ordinary margins are preserved. Shape-margin expands the wrap boundary within the float’s margin box.',
  'shape-image-threshold': 'Image paint is unchanged. The browser extracts the wrap shape from pixels whose alpha exceeds the threshold; a basic shape uses its own geometry.',
}

/** Keep actual float placement, inline flow and image-alpha geometry in authored HTML. */
export function shapes(section: ReferenceDemoSection): DemoScene {
  return typeSpecimens(section, {
    appearance: 'plain', properties: properties[section.page],
    measure: true, caption: captions[section.page],
  })
}
