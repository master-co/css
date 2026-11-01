import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'pruning-scope',
  render(theme: Theme) {
    const { row, rule, label, icon, sheet, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations['pruning-scope'].labels
    return scene(deliveryFlow('pruning-scope').title, deliveryFlowDescription('pruning-scope'), `
      ${sheet(360, 80, undefined, undefined, row(icon('fileCode') + label(l.shared)) + label(l.policy, 'code') + rule + label(l.sharedCard, 'code') + label(l.sharedOnlyB, 'code'), 'center')}
      ${route('M360 212V248', { arrow: false })}
      ${route('M360 248H188Q180 248 180 256V302')}
      ${route('M360 248H532Q540 248 540 256V302')}
      ${text(170, 268, l.aUsage, 'edge', 'end')}
      ${text(550, 268, l.bUsage, 'edge')}
      ${sheet(180, 304, undefined, undefined, row(icon('file') + label(l.aOutput)) + label(l.aCard, 'code'), 'center')}
      ${sheet(540, 304, undefined, undefined, row(icon('file') + label(l.bOutput)) + label(l.bCard, 'code') + label(l.bOnlyB, 'code'), 'center')}
    `)
  }
}
