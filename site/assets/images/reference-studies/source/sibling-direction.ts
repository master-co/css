import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'sibling-direction',
  render(theme: Theme) {
    const { text, label, at, finish } = study('sibling-direction', theme)
    const row = (all: boolean) => `<div class="siblings">${['Link A', 'Owner', 'Link B', 'Link C'].map((name, index) => `<div class="sibling ${index === 1 ? 'owner' : index === 2 || (all && index === 3) ? 'target' : ''}">${label(name, 'body')}</div>`).join('')}</div>`
    return finish(`
      ${text(360, 62, 'One parent · siblings in document order', 'eyebrow', 'center')}
      ${text(80, 126, 'underline+a', 'code')}
      ${at(360, 158, row(false), 'centered')}
      ${text(80, 272, 'underline~a', 'code')}
      ${at(360, 304, row(true), 'centered')}
      ${text(360, 420, 'Earlier siblings are outside both selections', 'note', 'center')}
    `)
  }
}
