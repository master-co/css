import type { ReferenceDemoSection } from './types'

export const prose = 'Good tools make room for clear thinking. Arrange the canvas, explore a small detail, and see how each decision changes the whole composition.'
export const longText = 'Design systems give teams a shared language for building thoughtful interfaces. A clear hierarchy helps people find what matters, while consistent spacing makes each relationship easier to understand.'
export const artwork = '/demo/landscape.svg'
export const mask = '/demo/mask.svg'

export function escape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function classValue(value = '') {
  return escape(value.replaceAll('/hero.jpg', artwork).replaceAll('/mask.png', mask).replaceAll('/marker.svg', '/demo/marker.svg'))
}

export function tile(label: string, classes = '', tone = 'blue', style = '', attributes = '') {
  return `<div data-ui="tile" data-tone="${tone}"${classes ? ' data-target' : ''} class="${classValue(classes)}"${style ? ` style="${escape(style)}"` : ''}${attributes ? ` ${attributes}` : ''}>${label}</div>`
}

export function label(text: string) { return `<div data-ui="label">${escape(text)}</div>` }

export function specimen(content: string, classes = '', attrs = '') {
  return `<div data-target class="${classValue(classes)}" ${attrs}>${content}</div>`
}

export function samples(section: ReferenceDemoSection): string[] {
  return section.classLists.filter(Boolean)
}

export function comparison(samples: { name: string, content: string }[]) {
  return `<div data-ui="comparison">${samples.map(sample => `<section>${label(sample.name)}${sample.content}</section>`).join('')}</div>`
}

export function image(classes = '', attrs = '') {
  return `<img${classes ? ' data-target' : ''} src="${artwork}" alt="Sun above layered mountains" class="${classValue(classes)}" ${attrs}>`
}

export function numbered(count = 4, classes = '') {
  return Array.from({ length: count }, (_, index) => tile(String(index + 1).padStart(2, '0'), classes, index === 1 ? 'violet' : 'blue')).join('')
}
