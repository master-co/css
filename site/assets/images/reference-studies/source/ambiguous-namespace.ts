import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'ambiguous-namespace',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('ambiguous-namespace', theme)
    route('M360 133V168H204V206')
    route('M360 168H516V206')
    route('M204 272V320H516V272', { arrow: false })
    return finish(`
      ${text(360, 94, 'font-brand', 'code', 'center')}
      ${at(204, 217, `<div class="selected">${label('--font-family-brand', 'code')}<br>${label('monospace', 'note')}</div>`, 'centered')}
      ${at(516, 217, `<div class="insert">${label('--font-size-brand', 'code')}<br>${label('2rem', 'note')}</div>`, 'centered')}
      ${at(360, 341, `<div class="barrier">${label('AMBIGUOUS_TOKEN', 'code')}<br>${label('No rule is emitted', 'note')}</div>`, 'centered')}
      ${text(360, 430, 'Two matching keys are an ambiguity, not a combined font recipe', 'edge', 'center')}
    `)
  }
}
