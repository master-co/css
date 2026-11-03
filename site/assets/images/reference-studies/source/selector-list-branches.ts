import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'selector-list-branches',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('selector-list-branches', theme)
    route('M360 140V176H210V212')
    route('M360 176H510V212')
    route('M210 256V302H360V346')
    route('M510 256V302H360', { arrow: false })
    return finish(`
      ${text(360, 76, 'underline:hover,:focus-visible', 'code', 'center')}
      ${text(360, 113, 'One class owner', 'note', 'center')}
      ${at(210, 218, `<div class="branch-label">${label(':hover', 'code')}</div>`, 'centered')}
      ${at(510, 218, `<div class="branch-label">${label(':focus-visible', 'code')}</div>`, 'centered')}
      ${text(360, 268, 'Either branch', 'edge', 'center')}
      ${text(360, 360, 'text-decoration-line: underline', 'code', 'center')}
      ${text(360, 414, 'The owner is repeated in each emitted selector', 'note', 'center')}
    `)
  }
}
