import { referenceIllustrations } from '../../../../../reference/illustrations'
import { drawing, type Theme } from '../../../rendering-modes/source/materials'

export default {
  id: 'scanning-two-filters',
  render(theme: Theme) {
    const { text, sheet, row, label, rule, route, sourceContribution, scene } = drawing(theme)
    const figure = referenceIllustrations['scanning-two-filters']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(150, 48, l.sources, 'title', 'center')}
      ${sourceContribution(150, 90, l.main, l.classes)}
      ${sourceContribution(150, 268, l.draft, l.excluded, true)}
      ${text(150, 356, l.excludedHint, 'edge', 'center')}
      ${text(400, 48, l.candidates, 'title', 'center')}
      ${sheet(400, 90, undefined, undefined, row(label(l.collected,'code'))+rule+row(label(l.add,'code'))+row(label(l.remove,'code')), 'center')}
      ${route('M250 134H294')}
      ${route('M400 216V372H486')}
      ${text(556, 308, l.result, 'note', 'center')}
      ${sheet(556, 348, undefined, undefined, row(label(l.output,'code')), 'center')}
      ${text(360, 438, l.scope, 'edge', 'center')}
    `)
  }
}
