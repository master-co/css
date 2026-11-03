import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'padding-coverage',
  render(theme: Theme) {
    const { text, label, at, finish } = study('padding-coverage', theme)
    return finish(`
      <style>${generatePresetCSS(['p(24)', 'pt(8)'])}</style>
      ${text(360, 76, 'Same content · one side changes', 'eyebrow', 'center')}
      ${text(204, 150, 'p(24)', 'code', 'center')}
      ${text(516, 150, 'p(24) pt(8)', 'code', 'center')}
      ${at(108, 218, `<div class="padding-sample p(24)"><div class="sample-content">${label('Content', 'body')}</div></div>`)}
      ${at(420, 234, `<div class="padding-sample p(24) pt(8)"><div class="sample-content">${label('Content', 'body')}</div></div>`)}
      ${text(204, 193, 'Top: 24px', 'edge', 'center')}
      ${text(516, 209, 'Top: 8px', 'edge', 'center')}
      ${text(204, 354, '24px on all sides', 'note', 'center')}
      ${text(516, 354, 'Other sides stay 24px', 'note', 'center')}
      ${text(360, 418, 'Content baselines and lower edges stay aligned', 'edge', 'center')}
    `)
  }
}
