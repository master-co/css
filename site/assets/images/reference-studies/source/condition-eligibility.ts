import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'condition-eligibility',
  render(theme: Theme) {
    const { text, at, label, codeScope, route, finish } = study('condition-eligibility', theme)
    route('M360 238V256H192V285')
    route('M360 256H528V285')
    return finish(`
      ${text(360, 60, 'grid@media(width>=40rem)', 'code', 'center')}
      ${at(360, 104, codeScope('@media (width >= 40rem) {', codeScope('.grid\\@media\\(width\\>\\=40rem\\) {', label('display: grid;', 'code')), 'blue'), 'centered')}
      ${text(192, 298, '39rem viewport', 'title', 'center')}
      ${text(528, 298, '40rem viewport', 'title', 'center')}
      ${text(192, 342, 'Condition is false', 'note', 'center')}
      ${text(528, 342, 'Enters the cascade', 'note', 'center')}
      ${text(360, 408, 'A matching condition does not guarantee the final style', 'edge', 'center')}
    `)
  }
}
