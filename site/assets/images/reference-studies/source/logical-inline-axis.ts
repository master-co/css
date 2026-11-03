import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'logical-inline-axis',
  render(theme: Theme) {
    const { text, at, route, finish } = study('logical-inline-axis', theme)
    route('M144 342H272')
    route('M584 200V328')
    return finish(`
      <style>${generatePresetCSS(['px(16)'])}</style>
      ${text(360, 64, 'px(16) → padding-inline: 16px', 'code', 'center')}
      ${text(208, 140, 'horizontal-tb', 'code', 'center')}
      ${text(504, 140, 'vertical-rl', 'code', 'center')}
      ${at(144, 216, '<div class="detail-inline px(16)" style="writing-mode:horizontal-tb"><div></div></div>')}
      ${at(456, 200, '<div class="detail-inline px(16)" style="writing-mode:vertical-rl"><div></div></div>')}
      ${text(208, 364, 'Inline axis', 'note', 'center')}
      ${text(602, 254, 'Inline', 'note')}
      ${text(602, 274, 'axis', 'note')}
      ${text(208, 250, '96 × 96', 'code', 'center')}
      ${text(504, 250, '96 × 96', 'code', 'center')}
      ${text(360, 426, 'Tinted bands are 16px · dashed boundaries enclose content', 'edge', 'center')}
    `)
  }
}
