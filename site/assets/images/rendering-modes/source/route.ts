import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'route',
  render(theme: Theme) {
    const { p, text, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.route.labels
    const content = `
      ${surface(8, 10, 260, 96)}
      ${text(28, 47, l.project, 20, p.ink, 500)}
      ${text(28, 80, l.definitions, 18, p.muted)}
      ${line('M138 120V184', 'stroke-dasharray="3 5" marker-end="url(#arrow)"')}
      ${text(158, 158, l.context, 18, p.muted)}

      ${surface(8, 198, 260, 100)}
      ${text(28, 237, l.route, 20, p.ink, 500)}
      ${text(28, 273, l.native, 18, p.muted)}
      ${line('M282 249H316', 'marker-end="url(#arrow)"')}
      ${text(299, 180, l.compile, 18, p.muted, 400, 'text-anchor="middle"')}

      ${surface(330, 198, 222, 100)}
      ${text(350, 237, l.output, 20, p.ink, 500)}
      ${text(350, 273, l.resources, 18, p.muted)}
      ${line('M441 312V326', 'marker-end="url(#arrow)"')}
      ${text(418, 324, l.load, 18, p.muted, 400, 'text-anchor="end"')}
      ${text(552, 356, l.page, 20, p.ink, 500, 'text-anchor="end"')}
    `
    return svg(560, 360, deliveryFlow('route').title, deliveryFlowDescription('route'), content, 20)
  }
}
