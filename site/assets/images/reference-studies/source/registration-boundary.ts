import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'registration-boundary',
  render(theme: Theme) {
    const { text, label, at, codeScope, route, finish } = study('registration-boundary', theme)
    route('M202 216V264')
    return finish(`
      ${text(360, 62, 'The declaration is identical; its registration context changes', 'note', 'center')}
      ${at(202, 136, codeScope('@theme {', label('--spacing-card: 1.5rem;', 'code'), 'blue'), 'centered')}
      ${at(518, 136, codeScope(':root {', label('--spacing-card: 1.5rem;', 'code')), 'centered')}
      ${text(202, 280, 'p-card is registered', 'title', 'center')}
      ${text(518, 280, 'No p-card registration', 'note', 'center')}
      ${text(360, 370, '(padding:var(--spacing-card))', 'code', 'center')}
      ${text(360, 409, 'An explicit native reference works with either definition', 'note', 'center')}
    `)
  }
}
