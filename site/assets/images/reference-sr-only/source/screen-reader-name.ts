import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'screen-reader-name',
  render(theme: Theme) {
    const { text, label, route, scene } = drawing(theme)
    const figure = referenceIllustrations['screen-reader-name']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['sr-only'])}
        .name-source .code { display:block; }
        .name-control { display:flex; align-items:center; justify-content:center; width:40px; height:40px; border:1px solid var(--ui-line-mark); border-radius:var(--ui-radius-md); background:var(--ui-surface-sheet); color:var(--ui-text-strong); text-decoration:none; font-size:20px; }
      </style>
      ${text(48, 96, l.source, 'note')}
      <div class="name-source code-scope" style="left:48px;top:152px">${label(l.open, 'code')}<div class="code-scope-body">${label(l.icon, 'code')}${label(l.clipped, 'code')}<div class="code-scope-body">${label(l.name, 'code')}</div>${label(l.closeSpan, 'code')}</div>${label(l.close, 'code')}</div>
      ${text(448, 96, l.visual, 'note')}
      <a class="name-control" href="#customize" style="left:448px;top:144px"><span aria-hidden="true">↓</span><span class="sr-only">${l.name}</span></a>
      ${text(448, 268, l.accessible, 'note')}
      ${text(448, 306, l.role, 'code')}
      ${text(448, 334, l.name, 'body')}
      ${route('M340 212H392V164H430')}
      ${route('M392 212V316H430')}
      ${text(360, 432, l.scope, 'edge', 'center')}
    `)
  }
}
