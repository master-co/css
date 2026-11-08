import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

/**
 * One row per mode, parted by place: where class evidence is read, what the page has first,
 * and whether the browser engine takes part. The empty cells are the comparison.
 */
export default {
  id: 'modes',
  render(theme: Theme) {
    const { row, label, icon, sheet, chip, mark, divider, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.modes.labels
    const rows = [148, 224, 300, 376]
    const input = (y: number, name: 'fileCode' | 'file', value: string) => sheet(256, y - 24, undefined, undefined, row(icon(name) + label(value)), 'center')
    const cross = (y: number) => route(`M330 ${y}H396`)
    return scene(deliveryFlow('modes').title, deliveryFlowDescription('modes'), `
      ${text(256, 84, l.build, 'eyebrow', 'center')}
      ${divider(372, 84, 404)}
      ${text(520, 84, l.browser, 'eyebrow', 'center')}

      ${[l.static, l.prerender, l.runtime, l.progressive].map((name, i) => text(48, rows[i] - 10, name)).join('')}

      ${input(rows[0], 'fileCode', l.source)}${cross(rows[0])}
      ${mark(404, rows[0] - 10, 'fileCode', l.stylesheet)}

      ${input(rows[1], 'file', l.prerenderHTML)}${cross(rows[1])}
      ${mark(404, rows[1] - 10, 'fileCode', l.prerenderCSS)}

      ${mark(404, rows[2] - 10, 'window', l.dom)}
      ${route(`M546 ${rows[2]}H584`)}
      ${chip(590, rows[2] - 16, undefined, 'cpu', l.runtimeEngine)}

      ${input(rows[3], 'file', l.progressiveHTML)}${cross(rows[3])}
      ${mark(404, rows[3] - 10, 'fileCode', l.progressiveCSS)}
      ${route(`M500 ${rows[3]}H584`, { dashed: true })}
      ${text(542, rows[3] - 26, l.missing, 'edge', 'center')}
      ${chip(590, rows[3] - 16, undefined, 'cpu', l.progressiveEngine)}
    `)
  }
}
