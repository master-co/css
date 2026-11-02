import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'compiler-output-ownership',
  render(theme: Theme) {
    const { text, sheet, row, label, route, scene } = drawing(theme)
    const figure = referenceIllustrations['compiler-output-ownership']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 24, l.source, 'title', 'center')}
      ${text(360, 54, l.token, 'code', 'center')}
      ${text(360, 82, l.native, 'code', 'center')}
      ${text(360, 130, l.compile, 'code', 'center')}
      ${route('M360 162V180H182V208')}
      ${route('M360 180H520V208')}
      ${sheet(182, 228, undefined, undefined, row(label(l.css,'title'))+row(label(l.card,'code')), 'center')}
      ${sheet(520, 228, undefined, undefined, row(label(l.manifest,'title'))+row(label(l.definition,'edge')), 'center')}
      ${route('M520 310V326')}
      ${text(520, 344, l.render, 'code', 'center')}
      ${text(520, 374, l.input, 'code', 'center')}
      ${text(182, 350, l.generated, 'note', 'center')}
      ${text(182, 382, l.rule, 'code', 'center')}
      ${route('M398 390H270')}
      ${text(360, 448, l.scope, 'edge', 'center')}
    `)
  }
}
