import { generatePresetCSS } from '../../../../common/generate-preset-css'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

export default {
  id: 'direct-number-units',
  render(theme: Theme) {
    const { text, label, scene } = drawing(theme)
    const figure = referenceIllustrations['direct-number-units']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['p(12)', 'grow(1)', 'grow(2)', 'basis(0)', 'min-w(0)'])}
        .direct-inset { width:max-content; background:color-mix(in oklch,var(--ui-tone-blue) 14%,transparent); outline:1px solid var(--ui-line-divider); border-radius:var(--ui-radius-md); }
        .direct-content { padding:16px 28px; background:var(--ui-surface-sheet); border-radius:var(--ui-radius-xs); }
        .direct-flex { display:flex; gap:12px; width:252px; }
        .direct-flex > div { padding-block:16px; text-align:center; background:color-mix(in oklch,var(--ui-tone-violet) 10%,transparent); border-radius:var(--ui-radius-md); }
        .inset-measure { position:absolute; left:0; bottom:-20px; width:12px; height:5px; border:1px solid var(--ui-tone-blue); border-top:0; }
        .inset-measure > .edge { position:absolute; top:12px; left:0; color:var(--ui-tone-blue); }
      </style>
      ${text(204, 108, l.left, 'code', 'center')}
      ${text(516, 108, l.right, 'code', 'center')}
      ${text(204, 146, l.leftOutput, 'code', 'center')}
      ${text(516, 146, l.rightOutput, 'code', 'center')}
      <div class="direct-inset p(12) anchor-center" style="left:204px;top:216px"><div class="direct-content">${label(l.content, 'title')}</div><div class="inset-measure">${label(l.inset, 'edge')}</div></div>
      <div class="direct-flex" style="left:390px;top:228px"><div class="grow(1) basis(0) min-w(0)">${label('1', 'title')}</div><div class="grow(2) basis(0) min-w(0)">${label('2', 'title')}</div></div>
      ${text(516, 324, l.basis, 'edge', 'center')}
      ${text(360, 432, l.scope, 'edge', 'center')}
    `)
  }
}
