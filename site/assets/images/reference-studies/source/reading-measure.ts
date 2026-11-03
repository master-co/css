import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'reading-measure',
  render(theme: Theme) {
    const { text, at, label, finish } = study('reading-measure', theme)
    const paragraph = 'Clear interfaces give each idea enough space. A comfortable text measure keeps related words together and helps readers follow the next line.'
    return finish(`
      ${text(360, 68, 'Same paragraph · same type · different measure', 'eyebrow', 'center')}
      ${at(88, 134, `<div class="detail-ruler" style="width:176px">${label('176px', 'code')}</div>`)}
      ${at(328, 134, `<div class="detail-ruler" style="width:304px">${label('304px', 'code')}</div>`)}
      ${at(88, 196, `<p data-label class="detail-reading" style="width:176px">${paragraph}</p>`)}
      ${at(328, 196, `<p data-label class="detail-reading" style="width:304px">${paragraph}</p>`)}
      ${text(360, 424, '14px Geist / 24px line height · content determines height', 'edge', 'center')}
    `)
  }
}
