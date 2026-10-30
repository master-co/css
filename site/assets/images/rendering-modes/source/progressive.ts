import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

const flow = deliveryFlow('progressive')
const labels = deliveryIllustrations.progressive.labels

/** The response path and the later, conditional browser path stay distinct. */
export default {
  id: 'progressive',
  render(theme: Theme) {
    const { p, text, line, document, browser, engine, svg } = drawing(theme)
    const width = 560
    const height = 450
    const paper = { x: 22, y: 94, w: 166, h: 188 }
    const window = { x: 240, y: 94, w: 260, h: 158 }
    const chip = { x: 272, y: 354, w: 228, h: 60 }
    const connectorX = 370
    const content = `
      ${text(paper.x, paper.y - 24, labels.host, 16, p.muted, 500)}
      ${text(window.x, window.y - 24, labels.browser, 16, p.muted, 500)}
      ${line('M200 174H228', 'marker-end="url(#arrow)"')}
      ${line(`M${connectorX} ${window.y + window.h + 12}V${chip.y - 12}`, 'stroke-dasharray="3 5" marker-end="url(#arrow)"')}
      ${line('M260 384H216Q208 384 208 376V233Q208 225 216 225H228', 'marker-end="url(#arrow)"')}
      ${text(132, 326, labels.output, 15, p.muted)}
      ${document(paper.x, paper.y, paper.w, paper.h, labels.html, labels.inline)}
      ${browser(window.x, window.y, window.w, window.h)}
      ${text(connectorX + 15, 298, labels.trigger, 16, p.ink, 500)}
      ${text(connectorX + 15, 320, labels.condition, 15, p.muted)}
      ${engine(chip.x, chip.y, chip.w, chip.h, labels.engine)}
    `
    return svg(width, height, flow.title, deliveryFlowDescription('progressive'), content, 20)
  }
}
