import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'parameter-known-vs-live',
  render(theme: Theme) {
    const { text, label, at, codeScope, lines, route, finish } = study('parameter-known-vs-live', theme)
    for (const y of [248, 320, 392]) route(`M360 ${y}H420`)
    return finish(`
      ${at(360, 62, codeScope('@utility pair(--size) {', lines(['width: var(--size);', 'height: var(--size);'])), 'centered')}
      ${text(84, 206, 'Class input', 'eyebrow')}
      ${text(444, 206, 'Result', 'eyebrow')}
      ${text(84, 238, 'pair(2rem)', 'code')}
      ${at(444, 226, `<div class="detail-kept">${lines(['width: 2rem;', 'height: 2rem;'])}</div>`)}
      ${text(84, 310, 'pair(var(--size))', 'code')}
      ${text(444, 310, 'Rejected: live argument', 'note')}
      ${text(84, 382, '(width:var(--size))', 'code')}
      ${at(444, 378, `<div class="insert">${label('width: var(--size);', 'code')}</div>`)}
      ${text(360, 436, 'Native declaration keeps the variable live in the browser', 'edge', 'center')}
    `)
  }
}
