import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'reference-no-roots',
  render(theme: Theme) {
    const { text, label, at, lines, route, finish } = study('reference-no-roots', theme)
    route('M360 184V212H196V256')
    route('M360 212H516V256')
    return finish(`
      ${text(360, 48, 'One reference · two local usage cases', 'eyebrow', 'center')}
      ${at(360, 94, `<div class="detail-code-group">${lines(['@theme { --color-accent: teal; }', '.remote { color: var(--color-accent); }'])}
        <div style="margin-top:12px">${label('Definitions available · native rule not delivered', 'note')}</div></div>`, 'centered')}
      ${text(196, 272, 'No local consumer', 'title', 'center')}
      ${text(516, 272, '.local uses the token', 'title', 'center')}
      ${at(196, 318, `<div class="detail-empty">${label('No output from this reference', 'note')}</div>`, 'centered')}
      ${at(516, 310, `<div class="detail-kept">${lines([':root,:host {', '  --color-accent: teal; }', '.local { color:', '  var(--color-accent); }'])}</div>`, 'centered')}
      ${text(360, 436, 'The referenced .remote rule is absent in both outputs', 'edge', 'center')}
    `)
  }
}
