import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Compare identical markup under two separate compilations, changing only inline.
// Nested boundaries are DOM scopes. Literal blue/plum sample paint is the computed result;
// root labels describe computed custom properties, not values precomputed by Master CSS.
export default {
  id: 'inline-resolution',
  render(theme: Theme) {
    const { text, sheet, row, label, variableScope, scene } = drawing(theme)
    const figure = referenceIllustrations['inline-resolution']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(196, 40, l.ordinary, 'code', 'center')}
      ${text(524, 40, l.inline, 'code', 'center')}
      ${sheet(196, 74, undefined, undefined, row(label(l.property, 'code')) + row(label(l.ordinaryValue, 'code')), 'center')}
      ${sheet(524, 74, undefined, undefined, row(label(l.property, 'code')) + row(label(l.inlineValue, 'code')), 'center')}
      ${variableScope(196, 174, false, l)}
      ${variableScope(524, 174, true, l)}
      ${text(360, 438, l.invariant, 'edge', 'center')}
    `)
  }
}
