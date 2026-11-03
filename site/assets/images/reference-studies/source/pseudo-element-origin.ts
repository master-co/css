import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'pseudo-element-origin',
  render(theme: Theme) {
    const { text, at, label, finish } = study('pseudo-element-origin', theme)
    const classes = ['(content:open-quote)::before', '(content:close-quote)::after']
    return finish(`
      <style>${generatePresetCSS(classes)}
        .detail-quote { display:inline-flex; align-items:center; font:400 20px/40px Geist; quotes:'“' '”'; }
        .detail-quote::before,.detail-quote::after { width:56px; flex:none; text-align:center; color:var(--ui-tone-blue); }
        .detail-quote { width:384px; justify-content:space-between; }
      </style>
      ${text(360, 72, 'One originating span', 'eyebrow', 'center')}
      ${text(360, 124, '<span>Keep the interface clear</span>', 'code', 'center')}
      ${at(168, 216, `<span class="detail-quote ${classes.join(' ')}">Keep the interface clear</span>`)}
      ${at(168, 280, `<div class="detail-ruler" style="width:56px">${label('::before', 'code')}</div>`)}
      ${at(224, 280, `<div class="detail-ruler" style="width:272px">${label('Text node', 'note')}</div>`)}
      ${at(496, 280, `<div class="detail-ruler" style="width:56px">${label('::after', 'code')}</div>`)}
      ${text(196, 350, 'open-quote', 'code', 'center')}
      ${text(524, 350, 'close-quote', 'code', 'center')}
      ${text(360, 420, 'Generated content is painted outside the span’s text node', 'edge', 'center')}
    `)
  }
}
