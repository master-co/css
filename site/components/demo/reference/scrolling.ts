import type { DemoScene, ReferenceDemoSection } from './types'
import { classValue, comparison, label } from './html'

const positionReadout = (id: string) => `<output data-scroll-readout="${id}">x 0 · y 0 px</output>`
const scrollActions = (content: string) => `<div data-ui="scroll-actions" role="group" aria-label="Scroll destinations">${content}</div>`
const destination = (id: string, name: string) => `<button type="button" data-scroll-to="${id}">${name}</button>`

/** Keep all layout, overflow and snap prerequisites in the portable authored HTML. */
function decorate(html: string, target: string) {
  return html.replace(/<(div|section|article|header|nav|a)(\s[^>]*|)>/g, (tag: string, element: string, attributes: string) => {
    const id = attributes.match(/\bid="([^"]+)"/)?.[1]
    const ui = id === 'scrollport' ? 'scrollport'
      : id && /^(?:overview|details|resources|panel-\d)$/.test(id) ? 'scroll-panel'
        : element === 'header' ? 'scroll-header' : element === 'nav' ? 'scroll-actions' : undefined
    const href = element === 'a' && attributes.match(/\bhref="#([\w-]+)"/)?.[1]
    return `<${element}${attributes}${ui ? ` data-ui="${ui}"` : ''}${id === target ? ' data-target' : ''}${href ? ` data-scroll-to="${href}"` : ''}>`
  })
}

export function overscroll(section: ReferenceDemoSection): DemoScene {
  const horizontal = section.id === 'keep-horizontal-gestures-local'
  const sample = (baseline: boolean) => {
    const prefix = baseline ? 'auto' : 'class'
    const outer = `${prefix}-outer`, inner = `${prefix}-inner`
    const html = section.html[0]
      .replace('id="outer-scroll"', `id="${outer}" data-ui="nested-outer"`)
      .replace('id="inner-scroll"', `id="${inner}" data-ui="nested-inner"${baseline ? ' style="overscroll-behavior:auto"' : ' data-target'}`)
      .replace(/<div class="([^\"]+)">(Inner collection|Outer collection continues)<\/div>/g, (_, classes: string, text: string) => `<div data-ui="nested-content" class="${classValue(classes)}">${text}<span aria-hidden="true">${text.startsWith('Inner') ? 'Inner end' : 'Outer end'}</span></div>`)
    return `${scrollActions(`<button type="button" data-scroll-container="${inner}" data-scroll-edge="end">Inner to end</button><button type="button" data-scroll-container="${outer}" data-scroll-edge="start">Reset outer</button>`)}${html}<div data-ui="scroll-readings"><span>Inner ${positionReadout(inner)}</span><span>Outer ${positionReadout(outer)}</span></div>`
  }
  return {
    html: comparison([{ name: 'Automatic · allows chaining', content: sample(true) }, { name: 'With class', content: sample(false) }]).replace('data-ui="comparison"', 'data-ui="comparison" data-scenario="nested-scrolling"'),
    caption: horizontal ? 'Send the inner track to its right edge, then scroll horizontally over it. The outer x value exposes whether the gesture chains.' : 'Send the inner list to its bottom edge, then continue scrolling over it. Compare the outer y value; the iframe keeps both experiments separate from the document.',
    inspect: ['overscroll-behavior-x', 'overscroll-behavior-y'], sizing: 'content',
  }
}

export function scrolling(section: ReferenceDemoSection): DemoScene {
  const { page, id } = section
  const source = section.html[0]
  const panels = source.includes('id="panel-1"')
  const target = page === 'scroll-margin' ? panels ? 'panel-2' : 'details'
    : page === 'scroll-snap-align' ? id === 'disable-item-snapping' ? 'panel-2' : 'panel-4' : page === 'scroll-snap-stop' ? 'panel-2' : 'scrollport'
  let controls = source.includes('<nav') ? '' : scrollActions(panels
    ? (source.includes('id="panel-6"') ? [1, 2, 4, 6] : [1, 2, 3, 4]).map(index => destination(`panel-${index}`, `Panel ${index}`)).join('')
    : destination('overview', 'Overview') + destination('details', 'Details') + destination('resources', 'Resources'))
  if (page === 'scroll-snap-stop') {
    controls = scrollActions('<button type="button" data-scroll-container="scrollport" data-scroll-edge="start">Reset</button><button type="button" data-scroll-by="scrollport" data-scroll-distance="600">Advance</button>')
  }
  const captions: Record<string, string> = {
    'scroll-behavior': id === 'keep-static-output-immediate' ? 'Choose a destination to make an immediate native jump.' : 'Choose a destination to trigger native navigation. Smooth timing belongs to the browser; reduced motion keeps navigation immediate.',
    'scroll-margin': 'The blue target owns the scroll margin. Choose it to inspect the inset; its layout size and the spacing between items stay unchanged.',
    'scroll-padding': 'The scroll container owns the viewing inset. Choose an interior target to see its alignment without reaching the track’s boundary.',
    'scroll-snap-align': id === 'disable-item-snapping' ? 'The second panel remains in the layout but supplies no snap position. The other panels keep their start-aligned stops.' : 'Choose Panel 4 or scroll the track. Snap alignment determines where the selected item settles within the viewing area.',
    'scroll-snap-stop': 'Reset, then Advance by the same immediate 600px request. Always stops a directional scroll at the next eligible point; normal allows it to pass.',
    'scroll-snap-type': id === 'apply-conditionally' ? 'Resize to change both the track direction and snapping axis. The panels use the same responsive classes as the displayed HTML.' : 'Scroll the actual track. Mandatory requires an available stop; proximity leaves the browser discretion about nearby positions.',
  }
  const inset = page === 'scroll-margin' || page === 'scroll-padding'
    ? `<span>Target inset <output data-scroll-offset="${panels ? 'panel-2' : 'details'}" data-scrollport="scrollport" data-scroll-axis="${panels ? 'x' : 'y'}">—</output></span>` : ''
  const property = page === 'scroll-margin' ? panels ? 'scroll-margin-left' : 'scroll-margin-top'
    : page === 'scroll-padding' ? panels ? 'scroll-padding-left' : 'scroll-padding-top' : page
  return {
    html: `${controls}${decorate(source, target)}<div data-ui="scroll-readings"><span>Scroll ${positionReadout('scrollport')}</span>${inset}</div>${page === 'scroll-snap-stop' ? label('Advance is a relative scroll request; direct endpoint navigation can skip a stop.') : ''}`,
    caption: captions[page], inspect: [property], sizing: 'content',
  }
}
