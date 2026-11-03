import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'contents-insertion',
  render(theme: Theme) {
    const { text, label, at, codeScope, route, finish } = study('contents-insertion', theme)
    route('M360 245V297')
    return finish(`
      ${text(360, 52, 'underline@apply(--hocus)', 'code', 'center')}
      ${at(360, 106, codeScope('@mixin --hocus {', codeScope('&:is(:hover, :focus-visible) {', `<div class="slot">${label('@contents;', 'code')}</div>`, 'violet')), 'centered')}
      ${at(360, 311, codeScope('&:is(:hover, :focus-visible) {', `<div class="insert">${label('text-decoration-line: underline;', 'code')}</div>`, 'violet'), 'centered')}
      ${text(360, 434, '& abbreviates the emitted class owner in this placement diagram', 'edge', 'center')}
    `)
  }
}
