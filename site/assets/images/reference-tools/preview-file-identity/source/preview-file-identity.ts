import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'preview-file-identity',
  render(theme: Theme) {
    const { text, sheet, row, label, route, scene } = drawing(theme)
    const figure = referenceIllustrations['preview-file-identity']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 40, l.preview, 'title', 'center')}
      ${sheet(360, 78, undefined, undefined, row(label(l.original,'code'))+row(label(l.proposal,'edge')), 'center')}
      ${route('M360 164V186H190V214')}
      ${route('M360 186H530V214')}
      ${text(190, 232, l.left, 'note', 'center')}
      ${text(530, 232, l.right, 'note', 'center')}
      ${text(190, 264, l.original, 'code', 'center')}
      ${text(530, 264, l.changed, 'code', 'center')}
      ${route('M190 294V320')}
      ${route('M530 294V320')}
      ${sheet(190, 336, undefined, undefined, row(label(l.apply,'title'))+row(label(l.applied,'code'))+row(label(l.leftEnd,'edge')), 'center')}
      ${sheet(530, 336, undefined, undefined, row(label(l.reject,'title'))+row(label(l.kept,'code'))+row(label(l.rightEnd,'edge')), 'center')}
      ${text(360, 448, l.scope, 'edge', 'center')}
    `)
  }
}
