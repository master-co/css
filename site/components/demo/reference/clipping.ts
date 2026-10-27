import type { DemoScene, ReferenceDemoSection } from './types'
import { classValue, comparison, label } from './html'

/** The frame and content dimensions are taken from the displayed HTML. */
export function overflow(section: ReferenceDemoSection): DemoScene {
  const { id, classLists: lists } = section
  if (id === 'truncate-a-single-line') return {
    html: `${label('224px available width')}<div data-ui="truncate" data-target class="${classValue(lists[0])}">A very long file name that should not widen the toolbar</div>`,
    caption: 'The browser paints an ellipsis inside the constrained block. The complete label remains in the document.',
    inspect: ['overflow', 'white-space', 'text-overflow'], sizing: 'content',
  }
  const content = (classes: string) => `<div data-ui="overflow-content" class="${classValue(classes)}"><span>01 · Start</span><span>02 · End</span></div>`
  if (id === 'create-a-scroll-container') return {
    html: comparison([
      { name: 'Vertical collection', content: `<div data-ui="overflow-frame" data-target class="${classValue(lists[0])}" tabindex="0" aria-label="Vertical collection">${content(lists[1])}</div>` },
      { name: 'Horizontal collection', content: `<div data-ui="overflow-frame" class="${classValue(lists[2])}" tabindex="0" aria-label="Horizontal collection">${content(lists[3])}</div>` },
    ]).replace('data-ui="comparison"', 'data-ui="comparison" data-scenario="scroll-containers"'),
    caption: 'Focus either real scroll container and use the arrow keys. Each child overflows only along the direction being demonstrated.', sizing: 'content',
  }
  const conditional = id === 'apply-conditionally'
  return {
    html: `${conditional ? label('Resize for scrolling · print for visible overflow') : '<div data-ui="scroll-actions" role="group" aria-label="Programmatic scroll"><button type="button" data-scroll-container="overflow-sample" data-scroll-edge="end">Scroll to end</button><button type="button" data-scroll-container="overflow-sample" data-scroll-edge="start">Reset</button></div>'}<div id="overflow-sample" data-ui="overflow-frame" data-target class="${classValue(lists[0])}">${content(lists[1])}</div>`,
    caption: conditional ? 'The authored screen condition enables native scrolling. Print preview preserves the full overflowing content.' : id === 'clip-without-scrolling' ? 'The buttons call the same native scroll API as the hidden example. Clip remains at its original scroll position.' : 'Scroll to end reveals the hidden lower-right corner. Reset returns to the initial view.',
    inspect: ['overflow-x', 'overflow-y'], height: conditional ? 316 : 268,
  }
}
