import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'definition-replacement',
  render(theme: Theme) {
    const { text, sheet, row, label, codeScope, route, scene } = drawing(theme)
    const figure = referenceIllustrations['definition-replacement']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(192, 58, l.first, 'note', 'center')}
      ${text(528, 58, l.second, 'title', 'center')}
      ${sheet(192, 96, undefined, undefined, codeScope(l.open, row(label(l.color,'code'))+row(label(l.padding,'code'))), 'center')}
      ${sheet(528, 96, undefined, undefined, codeScope(l.open, row(label(l.replacement,'code'))), 'center')}
      ${route('M314 160H390')}
      ${route('M528 210V262H360V284', { emphasis:true })}
      ${text(172, 288, l.output, 'note', 'center')}
      ${sheet(360, 300, undefined, undefined, codeScope(l.selector,row(label(l.replacement,'code'))), 'center')}
      ${text(558, 342, l.absent, 'edge', 'center')}
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
