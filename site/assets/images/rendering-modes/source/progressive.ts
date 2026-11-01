import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

/** Initial delivery crosses into the browser; the conditional engine path stays inside it. */
export default {
  id: 'progressive',
  render(theme: Theme) {
    const { row, rule, label, icon, bars, sheet, chip, window, divider, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.progressive.labels
    return scene(deliveryFlow('progressive').title, deliveryFlowDescription('progressive'), `
      ${text(48, 84, l.host, 'eyebrow')}
      ${divider(264, 84, 396)}
      ${text(296, 84, l.browser, 'eyebrow')}
      ${sheet(48, 160, 184, 120, row(icon('file') + label(l.html)) + bars(82, 60) + rule + row(icon('fileCode') + label(l.inline)))}
      ${route('M232 220H302')}
      ${window(304, 148, 216, 156, bars(46, 86, 70, 78))}

      ${route('M412 304V362', { dashed: true })}
      ${text(426, 316, l.trigger, 'body')}
      ${text(426, 334, l.condition, 'edge')}
      ${chip(328, 364, 168, 'cpu', l.engine)}
      ${route('M496 380H592Q600 380 600 372V234Q600 226 592 226H522')}
      ${text(612, 296, l.output, 'edge')}
    `)
  }
}
