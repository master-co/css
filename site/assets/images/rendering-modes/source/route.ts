import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'route',
  render(theme: Theme) {
    const { row, label, icon, sheet, mark, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.route.labels
    return scene(deliveryFlow('route').title, deliveryFlowDescription('route'), `
      ${sheet(48, 82, 240, 72, row(icon('layers') + label(l.project)) + label(l.definitions, 'note'))}
      ${route('M168 154V224', { dashed: true })}
      ${text(182, 181, l.context, 'edge')}
      ${sheet(48, 226, 240, 72, row(icon('fileCode') + label(l.route)) + label(l.native, 'note'))}
      ${route('M288 262H430')}
      ${text(359, 240, l.compile, 'edge', 'center')}
      ${sheet(432, 226, 240, 72, row(icon('file') + label(l.output)) + label(l.resources, 'note'))}
      ${route('M552 298V368')}
      ${text(540, 325, l.load, 'edge', 'end')}
      ${mark(552, 376, 'window', l.page, 'center')}
    `)
  }
}
