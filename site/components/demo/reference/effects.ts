import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  'filter': ['filter'],
  'backdrop-filter': ['backdrop-filter'],
  'clip-path': ['clip-path'],
  'mask-image': ['mask-image', 'mask-mode'],
  'mix-blend-mode': ['mix-blend-mode'],
  'opacity': ['opacity', 'background-color'],
}
const captions: Record<string, string> = {
  'filter': 'The source and its dimensions are explicit. Filters change the painted group; the measured layout box stays unchanged.',
  'backdrop-filter': 'The complete composition supplies the backdrop and panel. Filtering changes pixels behind the panel, while its own text remains sharp.',
  'clip-path': 'The outer outline marks the original box. Clipping changes paint and hit testing without changing layout dimensions.',
  'mask-image': 'The mask changes painted opacity. The CSS box keeps its dimensions and hit area; annotations remain outside the mask.',
  'mix-blend-mode': 'The explicitly isolated group contains both backdrops. Foreground geometry and source colors are identical in each comparison.',
  'opacity': 'Opacity changes the entire painted group. Native controls keep their names and keyboard behavior; color alpha changes only that color.',
}

/** Preserve authored source paint, compositing groups and native interaction. */
export function effects(section: ReferenceDemoSection): DemoScene {
  return typeSpecimens(section, {
    appearance: 'plain', properties: properties[section.page],
    measure: true, caption: captions[section.page],
  })
}
