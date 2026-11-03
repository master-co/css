import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'border-ingredients',
  render(theme: Theme) {
    const { text, label, at, lines, finish } = study('border-ingredients', theme)
    // A native baseline must not outrank the generated utility layer.
    const specimens = [ ['b-line-divider', 'Color'], ['b-line-divider b(2)', '+ width'], ['b-line-divider b(2) b-solid', '+ style'] ]
    return finish(`
      <style>@layer base { .detail-border { border-style:none; } } .detail-border { border-style:revert-layer; } ${generatePresetCSS(['b-line-divider', 'b(2)', 'b-solid'])}</style>
      ${text(360, 76, 'Add one border ingredient at a time', 'eyebrow', 'center')}
      ${specimens.map(([classes, title], i) => {
        const x = 84 + i * 204
        return `${text(x + 72, 144, title, 'title', 'center')}
          ${at(x, 194, `<div class="detail-border detail-specimen ${classes}">${label(i === 2 ? 'Visible border' : 'No border', 'body')}</div>`)}
          ${at(x + 72, 322, lines(classes.split(' ')), 'centered')}`
      }).join('')}
      ${text(360, 428, 'Same 144 × 96 border box · starting style: none', 'edge', 'center')}
    `)
  }
}
