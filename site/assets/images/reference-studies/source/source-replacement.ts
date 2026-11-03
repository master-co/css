import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'source-replacement',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('source-replacement', theme)
    route('M360 213V284')
    return finish(`
      ${text(360, 66, 'Rescan one source: card.html', 'eyebrow', 'center')}
      ${text(114, 165, 'Before', 'note')}
      ${at(360, 144, `<div class="set">${label('p-sm', 'code')}${label('r-md', 'code')}</div>`, 'centered')}
      ${text(378, 240, 'Replace contribution', 'edge')}
      ${text(114, 322, 'After', 'note')}
      ${at(360, 301, `<div class="set"><span class="added">${label('p-lg', 'code')}</span>${label('r-md', 'code')}</div>`, 'centered')}
      ${text(360, 418, 'p-sm is released unless another source or safelist retains it', 'note', 'center')}
    `)
  }
}
