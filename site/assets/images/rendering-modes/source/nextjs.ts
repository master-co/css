import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'nextjs',
  render(theme: Theme) {
    const { row, label, icon, sheet, mark, divider, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.nextjs.labels
    return scene(deliveryFlow('nextjs').title, deliveryFlowDescription('nextjs'), `
      ${text(180, 80, l.build, 'eyebrow', 'center')}
      ${divider(360, 80, 400)}
      ${text(540, 80, l.request, 'eyebrow', 'center')}
      ${sheet(80, 112, 200, 72, row(icon('file') + label(l.static)) + label(l.staticHTML, 'note'))}
      ${sheet(440, 112, 200, 72, row(icon('file') + label(l.dynamic)) + label(l.dynamicHTML, 'note'))}

      ${route('M180 184V230')}
      ${sheet(80, 232, 200, 72, row(icon('cpu') + label(l.adapter)) + label(l.css, 'note'))}
      ${route('M180 304V350')}
      ${route('M540 184V236', { arrow: false })}
      ${text(540, 250, l.outside, 'edge', 'center')}
      ${text(540, 266, l.boundary, 'edge', 'center')}
      ${route('M540 296V350')}

      ${mark(180, 358, 'fileCode', l.initial, 'center')}
      ${text(180, 380, l.ready, 'note', 'center')}
      ${mark(540, 358, 'cpu', l.runtime, 'center')}
      ${text(540, 380, l.generate, 'note', 'center')}
    `)
  }
}
