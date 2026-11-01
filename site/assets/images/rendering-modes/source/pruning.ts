import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'pruning',
  render(theme: Theme) {
    const { row, label, icon, sheet, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.pruning.labels
    return scene(deliveryFlow('pruning').title, deliveryFlowDescription('pruning'), `
      ${sheet(48, 72, 200, 72, row(icon('fileCode') + label(l.usage)) + label(l.classes, 'note'))}
      ${route('M248 108H470')}
      ${sheet(472, 72, 200, 72, row(icon('fileCode') + label(l.entry)) + label(l.entryPolicy, 'code'))}

      ${route('M572 144V200', { arrow: false })}
      ${route('M572 200H156Q148 200 148 208V246')}
      ${route('M572 200V246')}
      ${text(360, 178, l.imports, 'edge', 'center')}
      ${sheet(48, 248, 200, 96, row(icon('fileCode') + label(l.local)) + label(l.localPolicy, 'code') + label(l.used, 'body'))}
      ${sheet(472, 248, 200, 96, row(icon('fileCode') + label(l.external)) + label(l.default, 'note') + label(l.all, 'body'))}
      ${text(360, 384, l.policy, 'note', 'center')}
    `)
  }
}
