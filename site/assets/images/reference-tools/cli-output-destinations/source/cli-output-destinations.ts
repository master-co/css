import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '../../../rendering-modes/source/materials'

export default {
  id: 'cli-output-destinations',
  render(theme: Theme) {
    const { text, sheet, row, label, rule, route, scene } = drawing(theme)
    const figure = referenceIllustrations['cli-output-destinations']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 42, l.source, 'note', 'center')}
      ${sheet(360, 78, undefined, undefined, row(label(l.command,'code')), 'center')}
      ${route('M360 138V160H188V194')}
      ${route('M360 160H532V194')}
      ${text(188, 212, l.stdout, 'code', 'center')}
      ${text(532, 212, l.files, 'code', 'center')}
      ${sheet(188, 268, undefined, undefined, row(label(l.stream,'title'))+row(label(l.css,'code'))+row(label(l.noFiles,'edge')), 'center')}
      ${sheet(532, 268, undefined, undefined, row(label(l.directory,'title'))+rule+row(label(l.entry,'code'))+row(label(l.styles,'edge'))+row(label(l.resources,'edge')), 'center')}
      ${text(532, 406, l.publish, 'note', 'center')}
      ${text(360, 448, l.scope, 'edge', 'center')}
    `)
  }
}
