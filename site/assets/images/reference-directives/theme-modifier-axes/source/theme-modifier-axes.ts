import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '../../../rendering-modes/source/materials'

export default {
  id: 'theme-modifier-axes',
  render(theme: Theme) {
    const { text, label, scene } = drawing(theme)
    const figure = referenceIllustrations['theme-modifier-axes']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>
        .modifier-matrix { display:grid; grid-template-columns:auto repeat(2,minmax(0,1fr)); gap:12px 20px; width:636px; }
        .modifier-matrix > .axis { align-self:center; }
        .modifier-cell { display:grid; gap:8px; padding:12px; border:1px solid var(--ui-line-divider); border-radius:var(--ui-radius-md); background:var(--ui-surface-sheet); }
        .modifier-cell > div { display:grid; gap:4px; }
        .modifier-cell .code { font-size:12px; }
        .modifier-matrix .column { justify-self:center; }
      </style>
      ${text(360, 40, l.source, 'note', 'center')}
      <div class="modifier-matrix" style="left:42px;top:90px">
        <span></span>${l.columns.map(c=>`<span class="column">${label(c,'title')}</span>`).join('')}
        ${[0,1].map(r=>`<span class="axis">${label(l.rows[r],'note')}</span>${[0,1].map(c=>{const i=r*2+c;return `<div class="modifier-cell">${label([l.ordinary,l.inline,l.static,l.both][i],'code')}<div>${label(l.emitted,'edge')}${label(l.tokens[i],'code')}</div><div>${label(l.background,'edge')}${label(c?l.literal:l.value,'code')}</div></div>`}).join('')}`).join('')}
      </div>
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
