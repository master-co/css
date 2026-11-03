import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'compiled-query-snapshot',
  render(theme: Theme) {
    const { text, label, at, lines, route, finish } = study('compiled-query-snapshot', theme)
    route('M360 164V206')
    route('M360 304V346')
    return finish(`
      ${text(360, 52, 'Expanded once · stored as a concrete query', 'eyebrow', 'center')}
      ${at(360, 102, lines(['@custom-media --md (width >= 64rem);', '@custom-media --max-md not (--md);']), 'centered')}
      ${text(104, 232, 'Compiled manifest', 'note')}
      ${at(330, 224, `<div class="detail-code-group">${lines(['--md: width ≥ 64rem', '--max-md: width < 64rem'])}</div>`)}
      ${text(104, 322, 'Later: replace only --md', 'note')}
      ${text(500, 314, '60rem', 'code', 'center')}
      ${at(330, 360, `<div class="detail-code-group"><div>${label('--md: width ≥ 60rem', 'code')}</div><div class="selected">${label('--max-md: width < 64rem', 'code')}</div></div>`)}
      ${text(104, 382, 'Complement stays put', 'note')}
      ${text(360, 440, 'Redeclare both definitions to move both boundaries', 'edge', 'center')}
    `)
  }
}
