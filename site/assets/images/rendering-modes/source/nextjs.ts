import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'nextjs',
  render(theme: Theme) {
    const { p, text, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.nextjs.labels
    const content = `
      ${text(88, 36, l.build, 18, p.ink, 500, 'text-anchor="middle"')}
      ${text(272, 36, l.request, 18, p.ink, 500, 'text-anchor="middle"')}
      ${surface(8, 65, 160, 104)}
      ${text(24, 101, l.static, 17, p.ink, 500)}
      ${text(24, 132, l.staticHTML, 16, p.muted)}
      ${surface(192, 65, 160, 104)}
      ${text(208, 101, l.dynamic, 17, p.ink, 500)}
      ${text(208, 132, l.dynamicHTML, 16, p.muted)}
      ${line('M88 183V228', 'marker-end="url(#arrow)"')}
      ${line('M272 183V228', 'marker-end="url(#arrow)"')}
      ${surface(8, 241, 160, 104)}
      ${text(24, 277, l.adapter, 17, p.ink, 500)}
      ${text(24, 308, l.css, 16, p.muted)}
      ${text(272, 277, l.outside, 16, p.muted, 400, 'text-anchor="middle"')}
      ${text(272, 305, l.boundary, 16, p.muted, 400, 'text-anchor="middle"')}
      ${line('M88 359V404', 'marker-end="url(#arrow)"')}
      ${line('M272 327V404', 'marker-end="url(#arrow)"')}
      ${text(88, 442, l.initial, 17, p.ink, 500, 'text-anchor="middle"')}
      ${text(272, 442, l.runtime, 17, p.ink, 500, 'text-anchor="middle"')}
      ${text(88, 472, l.ready, 15, p.muted, 400, 'text-anchor="middle"')}
      ${text(272, 472, l.generate, 15, p.muted, 400, 'text-anchor="middle"')}
    `
    return svg(360, 505, deliveryFlow('nextjs').title, deliveryFlowDescription('nextjs'), content, 20)
  }
}
