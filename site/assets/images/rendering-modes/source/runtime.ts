import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'runtime',
  render(theme: Theme) {
    const { row, label, icon, bars, sheet, chip, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.runtime.labels
    return scene(deliveryFlow('runtime').title, deliveryFlowDescription('runtime'), `
      ${text(48, 140, l.dom, 'eyebrow')}
      ${sheet(48, 168, 192, 72, row(icon('code') + label(l.heading)) + label(l.candidate, 'code'))}
      ${sheet(48, 256, 120, 48, row(icon('code') + label(l.paragraph)))}
      ${route('M240 204H256M168 280H256M256 204V280', { arrow: false })}
      ${route('M256 238H318')}
      ${chip(320, 222, 168, 'cpu', l.engine)}
      ${route('M488 238H550')}
      ${sheet(552, 182, 120, 112, row(icon('layers') + label(l.rules)) + bars(84, 58, 74, 46))}
      ${text(612, 306, l.insert, 'edge', 'center')}
    `)
  }
}
