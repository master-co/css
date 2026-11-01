import { reuseIllustration } from '../../../../content/guide/reusing-styles/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

export default {
  id: 'shared-and-local',
  render(theme: Theme) {
    const { sheet, row, icon, label, text, route, scene } = drawing(theme)
    const l = reuseIllustration.labels
    return scene(reuseIllustration.title, reuseIllustration.alt, `
      ${sheet(56, 72, 264, 104,
        row(icon('layers') + label(l.component))
        + label(l.componentClass, 'code')
        + label(l.componentScope, 'note'))}
      ${sheet(432, 72, 232, 104,
        row(icon('code') + label(l.utility))
        + label(l.utilityClass, 'code')
        + label(l.utilityScope, 'note'))}

      ${route('M188 176V260', { arrow: false })}
      ${text(200, 226, l.shared, 'edge')}
      ${route('M188 260V330')}
      ${route('M188 260H352Q360 260 360 268V372Q360 380 368 380H430')}
      ${route('M548 176V330')}
      ${text(560, 226, l.local, 'edge')}

      ${sheet(56, 332, 264, 96,
        row(icon('fileCode') + label(l.first))
        + label(l.firstMarkup, 'code')
        + label(l.firstResult, 'note'))}
      ${sheet(432, 332, 232, 96,
        row(icon('fileCode') + label(l.second))
        + label(l.secondMarkup, 'code')
        + label(l.secondResult, 'note'))}
    `)
  }
}
