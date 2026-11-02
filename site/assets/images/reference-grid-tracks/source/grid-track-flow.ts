import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'grid-track-flow',
  render(theme: Theme) {
    const { text, label, scene } = drawing(theme)
    const figure = referenceIllustrations['grid-track-flow']
    const l = figure.labels
    const tiles = Array.from({ length: 6 }, (_, index) => `<div class="track-tile">${label(String(index + 1), 'title')}</div>`).join('')
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['grid-cols(3)', 'grid-rows(3)'])}
        .track-grid { gap:12px; }
        .track-tile { padding:12px; text-align:center; font-variant-numeric:tabular-nums; border-radius:var(--ui-radius-md); background:var(--ui-surface-sheet); box-shadow:0 0 0 1px var(--ui-line-divider); }
      </style>
      ${text(360, 64, l.shared, 'note', 'center')}
      ${text(204, 142, l.left, 'code', 'center')}
      ${text(516, 142, l.right, 'code', 'center')}
      <div class="track-grid grid-cols(3)" style="left:84px;top:190px;width:240px">${tiles}</div>
      <div class="track-grid grid-rows(3)" style="left:438px;top:190px;width:156px">${tiles}</div>
      ${text(204, 372, l.leftFlow, 'edge', 'center')}
      ${text(516, 372, l.rightFlow, 'edge', 'center')}
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
