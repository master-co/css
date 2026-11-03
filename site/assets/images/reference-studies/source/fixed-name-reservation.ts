import { study } from './materials'
import { configuredExampleCSS } from '@master/internal-site/css/configured-example.ts'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'fixed-name-reservation',
  render(theme: Theme) {
    const { text, label, at, finish } = study('fixed-name-reservation', theme)
    return finish(`
      ${text(360, 84, '@theme { --container-full: 12rem; }', 'code', 'center')}
      ${text(204, 166, 'w-full', 'code', 'center')}
      ${text(516, 166, '(width:var(--container-full))', 'code', 'center')}
      <style>${configuredExampleCSS('@theme { --container-full: 12rem; }', ['w-full', '(width:var(--container-full))'])}</style>
      ${at(84, 224, `<div class="width-parent"><div class="width-child w-full">${label('240px', 'code')}</div></div>`)}
      ${at(396, 224, `<div class="width-parent"><div class="width-child (width:var(--container-full))">${label('192px', 'code')}</div></div>`)}
      ${text(204, 320, 'width: 100%', 'code', 'center')}
      ${text(516, 320, 'width: var(--container-full)', 'code', 'center')}
      ${text(204, 358, 'Fixed spelling', 'note', 'center')}
      ${text(516, 358, 'Explicit variable reference', 'note', 'center')}
      ${text(360, 422, 'Same 240px parent · 16px root size', 'edge', 'center')}
    `)
  }
}
