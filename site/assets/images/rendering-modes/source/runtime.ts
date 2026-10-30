import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

const flow = deliveryFlow('runtime')
const labels = deliveryIllustrations.runtime.labels

export default {
  id: 'runtime',
  render(theme: Theme) {
    const { p, text, line, surface, engine, stylesheet, svg } = drawing(theme)
    const width = 560
    const height = 440
    const treeX = 26
    const nodeX = 54
    const headingY = 110
    const paragraphY = 208
    const chip = { x: 302, y: 112, w: 236 }
    const sheet = { x: 310, y: 278 }
    const textY = 228
    const content = `
      ${text(treeX, 61, labels.dom, 18, p.muted, 500)}
      <circle cx="${treeX}" cy="84" r="3" fill="${p.route}"/>
      ${line(`M${treeX} 96V${Math.max(headingY + 33, paragraphY + 20)}M${treeX} ${headingY + 33}H${nodeX - 9}M${treeX} ${paragraphY + 20}H${nodeX - 9}`)}
      ${line('M260 143H290', 'marker-end="url(#arrow)"')}
      ${line(`M${chip.x + chip.w / 2} ${chip.y + 76}V${sheet.y - 12}`, 'marker-end="url(#arrow)"')}
      ${surface(nodeX, headingY, 194, 66, 7)}
      ${text(nodeX + 16, headingY + 27, labels.heading, 19, p.ink, 500)}
      ${text(nodeX + 16, headingY + 50, labels.candidate, 15, p.muted)}
      ${surface(nodeX, paragraphY, 128, 40, 7)}
      ${text(nodeX + 16, paragraphY + 26, labels.paragraph, 18, p.muted)}
      ${engine(chip.x, chip.y, chip.w, 64, labels.engine)}
      ${text(435, textY, labels.insert, 15, p.muted)}
      ${stylesheet(sheet.x, sheet.y, 220, 126, labels.rules)}
    `
    return svg(width, height, flow.title, deliveryFlowDescription('runtime'), content, 20)
  }
}
