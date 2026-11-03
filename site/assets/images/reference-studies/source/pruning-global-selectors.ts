import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'pruning-global-selectors',
  render(theme: Theme) {
    const { text, at, label, finish } = study('pruning-global-selectors', theme)
    const rows = [[':root', 'No class selector', true], ['body', 'No class selector', true], ['.card', 'Class used', true], ['.unused', 'Class not used', false]] as const
    return finish(`
      ${text(360, 60, '@prune native', 'code', 'center')}
      ${text(360, 100, 'Scanned class: card', 'note', 'center')}
      ${at(116, 162, `<div class="detail-table" style="grid-template-columns:100px 208px 132px">
        ${rows.map(([selector, reason, kept]) => `<div class="${kept ? '' : 'detail-removed'}">${label(selector, 'code')}</div><div>${label(reason, 'note')}</div><div><span class="${kept ? 'detail-kept' : ''}">${label(kept ? 'Retained' : 'Removed', 'body')}</span></div>`).join('')}
      </div>`)}
      ${text(360, 432, 'Class usage filtering is not a complete browser selector analysis', 'edge', 'center')}
    `)
  }
}
