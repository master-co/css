import type { DemoScene, ReferenceDemoSection } from './types'
import { classValue, comparison, label, tile } from './html'

const context = (content: string, classes: string, attrs = '') => `<div data-ui="position-context" class="${classValue(classes)}" ${attrs}>${content}</div>`
const quiet = (html: string) => html.replaceAll(' data-target', '')

/** Offsets and containing blocks come from the adjacent authored example. */
export function position(section: ReferenceDemoSection): DemoScene {
  const { id, classLists: lists } = section
  if (id.includes('static') || id.includes('relative')) {
    return {
      html: `${label('Dashed outline · original slot')}<div data-ui="original-slot" class="${classValue(lists[0])}">${tile('Target', lists[1])}</div>${quiet(tile('Next in flow', lists[2], 'violet'))}`,
      caption: id.includes('static') ? 'The inset values are ignored. The target stays inside its original slot.' : 'The target moves 20px right and down. Its original slot and the next box stay in place.',
      height: 250, inspect: ['position', 'top', 'left'],
    }
  }
  if (id.includes('fixed')) {
    return {
      html: `<div class="${classValue(lists[0])}"><input type="search" aria-label="Filter assets" placeholder="Filter assets" data-target data-ui="fixed-search" class="${classValue(lists[1])}"><div data-ui="asset-collection" class="${classValue(lists[2])}">${Array.from({ length: 10 }, (_, i) => tile(`Asset ${String(i + 1).padStart(2, '0')}`, '', i % 2 ? 'neutral' : 'blue')).join('')}</div></div>`,
      caption: 'Scroll inside the preview. The field stays fixed to this iframe viewport while the collection moves beneath it.',
      height: 300, inspect: ['position'],
    }
  }
  if (id.includes('sticky')) {
    return {
      html: `<div data-ui="scroll" class="${classValue(lists[0])}" tabindex="0" aria-label="Scrollable asset list">${quiet(tile('Scroll down', lists[1], 'neutral'))}${tile('Pinned collection', lists[2])}<div data-ui="asset-collection" class="${classValue(lists[3])}">${Array.from({ length: 8 }, (_, i) => tile(`Asset ${i + 1}`, '', 'neutral')).join('')}</div></div>`,
      caption: 'Focus the list and scroll with the arrow keys. The blue row sticks to its top edge after the first row scrolls away.',
      height: 288, inspect: ['position', 'top'],
    }
  }
  const conditional = id === 'apply-conditionally'
  return {
    html: `${label('Containing block · relative parent')}${context(tile(conditional ? 'Focus with Tab' : 'Target', lists[1], 'blue', '', conditional ? 'tabindex="0"' : ''), lists[0])}`,
    caption: conditional ? 'Focus the blue box or widen to sm. Absolute positioning moves it to the parent’s bottom-right corner.' : 'Top and right insets measure from this parent’s padding edge. The child contributes no height to normal flow.',
    height: 244, inspect: conditional ? ['position', 'right', 'bottom'] : ['position', 'top', 'right'],
  }
}

export function inset(section: ReferenceDemoSection): DemoScene {
  const { id, classLists: lists } = section
  const conditional = id === 'apply-conditionally'
  const child = id === 'pin-one-side'
    ? `<button type="button" data-target class="${classValue(lists[1])}">Close</button>`
    : tile(conditional ? 'Focus with Tab' : id === 'center-overlays-with-inset' ? 'Overlay' : 'Inset on all four sides', lists[1], 'blue', '', conditional ? 'tabindex="0"' : '')
  return {
    html: `${label('Dashed boundary · positioned parent')}${context(child, lists[0])}`,
    caption: conditional ? 'The box stretches between four insets. Focus increases the space around it; the viewport condition sets a larger resting inset.' : id === 'pin-one-side' ? 'Only the top and right edges are pinned. The button keeps its content width and height.' : 'Automatic width and height let the opposing insets determine the overlay’s dimensions.',
    inspect: id === 'pin-one-side' ? ['top', 'right'] : ['top', 'right', 'bottom', 'left'], height: 244,
  }
}

function negativeLayer(lists: string[]): DemoScene {
  return {
    html: `<article data-ui="local-card" class="${classValue(lists[0])}">${tile('', lists[1], 'blue', '', 'aria-hidden="true"')}<p>Foreground content</p></article>`,
    caption: 'The isolated parent contains the negative layer. The blue decoration paints above the parent’s surface and behind its text.',
    inspect: ['z-index'], height: 208,
  }
}

export function stacking(section: ReferenceDemoSection): DemoScene {
  const { id, classLists: lists } = section
  if (id.includes('negative')) return negativeLayer(lists)
  const layer = (text: string, classes: string, tone: string) => tile(text, classes, tone, 'display:grid;align-content:end;text-align:right;padding:4px 12px')
  if (id.includes('local')) {
    return {
      html: `${label('Context 0 contains child 99 · sibling 1 paints above both')}${context(`<article data-ui="local-context" class="${classValue(lists[1])}">${tile('Child 99', lists[2], 'blue', 'text-align:left')}</article>${layer('Sibling 1', lists[3], 'violet')}`, lists[0])}`,
      caption: 'Z-index values are compared within their own stacking context. Raising the child to 99 cannot lift its parent above sibling 1.', sizing: 'content',
    }
  }
  const conditional = id === 'apply-conditionally'
  return {
    html: `${label(conditional ? 'Blue target · violet comparison' : 'Larger z-index paints above smaller values')}${context(conditional
      ? tile('Focus with Tab', lists[1], 'blue', '', 'tabindex="0"') + quiet(layer('Layer 10', lists[2], 'violet'))
      : lists.slice(1).map((value, index) => layer(`Layer ${30 - index * 10}`, value, index === 1 ? 'violet' : index === 2 ? 'neutral' : 'blue')).join(''), lists[0])}`,
    caption: conditional ? 'Focus the blue box to bring it forward. Widening to sm gives it the same higher paint order.' : 'All three boxes are absolute children of one isolated parent. Their visible edges reveal the paint order.',
    inspect: ['z-index'], sizing: 'content',
  }
}

export function isolation(section: ReferenceDemoSection): DemoScene {
  const { id, classLists: lists } = section
  if (id === 'protect-layered-components') return negativeLayer(lists)
  const conditional = id === 'apply-conditionally'
  const sample = (baseline: boolean) => `<div data-ui="isolation-backdrop" class="${classValue(lists[0])}"><section${baseline ? '' : ' data-target'} class="${classValue(baseline ? 'isolation:auto' : lists[1])}"${conditional && !baseline ? ' tabindex="0"' : ''}><div data-ui="blend-layer" class="${classValue(lists[2])}">${conditional && !baseline ? 'Focus with Tab' : 'Blend layer'}</div></section></div>`
  return {
    html: comparison([{ name: 'Automatic · external blend', content: sample(true) }, { name: 'With class', content: sample(false) }]),
    caption: 'Both blue backgrounds sit outside the tested section. An isolated section prevents its purple child from blending with that external backdrop.',
    inspect: ['isolation'], sizing: 'content',
  }
}
