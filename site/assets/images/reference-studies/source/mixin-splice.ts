import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'mixin-splice',
  render(theme: Theme) {
    const { text, label, lines, at, codeScope, route, finish } = study('mixin-splice', theme)
    route('M335 268H385')
    return finish(`
      ${text(360, 52, '--caption: font-size + line-height', 'note', 'center')}
      ${text(196, 124, 'Authored rule', 'eyebrow', 'center')}
      ${text(526, 124, 'Expanded rule', 'eyebrow', 'center')}
      ${at(68, 181, codeScope('.caption {', `${label('color: currentColor;', 'code')}<div class="slot">${label('@apply --caption;', 'code')}</div>${label('font-weight: 600;', 'code')}`))}
      ${at(402, 181, codeScope('.caption {', `${label('color: currentColor;', 'code')}<div class="insert">${lines(['font-size: 14px;', 'line-height: 1.5;'])}</div>${label('font-weight: 600;', 'code')}`))}
      ${text(360, 406, 'The call is replaced in place; the surrounding order survives', 'note', 'center')}
    `)
  }
}
