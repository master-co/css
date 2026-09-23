import type { DemoScene, ReferenceDemoSection } from './types'
import { label } from './html'
import { paintLayout } from './layout-html'

const comparisons: Record<string, string[]> = {
  'center-wrapped-lines': ['Wrapped flex lines', 'Fixed grid tracks'],
  'align-to-the-start-or-end': ['Start edges', 'End edges'],
  'stretch-children': ['Explicit container height', 'Height from a sibling'],
  'align-items-on-the-main-axis': ['Flex items', 'Fixed grid columns'],
  'start-center-or-end-a-group': ['Start', 'Center', 'End', 'Center in a column'],
  'distribute-extra-space': ['Space between', 'Space around', 'Space evenly'],
  'use-explicit-css-values': ['Safe · overflowing', 'Unsafe · overflowing', 'Safe · content fits'],
  'align-one-item-on-both-axes': ['End on both axes', 'Block end · inline start'],
}

/** The portable HTML owns every alignment prerequisite and minimum-size constraint. */
export function alignment(section: ReferenceDemoSection): DemoScene {
  const { page, id } = section
  const self = page.endsWith('-self')
  const html = section.html.map((source, index) => {
    const prefix = section.html.length > 1 ? `example-${index}-` : ''
    const target = `${prefix}${self ? 'target' : 'layout'}`
    const grid = /class="grid(?: |")/.test(source)
    const axis = page.startsWith('place') ? 'both' : page.startsWith('align') ? 'cross' : 'main'
    const subject = page.endsWith('-content') ? grid ? 'Grid tracks' : page.startsWith('align') ? 'Flex lines' : 'Flex items' : grid ? 'Grid items' : 'Flex items'
    const painted = paintLayout(source, prefix, index === 0 ? self ? 'target' : 'layout' : '')
    const tracks = grid ? `<span>Columns <output data-style-readout="${prefix}layout" data-style-property="grid-template-columns">—</output></span>` : ''
    return `<section data-ui="layout-example">${comparisons[id] ? label(comparisons[id][index]) : ''}<div data-ui="label">${subject} · <output data-alignment-axis="${prefix}layout" data-axis-kind="${axis}">—</output></div>${painted}<div data-ui="layout-readings"><span>Container <output data-size-readout="${prefix}layout">—</output></span><span>Blue item <output data-size-readout="${prefix}target">—</output></span><span>Blue offset <output data-position-readout="${prefix}target" data-position-origin="${prefix}layout">—</output></span>${tracks}<span>${page} <output data-style-readout="${target}" data-style-property="${page}">—</output></span></div></section>`
  }).join('')
  const captions: Record<string, string> = {
    'align-content': 'The container has room beyond the authored lines or tracks. Alignment distributes that remaining space; it does not change the fixed item heights.',
    'align-items': id === 'align-text-baselines' ? 'Different text sizes share a first baseline. Compare the text positions, rather than the outer box edges.' : 'Compare the blue item with the violet sibling. Automatic sizes can stretch; explicit sizes keep their dimensions.',
    'align-self': 'The blue item overrides the parent’s default. Its sibling follows the parent alignment in the same flex line.',
    'justify-content': id === 'use-explicit-css-values' ? 'The overflow is real and scrollable. Safe centering preserves access to the start; unsafe centering loses the portion before the scrollport.' : 'The authored items or tracks leave actual free space. Compare their starting offsets and the spaces between them.',
    'justify-items': 'Two equal grid columns keep their track sizes. Alignment changes each item’s inline position or automatic width inside its own area.',
    'justify-self': 'The blue item moves inside the first column. The violet item keeps the parent’s default in the second column.',
    'place-content': 'The fixed track group moves within the larger grid container. Its column widths, row heights and minimum gaps stay unchanged.',
    'place-items': 'Each item aligns within its own grid area. Stretch applies only to dimensions that remain automatic.',
    'place-self': 'The blue item has a local alignment override. The violet sibling follows the parent’s two-axis default in its own grid area.',
  }
  return { html, caption: captions[page], sizing: 'content' }
}
