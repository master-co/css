import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'span-includes-gaps',
  render(theme: Theme) {
    const { text, at, label, finish } = study('span-includes-gaps', theme)
    return finish(`
      <style>${generatePresetCSS(['grid-cols(3)', 'gap(16)', 'grid-col-span(2)'])}</style>
      ${text(360, 64, 'Three tracks · two gutters', 'eyebrow', 'center')}
      ${text(360, 104, 'grid-cols(3) gap(16)', 'code', 'center')}
      ${at(200, 162, `<div class="grid-cols(3) gap(16)" style="width:320px">
        <div class="detail-track">${label('96px', 'code')}</div>
        <div class="detail-track">${label('96px', 'code')}</div>
        <div class="detail-track">${label('96px', 'code')}</div>
        <div class="detail-track detail-span grid-col-span(2)">${label('grid-col-span(2)', 'code')}</div>
        <div class="detail-track">${label('96px', 'code')}</div>
      </div>`)}
      ${at(296, 136, '<div class="detail-ruler" style="width:16px"></div>')}
      ${at(408, 136, '<div class="detail-ruler" style="width:16px"></div>')}
      ${text(360, 132, '16px', 'edge', 'center')}
      ${at(200, 306, `<div class="detail-ruler" style="width:208px">${label('96 + 16 + 96 = 208px', 'code')}</div>`)}
      ${at(200, 374, `<div class="detail-ruler" style="width:320px">${label('320px grid', 'note')}</div>`)}
    `)
  }
}
