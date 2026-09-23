import type { DemoScene, ReferenceDemoSection } from './types'
import { label } from './html'
import { paintLayout } from './layout-html'

const properties: Record<string, string[]> = {
  width: ['width'], height: ['height'], size: ['inline-size', 'block-size'],
  'min-width': ['min-width'], 'min-height': ['min-height'], 'min-size': ['min-inline-size', 'min-block-size'],
  'max-width': ['max-width'], 'max-height': ['max-height'], 'max-size': ['max-inline-size', 'max-block-size'],
  'aspect-ratio': ['aspect-ratio'], gap: ['row-gap', 'column-gap'], margin: ['margin'], padding: ['padding'],
}

/** The displayed HTML owns every dimension, constraint, gap and content item. */
export function sizing(section: ReferenceDemoSection): DemoScene {
  const { page, id } = section
  const viewportHeight = ['use-viewport-and-intrinsic-values', 'build-viewport-sections', 'use-viewport-caps'].includes(id)
  const responsive = page === 'width' && id === 'use-container-widths-for-wrappers'
    || page === 'max-width' && id === 'use-viewport-and-container-caps'
  const html = section.html.map((source, index) => {
    const prefix = section.html.length > 1 ? `example-${index}-` : ''
    const layout = `${prefix}layout`, target = `${prefix}target`, content = `${prefix}item-3`
    const title = source.match(/^<!-- ([^>]+) -->/)?.[1]
    const subject = page === 'gap' ? layout : target
    const style = properties[page].map(property => `<span>${property} <output data-style-readout="${subject}" data-style-property="${property}" data-round-pixels>—</output></span>`).join('')
    const contentReading = page === 'padding' ? `<span>Content <output data-size-readout="${content}">—</output></span><span>Content inset <output data-position-readout="${content}" data-position-origin="${target}">—</output></span>` : ''
    const scroll = page === 'max-height' && source.includes('tabindex="0"') ? `<span>Scroll <output data-scroll-readout="${target}">—</output></span>` : ''
    const position = page === 'margin' ? `<span>Blue offset <output data-position-readout="${target}" data-position-origin="${layout}">—</output></span>` : ''
    const readingSpace = page === 'min-height' && id === 'let-content-define-the-final-size' && index === 0 ? ' class="mt:xl"' : ''
    return `<section data-ui="layout-example">${title ? label(title) : ''}${paintLayout(source, prefix, index === 0 ? page === 'gap' ? 'layout' : 'target' : '')}<div data-ui="layout-readings"${readingSpace}><span>Parent <output data-size-readout="${layout}">—</output></span><span>Blue box <output data-size-readout="${target}">—</output></span>${style}${contentReading}${position}${scroll}</div></section>`
  }).join('')
  const captions: Record<string, string> = {
    width: 'The dashed outline is the authored containing block. Read the actual blue border-box width alongside its parent.',
    height: viewportHeight ? 'This is a real 320px-tall viewport. Scroll inside it to compare the viewport-based and content-based heights.' : 'The parent and blue box are measured separately. Percentage height needs a definite reference in these normal-flow examples.',
    size: 'Measurements report physical width × height. Logical inline and block dimensions follow the writing mode.',
    'min-width': 'Compare the preferred width with its actual lower bound. The blue measurement includes padding but excludes its decorative outline.',
    'min-height': viewportHeight ? 'The blue minimum is 100% of this 320px viewport. Scroll inside to reach the lower edge; the frame does not grow with its content.' : 'A minimum establishes a floor. Real content can make the blue box taller than that floor.',
    'min-size': 'The two minimums constrain each axis independently. Their values do not force the final box to be square.',
    'max-width': 'The maximum limits the preferred width. A viewport cap, a parent percentage and a theme token use different references.',
    'max-height': 'The blue box is measured independently of its content. Named scroll regions keep excess content reachable with a keyboard or pointer.',
    'max-size': 'Equal maximums do not imply equal final dimensions. Read the physical size alongside its logical limits.',
    'aspect-ratio': 'The ratio is a preferred constraint. An automatic dimension can follow it; two definite dimensions take precedence.',
    gap: 'The parent owns the gaps. The colored children have no margins; extra space at the outer edge is not a gap.',
    margin: 'Margin is outside the painted blue border box. The dashed parent shows its actual position and surrounding space.',
    padding: 'Blue surrounds the neutral content. The content inset reports physical left and top padding; the padding value lists the physical sides.',
  }
  return { html, caption: captions[page], height: viewportHeight ? 320 : undefined, sizing: viewportHeight ? 'viewport' : 'content', responsive: responsive || undefined, inspect: id === 'apply-conditionally' ? [] : undefined }
}
