import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  content: ['content'],
  'counter-increment': ['counter-increment'],
  'counter-reset': ['counter-reset'],
  'counter-set': ['counter-set', 'counter-increment'],
  'list-style': ['list-style-type', 'list-style-position', 'list-style-image'],
  'list-style-image': ['list-style-image', 'list-style-type', 'list-style-position'],
  'list-style-position': ['list-style-position', 'list-style-type'],
  'list-style-type': ['list-style-type', 'list-style-position', 'list-style-image'],
}
const captions: Record<string, string> = {
  content: 'The readout observes the actual ::after pseudo-element. The link remains a native, keyboard-accessible anchor with meaningful text in the HTML.',
  'counter-increment': 'The first heading or item supplies the reported increment. The visible prefixes are resolved by the browser’s native counter, not inserted numbers.',
  'counter-reset': 'The readout reports the scope’s initial counter declaration. Each item then changes the value before its generated prefix is painted.',
  'counter-set': 'The readout follows the element that sets the counter. Reset, increment and set are separate operations; following elements continue from the resulting value.',
  'list-style': 'The authored list keeps real list items and explicit room for outside markers. Read all three properties to see the shorthand’s complete effect.',
  'list-style-image': 'These are native image markers. The image takes precedence over the type; the type remains available when the image is absent or unavailable.',
  'list-style-position': 'Identical content and width reveal the wrapped-line alignment. Marker position is independent of the surrounding label and property readout.',
  'list-style-type': 'Marker appearance does not change the list’s HTML meaning. The readout distinguishes the requested type from a potentially overriding image.',
}

/** Keep counter scopes, descendant selectors and semantic list structure exactly as authored. */
export function typography(section: ReferenceDemoSection): DemoScene {
  if (!properties[section.page]) throw new Error(`Unassigned typography recipe: ${section.page}#${section.id}`)
  return typeSpecimens(section, {
    properties: properties[section.page], caption: captions[section.page],
    appearance: 'plain', pseudo: section.page === 'content' ? '::after' : undefined,
  })
}
