import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'suffix-ownership',
  render(theme: Theme) {
    const { text, codeParts, annotation, leader, finish } = study('suffix-ownership', theme)
    return finish(`
      ${text(360, 105, 'Two HTML classes', 'eyebrow', 'center')}
      ${codeParts(360, 186, [
        { id: 'head', value: 'p(12)', tone: 'blue' },
        { id: 'state', value: ':hover', tone: 'violet' },
        { id: 'query', value: '@sm', tone: 'amber' },
        { id: 'importance', value: '!', tone: 'blue' },
        { value: '   r-md' }
      ])}
      ${annotation(126, 300, 'head-note', 'Padding', '12px', 'blue')}
      ${annotation(282, 300, 'state-note', 'State', 'Owner is hovered', 'violet')}
      ${annotation(450, 300, 'query-note', 'Condition', 'sm and above', 'amber')}
      ${annotation(594, 300, 'importance-note', 'Importance', 'Padding only', 'blue')}
      ${leader('head', 'head-note', 248, 'blue')}
      ${leader('state', 'state-note', 236, 'violet')}
      ${leader('query', 'query-note', 254, 'amber')}
      ${leader('importance', 'importance-note', 270, 'blue')}
      ${text(360, 408, 'r-md has no state, condition or importance suffix', 'note', 'center')}
    `)
  }
}
