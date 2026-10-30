import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'pruning',
  render(theme: Theme) {
    const { p, text, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.pruning.labels
    const content = `
      ${text(180, 30, l.usage, 18, p.ink, 500, 'text-anchor="middle"')}
      ${text(180, 57, l.classes, 16, p.muted, 400, 'text-anchor="middle"')}
      ${line('M180 74V104', 'marker-end="url(#arrow)"')}
      ${surface(65, 116, 230, 78)}
      ${text(85, 147, l.entry, 18, p.ink, 500)}
      ${text(85, 175, l.entryPolicy, 16, p.muted)}
      ${line('M180 206V222M180 222H88V256', 'marker-end="url(#arrow)"')}
      ${line('M180 222H272V256', 'marker-end="url(#arrow)"')}
      ${text(180, 247, l.imports, 15, p.muted, 400, 'text-anchor="middle"')}
      ${surface(8, 268, 160, 120)}
      ${text(24, 299, l.local, 18, p.ink, 500)}
      ${text(24, 328, l.localPolicy, 16, p.muted)}
      ${text(24, 366, l.used, 16)}
      ${surface(192, 268, 160, 120)}
      ${text(208, 299, l.external, 18, p.ink, 500)}
      ${text(208, 328, l.default, 16, p.muted)}
      ${text(208, 366, l.all, 16)}
      ${line('M88 402V439', 'marker-end="url(#arrow)"')}
      ${text(112, 427, l.animation, 16, p.muted)}
      ${surface(8, 451, 344, 75)}
      ${text(28, 481, l.resources, 18, p.ink, 500)}
      ${text(28, 509, l.identity, 16, p.muted)}
    `
    return svg(360, 550, deliveryFlow('pruning').title, deliveryFlowDescription('pruning'), content, 20)
  }
}
