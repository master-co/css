import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'pruning-scope',
  render(theme: Theme) {
    const { p, text, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations['pruning-scope'].labels
    const content = `
      ${surface(160, 8, 240, 136)}
      ${text(180, 42, l.shared, 20, p.ink, 500)}
      ${text(180, 71, l.policy, 18, p.muted)}
      ${text(180, 101, l.sharedCard, 18)}
      ${text(180, 127, l.sharedOnlyB, 18)}

      ${line('M280 155V176H130V231', 'marker-end="url(#arrow)"')}
      ${line('M280 176H430V231', 'marker-end="url(#arrow)"')}
      ${text(96, 209, l.aUsage, 18, p.muted, 400, 'text-anchor="end"')}
      ${text(464, 209, l.bUsage, 18, p.muted)}

      ${surface(10, 244, 240, 108)}
      ${text(30, 277, l.aOutput, 20, p.ink, 500)}
      ${text(30, 309, l.aCard, 18)}
      ${surface(310, 244, 240, 108)}
      ${text(330, 277, l.bOutput, 20, p.ink, 500)}
      ${text(330, 309, l.bCard, 18)}
      ${text(330, 335, l.bOnlyB, 18)}
    `
    return svg(560, 360, deliveryFlow('pruning-scope').title, deliveryFlowDescription('pruning-scope'), content, 20)
  }
}
