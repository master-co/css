import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'layer-token-separation',
  render(theme: Theme) {
    const { text, label, at, finish } = study('layer-token-separation', theme)
    return finish(`
      ${text(360, 74, 'p-md@layer(defaults)', 'code', 'center')}
      ${at(360, 151, `<div class="layer-band">${label('theme', 'eyebrow')}${label(':root, :host', 'code')}<br>${label('--spacing-md: 1rem;', 'code')}</div><div class="layer-band">${label('defaults', 'eyebrow')}${label('The generated class rule', 'note')}<br>${label('padding: var(--spacing-md);', 'code')}</div>`, 'centered')}
      ${text(360, 419, 'One style rule · its dependency stays in theme', 'note', 'center')}
    `)
  }
}
