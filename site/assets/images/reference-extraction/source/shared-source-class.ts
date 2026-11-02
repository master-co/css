import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Reader question: why can CSS stay unchanged after a source is removed?
// A removed file has no dependency edge. The surviving file keeps the same exact class and its rule.
// This is current ownership, not a claim that past class discoveries accumulate forever.
export default {
  id: 'shared-source-class',
  render(theme: Theme) {
    const { text, sourceContribution, sheet, codeScope, label, route, scene } = drawing(theme)
    const figure = referenceIllustrations['shared-source-class']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(220, 68, l.removed, 'note', 'center')}
      ${text(500, 68, l.live, 'title', 'center')}
      ${sourceContribution(220, 106, l.first, l.source, true)}
      ${sourceContribution(500, 106, l.second, l.source)}
      ${route('M500 190 V218 Q500 228 490 228 H370 Q360 228 360 238 V278', { emphasis: true })}
      ${text(214, 242, l.output, 'note', 'center')}
      ${sheet(360, 290, undefined, undefined, codeScope(l.selector, label(l.declaration, 'code')), 'center')}
      ${text(360, 396, l.dependency, 'note', 'center')}
      ${text(360, 430, l.lifetime, 'edge', 'center')}
    `)
  }
}
