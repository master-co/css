import type { DemoScene, ReferenceDemoSection } from './types'
import { typeSpecimens } from './type-specimens'

const properties: Record<string, string[]> = {
  border: ['border-width', 'border-style', 'border-color'],
  'border-color': ['border-color', 'border-width'],
  'border-style': ['border-style', 'border-width'],
  'border-width': ['border-width', 'box-sizing'],
  'border-radius': ['border-radius'],
  outline: ['outline-width', 'outline-style', 'outline-color'],
  'outline-color': ['outline-color', 'color'],
  'outline-style': ['outline-style', 'outline-width'],
  'outline-width': ['outline-width', 'outline-style'],
  'outline-offset': ['outline-offset', 'outline-width'],
  'box-shadow': ['box-shadow'],
}
const captions: Record<string, string> = {
  border: 'Border readings use CSS shorthand order. The measured box includes its padding and borders.',
  'border-color': 'Border color changes paint independently of width and style. Transparent edges still occupy their used border width.',
  'border-style': 'The browser reports both the style and used border width. None and hidden remove used width on these ordinary boxes.',
  'border-width': 'Compare the resolved edge widths with the measured outer box. Box sizing determines whether the border fits within the declared dimensions.',
  'border-radius': 'Compare the painted corners with the measured layout box. Radius, aspect ratio and overflow are separate properties.',
  outline: 'Outlines paint around the box without adding layout space. Use the actual keyboard focus state to inspect conditional treatments.',
  'outline-color': 'The outline has an explicitly authored width and style. Current color follows the same element’s foreground.',
  'outline-style': 'Style and used width are separate readings. Dedicated style utilities preserve the other outline components.',
  'outline-width': 'The readout reports this browser’s resolved width, including native keywords. The measured layout box excludes the outline.',
  'outline-offset': 'Offset moves the painted ring without changing the layout dimensions. The surrounding space keeps outward outlines visible.',
  'box-shadow': 'These are the browser’s actual shadow layers. The measured box excludes their paint; theme tokens may resolve differently in each mode.',
}

/** Preserve the complete authored edge, focus and theme prerequisites. */
export function edges(section: ReferenceDemoSection): DemoScene {
  const { page, id } = section
  const observed = page === 'border-radius' && id === 'create-an-icon-button' ? ['border-radius', 'aspect-ratio']
    : page === 'border-radius' && id === 'use-a-radius-token' ? ['border-radius', 'overflow'] : properties[page]
  return {
    ...typeSpecimens(section, { appearance: 'plain', measure: true, properties: observed, caption: captions[page] }),
    theme: page === 'box-shadow' || page === 'border-color' && id === 'customize-line-colors',
  }
}
