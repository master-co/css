import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'independent-registrations',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('independent-registrations', theme)
    route('M230 181H335')
    route('M230 321H335')
    return finish(`
      ${text(360, 65, 'Separate forms · independent replacement', 'eyebrow', 'center')}
      ${text(96, 166, 'badge', 'code')}
      ${at(356, 131, `${label('Static definition', 'note')}<div class="cut muted">${label('display: inline-block;', 'code')}</div><div class="selected">${label('display: block;', 'code')}</div>`)}
      ${text(96, 306, 'badge(8px)', 'code')}
      ${at(356, 289, `${label('Function definition', 'note')}<br>${label('padding: 8px;', 'code')}`)}
      ${text(360, 413, 'Replacing badge leaves badge(…) available', 'note', 'center')}
    `)
  }
}
