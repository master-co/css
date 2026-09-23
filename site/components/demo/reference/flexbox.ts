import type { DemoScene, ReferenceDemoSection } from './types'
import { label } from './html'
import { paintLayout } from './layout-html'

const sampleNames: Record<string, string[]> = {
  'remember-the-parent-display': ['Block parent', 'Flex parent'],
  'use-content-or-parent-sized-basis-values': ['100% of the container', 'Fit-content basis', 'Max-content basis'],
  'reverse-visual-order': ['Reversed row', 'Reversed column'],
  'change-visual-order': ['Flex items', 'Auto-placed grid items'],
}

/** Paint the authored boxes without providing their flex or grid prerequisites. */
export function flexbox(section: ReferenceDemoSection): DemoScene {
  const { page, id } = section
  const containerProperty = page === 'flex-wrap' || page === 'flex-direction'
  const html = section.html.map((source, index) => {
    const prefix = section.html.length > 1 ? `example-${index}-` : ''
    const measured = source.includes('id="target"') ? 'target' : 'item-1'
    const decorated = paintLayout(source, prefix, index === 0 ? containerProperty ? 'layout' : 'target' : '', measured)
    const comparisonSize = page === 'flex-grow' || page === 'flex-shrink'
      ? `<span>Violet item <output data-size-readout="${prefix}peer">—</output></span>` : ''
    return `<section data-ui="layout-example">${sampleNames[id] ? label(sampleNames[id][index]) : ''}<div data-ui="label"><output data-layout-axis="${prefix}layout">Main axis</output></div>${decorated}<div data-ui="layout-readings"><span>Container <output data-size-readout="${prefix}layout">—</output></span><span>Blue item <output data-size-readout="${prefix}${measured}">—</output></span>${comparisonSize}</div></section>`
  }).join('')
  const captions: Record<string, string> = {
    flex: id === 'remember-the-parent-display' ? 'The children keep the same classes. Only a flex parent lets the blue item participate in flex sizing.' : 'The blue item receives the demonstrated shorthand. The measurements show the actual border boxes after flex sizing.',
    'flex-basis': 'Basis is the starting main-axis size. Compare it with the live border-box measurements after flexing and constraints.',
    'flex-grow': 'Grow factors divide the extra space, not the final widths. Both items keep their authored bases and padding.',
    'flex-shrink': 'The constrained row creates a real shortage of space. Shrink factors and starting bases determine how that shortage is shared.',
    'flex-wrap': id === 'reverse-wrap-direction' ? 'Read the source numbers within each line, then compare how the lines stack. Reversing wrapping does not reverse the items within a line.' : 'Each item keeps a 96px width. The actual container width, gap and wrapping rule decide whether another line is needed.',
    'flex-direction': id === 'reverse-visual-order' ? 'Focus Source 1, then press Tab. The focus sequence follows the DOM even as the visual main axis is reversed.' : 'The annotation follows the actual layout. In horizontal writing, inline runs across the row and block runs down the column.',
    order: id === 'keep-source-order-meaningful' ? 'Focus Source 1, then press Tab. The browser follows the source sequence; CSS order changes only these items’ visual positions.' : 'Lower order values appear first. Equal values keep their source sequence; the blue item remains first in the DOM.',
  }
  const property = page === 'flex-basis' && id === 'prefer-shorthand-for-complete-flex-behavior' ? 'flex' : page
  return { html, caption: captions[page], inspect: [property], sizing: 'content' }
}
