import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'pruning-selector-branches',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('pruning-selector-branches', theme)
    route('M362 201H410')
    route('M362 318H410')
    return finish(`
      ${text(360, 63, '@prune native · used class: card', 'code', 'center')}
      ${text(94, 132, 'Authored selector', 'eyebrow')}
      ${text(432, 132, 'Retained selector', 'eyebrow')}
      ${at(94, 185, `${label('.card, ', 'code')}<span class="cut muted">${label('.unused:hover', 'code')}</span>`)}
      ${at(432, 185, `<div class="selected">${label('.card', 'code')}</div>`)}
      ${at(94, 302, label('.card .title', 'code'))}
      ${at(432, 302, `<div class="selected">${label('.card .title', 'code')}</div>`)}
      ${text(360, 389, 'A comma splits branches; a descendant space does not', 'note', 'center')}
      ${text(360, 428, 'Keeping a selector does not prove a DOM match', 'edge', 'center')}
    `)
  }
}
