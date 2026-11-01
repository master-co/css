import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'hydration',
  render(theme: Theme) {
    const { row, label, icon, bars, sheet, chip, mark, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.hydration.labels
    return scene(deliveryFlow('hydration').title, deliveryFlowDescription('hydration'), `
      ${sheet(76, 80, 208, 100, row(icon('fileCode') + label(l.existing)) + bars(88, 66, 76))}
      ${sheet(436, 80, 208, 100, row(icon('braces') + label(l.manifest)) + bars(72, 84, 58))}

      ${route('M180 180V260Q180 268 188 268H297')}
      ${route('M540 180V250')}
      ${chip(460, 252, 160, 'cpu', l.replay)}
      ${route('M460 268H423')}
      ${chip(300, 252, 120, 'compare', l.compare)}

      ${route('M360 284V320', { arrow: false })}
      ${route('M360 320H188Q180 320 180 328V372')}
      ${route('M360 320H532Q540 320 540 328V372')}
      ${text(170, 338, l.match, 'edge', 'end')}
      ${text(550, 338, l.mismatch, 'edge')}
      ${mark(180, 378, 'check', l.adopt, 'center')}
      ${mark(540, 378, 'refresh', l.rebuild, 'center')}
    `)
  }
}
