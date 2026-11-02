import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'pruning-file-boundary',
  render(theme: Theme) {
    const { text, sheet, row, label, rule, route, scene } = drawing(theme)
    const figure = referenceIllustrations['pruning-file-boundary']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(206, 36, l.app, 'title', 'center')}
      ${text(530, 36, l.output, 'title', 'center')}
      ${sheet(206, 70, undefined, undefined, row(label(l.directive,'code'))+row(label(l.import,'code'))+rule+row(label(l.local,'code'))+row(label(l.unused,'code')), 'center')}
      ${sheet(530, 122, undefined, undefined, row(label(l.local,'code')), 'center')}
      ${text(530, 188, l.removed, 'edge', 'center')}
      ${route('M346 156H452')}
      ${text(206, 268, l.cards, 'title', 'center')}
      ${sheet(206, 300, undefined, undefined, row(label(l.policy,'edge'))+row(label(l.card,'code'))+row(label(l.unusedCard,'code')), 'center')}
      ${sheet(530, 312, undefined, undefined, row(label(l.card,'code'))+row(label(l.unusedCard,'code')), 'center')}
      ${route('M346 352H422')}
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
