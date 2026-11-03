import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'token-dependency-chain',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('token-dependency-chain', theme)
    route('M188 182H282')
    route('M392 222V284')
    return finish(`
      ${text(360, 70, 'Follow references from the used class', 'eyebrow', 'center')}
      ${text(96, 172, 'fg-action', 'code')}
      ${at(300, 146, `<div class="selected">${label('--color-action', 'code')}<br>${label('var(--color-brand)', 'code')}</div>`)}
      ${at(300, 294, `<div class="selected">${label('--color-brand', 'code')}<br>${label('#175cff', 'code')}</div>`)}
      ${at(80, 296, `<div class="muted">${label('--color-unused', 'code')}<br>${label('No usage root', 'note')}</div>`)}
      ${text(360, 416, 'The connected token declarations are delivered in theme', 'note', 'center')}
    `)
  }
}
