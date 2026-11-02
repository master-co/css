import { sassIllustration as figure } from '../../../../content/guide/migration/sass/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Two source languages meet only after Sass becomes ordinary CSS.
export default {
  id: 'compiler-boundary',
  render(theme: Theme) {
    const { scene, sheet, row, icon, rule, label, chip, text, route } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${sheet(183, 48, undefined, undefined, row(icon('fileCode') + label(l.sassFile)) + rule + label(l.sassDefinition, 'code') + label(l.sassUse, 'code'), 'center')}
      ${route('M183 180V203')}${chip(183, 219, undefined, 'cpu', l.sass).replace('class="chip"', 'class="chip anchor-center"')}
      ${route('M183 260V284')}
      ${sheet(183, 303, undefined, undefined, row(icon('file') + label(l.legacy)) + rule + label(l.selector, 'code') + label(l.declaration, 'code') + label(l.close, 'code'), 'center')}
      ${sheet(525, 48, undefined, undefined, row(icon('fileCode') + label(l.app)) + rule + label(l.import, 'code') + label(l.masterDefinition, 'code'), 'center')}
      ${route('M525 180V312')}
      ${route('M282 365H422V343H450')}
      ${chip(525, 326, undefined, 'cpu', l.master).replace('class="chip"', 'class="chip anchor-center"')}
      ${route('M525 367V401')}${text(525, 420, l.output, 'note', 'center')}
    `)
  }
}
