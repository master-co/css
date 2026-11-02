import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Reader question: which direction wins once importance is known?
// One ordered list and opposing arrows show reversal; the separated unlayered entry is not a sixth layer.
// Scope is author stylesheet rules, not inline declarations, other origins, animations or transitions.
export default {
  id: 'layer-precedence',
  render(theme: Theme) {
    const { text, priorityStack, route, scene } = drawing(theme)
    const figure = referenceIllustrations['layer-precedence']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(360, 48, l.heading, 'note', 'center')}
      ${priorityStack(360, 112, l.layers, l.unlayered)}
      ${text(130, 218, l.normal, 'title', 'center')}
      ${text(590, 218, l.important, 'code', 'center')}
      ${text(220, 92, l.weaker, 'edge', 'center')}
      ${text(220, 356, l.stronger, 'edge', 'center')}
      ${text(500, 92, l.stronger, 'edge', 'center')}
      ${text(500, 356, l.weaker, 'edge', 'center')}
      ${route('M220 128 V340', { emphasis: true })}
      ${route('M500 340 V128', { emphasis: true })}
      ${text(360, 402, l.direction, 'note', 'center')}
      ${text(360, 432, l.scope, 'edge', 'center')}
    `)
  }
}
