import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '../../../rendering-modes/source/materials'

/** Follow actual URL references: publishing the entry does not publish its dependencies. */
export default {
  id: 'stylesheet-asset-graph',
  render(theme: Theme) {
    const { text, sheet, row, label, icon, route, scene } = drawing(theme)
    const figure = referenceIllustrations['stylesheet-asset-graph']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 40, l.group, 'eyebrow', 'center')}
      ${sheet(72, 88, undefined, undefined, row(icon('fileCode') + label(l.entry, 'code')) + row(label(l.import, 'code')))}
      ${sheet(240, 215, undefined, undefined, row(icon('fileCode') + label(l.child, 'code')) + row(label(l.image, 'code')))}
      ${sheet(444, 342, undefined, undefined, row(icon('file') + label(l.resource, 'code')) + row(label(l.resourceKind, 'note')))}
      ${route('M104 162V236Q104 244 112 244H236')}
      ${route('M272 289V363Q272 371 280 371H440')}
      ${text(360, 442, l.scope, 'note', 'center')}
    `)
  }
}
