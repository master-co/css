import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

const flow = deliveryFlow('hydration')
const labels = deliveryIllustrations.hydration.labels

export default {
  id: 'hydration',
  render(theme: Theme) {
    const { p, text, line, engine, stylesheet, svg } = drawing(theme)
    const width = 560
    const height = 510
    const center = { x: 280, y: 316 }
    const sheet = { x: 24, y: 80, w: 210 }
    const chip = { x: 320, y: 112, w: 216 }
    const left = 128
    const right = 432
    const outcomeY = 433
    const content = `
      ${stylesheet(sheet.x, sheet.y, sheet.w, 126, labels.existing)}
      ${text(chip.x + chip.w / 2, chip.y - 46, labels.manifest, 16, p.muted, 500, 'text-anchor="middle"')}
      ${line(`M${chip.x + chip.w / 2} ${chip.y - 33}V${chip.y - 12}`, 'marker-end="url(#arrow)"')}
      ${engine(chip.x, chip.y, chip.w, 64, labels.replay)}
      ${line('M129 224V232Q129 240 137 240H280M428 188V232Q428 240 420 240H280') + line('M280 240V266', 'marker-end="url(#arrow)"')}
      <path d="M${center.x} ${center.y - 38}L${center.x + 72} ${center.y}L${center.x} ${center.y + 38}L${center.x - 72} ${center.y}Z" fill="url(#surface)" stroke="url(#edge)" filter="url(#shadow)"/>
      ${text(center.x, center.y + 6, labels.compare, 18, p.ink, 500, 'text-anchor="middle"')}
      ${line('M196 316H136Q128 316 128 324V402', 'marker-end="url(#arrow)"') + line('M364 316H424Q432 316 432 324V402', 'marker-end="url(#arrow)"')}
      ${text(160, 302, labels.match, 15, p.muted)}
      ${text(368, 302, labels.mismatch, 15, p.muted, 400, '')}
      <g transform="translate(${left} ${outcomeY})" fill="none" stroke="${p.route}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <circle r="12"/><path d="m-5 0 3 3 7-7"/>
      </g>
      <g transform="translate(${right} ${outcomeY})" fill="none" stroke="${p.route}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9-5a11 11 0 1 0 1 9M9-12v7H2"/>
      </g>
      ${text(left, outcomeY + 36, labels.adopt, 18, p.ink, 500, 'text-anchor="middle"')}
      ${text(right, outcomeY + 36, labels.rebuild, 18, p.ink, 500, 'text-anchor="middle"')}
    `
    return svg(width, height, flow.title, deliveryFlowDescription('hydration'), content, 20)
  }
}
