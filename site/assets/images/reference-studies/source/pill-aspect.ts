import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'pill-aspect',
  render(theme: Theme) {
    const { text, at, label, finish } = study('pill-aspect', theme)
    return finish(`
      <style>${generatePresetCSS(['pill'])}</style>
      ${text(360, 76, 'One radius · two aspect ratios', 'eyebrow', 'center')}
      ${text(208, 152, '64 × 64', 'code', 'center')}
      ${text(496, 152, '192 × 64', 'code', 'center')}
      ${at(176, 216, '<div class="detail-rounded pill" style="width:64px"></div>')}
      ${at(400, 216, '<div class="detail-rounded pill" style="width:192px"></div>')}
      <svg style="left:144px;top:216px" width="480" height="64"><path class="axis" d="M0 0H480M0 64H480" stroke-dasharray="3 5"/></svg>
      ${at(176, 308, `<div class="detail-ruler" style="width:64px">${label('Circle', 'note')}</div>`)}
      ${at(400, 308, `<div class="detail-ruler" style="width:192px">${label('Capsule', 'note')}</div>`)}
      ${text(360, 394, 'pill → border-radius: calc(infinity * 1px)', 'code', 'center')}
    `)
  }
}
