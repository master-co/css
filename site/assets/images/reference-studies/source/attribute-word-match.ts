import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'attribute-word-match',
  render(theme: Theme) {
    const { text, label, at, finish } = study('attribute-word-match', theme)
    const values = [['css', true, true], ['master css', false, true], ['css-in-js', false, false]] as const
    return finish(`
      ${text(360, 72, 'Exact value vs a whitespace-separated word', 'eyebrow', 'center')}
      ${at(100, 148, `<div class="detail-table" style="grid-template-columns:184px 156px 132px">
        <div>${label('title value', 'note')}</div><div>${label('[title=css]', 'code')}</div><div>${label('[title~=css]', 'code')}</div>
        ${values.map(([value, exact, word]) => `<div>${label('"' + value + '"', 'code')}</div>${[exact, word].map(matches => `<div class="${matches ? 'detail-result' : ''}">${label(matches ? 'Match' : '—', 'body')}</div>`).join('')}`).join('')}
      </div>`)}
      ${text(360, 420, 'The hyphens in css-in-js are not whitespace boundaries', 'edge', 'center')}
    `)
  }
}
