import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'pruning',
  render(theme: Theme) {
    const { p, text, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.pruning.labels
    const content = `
      ${text(8, 46, l.usage, 20, p.ink, 500)}
      ${text(8, 82, l.classes, 18, p.muted)}
      ${line('M258 65H306', 'marker-end="url(#arrow)"')}
      ${surface(320, 12, 232, 106)}
      ${text(340, 52, l.entry, 20, p.ink, 500)}
      ${text(340, 89, l.entryPolicy, 18, p.muted)}

      ${line('M436 132V160H128V200', 'marker-end="url(#arrow)"')}
      ${line('M436 160V200', 'marker-end="url(#arrow)"')}
      ${text(280, 192, l.imports, 18, p.muted, 400, 'text-anchor="middle"')}

      ${surface(8, 214, 240, 112)}
      ${text(28, 250, l.local, 20, p.ink, 500)}
      ${text(28, 283, l.localPolicy, 18, p.muted)}
      ${text(28, 313, l.used, 18)}
      ${surface(312, 214, 240, 112)}
      ${text(332, 250, l.external, 20, p.ink, 500)}
      ${text(332, 283, l.default, 18, p.muted)}
      ${text(332, 313, l.all, 18)}
      ${text(280, 354, l.policy, 18, p.muted, 400, 'text-anchor="middle"')}
    `
    return svg(560, 360, deliveryFlow('pruning').title, deliveryFlowDescription('pruning'), content, 20)
  }
}
