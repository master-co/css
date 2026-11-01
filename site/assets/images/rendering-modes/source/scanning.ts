import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'scanning',
  render(theme: Theme) {
    const { row, label, icon, bars, sheet, chip, route, scene } = drawing(theme)
    const l = deliveryIllustrations.scanning.labels
    return scene(deliveryFlow('scanning').title, deliveryFlowDescription('scanning'), `
      ${sheet(48, 96, 200, 96, row(icon('fileCode') + label(l.source)) + label(l.redSource, 'code') + label(l.greenSource, 'code'))}
      ${route('M248 144H302')}
      ${chip(304, 128, 112, 'scan', l.extract)}
      ${route('M416 144H470')}
      ${sheet(472, 96, 200, 96, row(icon('code') + label(l.candidates)) + label(l.red, 'code') + label(l.green, 'code'))}

      ${route('M572 192V256Q572 264 564 264H368Q360 264 360 272V326')}
      ${sheet(48, 304, 200, 80, row(icon('layers') + label(l.definitions)) + label(l.context, 'note'))}
      ${route('M248 344H302')}
      ${chip(304, 328, 112, 'cpu', l.resolve)}
      ${route('M416 344H470')}
      ${sheet(472, 304, 200, 80, row(icon('file') + label(l.output)) + bars(82, 58))}
    `)
  }
}
