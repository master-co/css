import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'contents-default-vs-empty',
  render(theme: Theme) {
    const { text, label, at, codeScope, route, finish } = study('contents-default-vs-empty', theme)
    for (const y of [238, 310, 382]) route(`M376 ${y}H438`)
    return finish(`
      ${at(360, 56, codeScope('@mixin --panel {', codeScope('@contents {', label('display: grid;', 'code'))), 'centered')}
      ${text(92, 194, 'Call site', 'eyebrow')}
      ${text(460, 194, 'Inserted declarations', 'eyebrow')}
      ${text(92, 228, '@apply --panel;', 'code')}
      ${at(460, 224, `<div class="detail-kept">${label('display: grid;', 'code')}</div>`)}
      ${text(92, 300, '@apply --panel {}', 'code')}
      ${at(460, 286, `<div class="detail-empty">${label('No declarations', 'note')}</div>`)}
      ${at(92, 358, codeScope('@apply --panel {', label('display: flex;', 'code')))}
      ${at(460, 368, `<div class="insert">${label('display: flex;', 'code')}</div>`)}
    `)
  }
}
