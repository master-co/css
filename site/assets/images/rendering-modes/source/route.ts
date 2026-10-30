import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'route',
  render(theme: Theme) {
    const { p, text, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.route.labels
    const content = `
      ${surface(24, 24, 312, 90)}
      ${text(44, 59, l.project, 18, p.ink, 500)}
      ${text(44, 88, l.definitions, 16, p.muted)}
      ${line('M180 128V189', 'stroke-dasharray="3 5" marker-end="url(#arrow)"')}
      ${text(202, 164, l.context, 16, p.muted)}
      ${surface(24, 202, 312, 90)}
      ${text(44, 237, l.route, 18, p.ink, 500)}
      ${text(44, 266, l.native, 16, p.muted)}
      ${line('M180 306V365', 'marker-end="url(#arrow)"')}
      ${text(202, 342, l.compile, 16, p.muted)}
      ${surface(24, 378, 312, 90)}
      ${text(44, 413, l.output, 18, p.ink, 500)}
      ${text(44, 442, l.resources, 16, p.muted)}
      ${line('M180 482V541', 'marker-end="url(#arrow)"')}
      ${text(202, 518, l.load, 16, p.muted)}
      ${text(180, 571, l.page, 18, p.ink, 500, 'text-anchor="middle"')}
    `
    return svg(360, 600, deliveryFlow('route').title, deliveryFlowDescription('route'), content, 20)
  }
}
