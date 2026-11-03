import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'preserve-wins',
  render(theme: Theme) {
    const { text, at, lines, route, finish } = study('preserve-wins', theme)
    route('M208 292V322')
    route('M512 292V322')
    return finish(`
      ${text(360, 68, 'Reverse the order · keep the same result', 'eyebrow', 'center')}
      ${[false, true].map((reverse, index) => {
        const x = 208 + index * 304
        const directives = ['@preserve native;', '@prune native;']
        if (reverse) directives.reverse()
        return `${at(x, 144, `<div class="detail-code-group">${lines(directives)}<div style="margin-top:16px">${lines(['.widget {', '  display: grid;', '}'])}</div></div>`, 'centered')}
          ${at(x, 342, `<div class="detail-kept">${lines(['.widget { display: grid; }'])}</div>`, 'centered')}`
      }).join('')}
      ${text(360, 426, 'No widget class is scanned · native delivery remains enabled', 'edge', 'center')}
    `)
  }
}
