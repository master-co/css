import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'import-reference-output',
  render(theme: Theme) {
    const { text, sheet, row, label, route, scene } = drawing(theme)
    const figure = referenceIllustrations['import-reference-output']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 36, l.file, 'title', 'center')}
      ${sheet(360, 68, undefined, undefined, row(label(l.sourceToken, 'code')) + row(label(l.native, 'code')), 'center')}
      ${text(360, 178, l.shared, 'note', 'center')}
      ${text(192, 240, l.left, 'code', 'center')}
      ${text(528, 240, l.right, 'code', 'center')}
      ${sheet(192, 282, undefined, undefined, row(label(l.output, 'edge')) + row(label(l.token, 'code')) + row(label(l.generated, 'code')) + row(label(l.kept, 'code')), 'center')}
      ${sheet(528, 282, undefined, undefined, row(label(l.output, 'edge')) + row(label(l.token, 'code')) + row(label(l.generated, 'code')) + row(label(l.omitted, 'edge')), 'center')}
      ${route('M360 142V156H192V226')}
      ${route('M360 156H528V226')}
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
