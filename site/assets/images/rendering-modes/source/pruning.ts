import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'pruning',
  render(theme: Theme) {
    const { row, label, icon, sheet, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.pruning.labels
    return scene(deliveryFlow('pruning').title, deliveryFlowDescription('pruning'), `
      ${sheet(148, 72, undefined, undefined, row(icon('fileCode') + label(l.usage)) + label(l.classes, 'note'), 'center')}
      ${route('M248 108H470')}
      ${sheet(572, 72, undefined, undefined, row(icon('fileCode') + label(l.entry)) + label(l.entryPolicy, 'code'), 'center')}

      ${route('M572 144V200', { arrow: false })}
      ${route('M572 200H156Q148 200 148 208V246')}
      ${route('M572 200V246')}
      ${text(360, 178, l.imports, 'edge', 'center')}
      ${sheet(148, 248, undefined, undefined, row(icon('fileCode') + label(l.local)) + label(l.localPolicy, 'code') + label(l.used, 'body'), 'center')}
      ${sheet(572, 248, undefined, undefined, row(icon('fileCode') + label(l.external)) + label(l.default, 'note') + label(l.all, 'body'), 'center')}
      ${text(360, 384, l.policy, 'note', 'center')}
    `)
  }
}
