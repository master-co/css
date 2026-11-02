import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Two connected elements share a class and one generated rule. Artifacts size to their literal contents.
export default {
  id: 'runtime',
  render(theme: Theme) {
    const { row, label, icon, rule, sheet, chip, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations.runtime.labels
    return scene(deliveryFlow('runtime').title, deliveryFlowDescription('runtime'), `
      ${text(48, 102, l.dom, 'eyebrow')}
      ${sheet(48, 142, undefined, undefined, row(icon('code') + label(l.heading)) + label(l.candidate, 'code'))}
      ${sheet(48, 262, undefined, undefined, row(icon('code') + label(l.paragraph)) + label(l.sharedCandidate, 'code'))}
      ${route('M180 177H264V244M180 297H264V244', { arrow: false })}
      ${route('M264 244H302')}
      ${chip(308, 228, undefined, 'cpu', l.engine)}
      ${route('M476 244H515')}
      ${sheet(530, 180, undefined, undefined, row(icon('layers') + label(l.rules)) + rule + label(l.selector, 'code') + label(l.declaration, 'code') + label(l.close, 'code'))}
      ${text(610, 346, l.insert, 'edge', 'center')}
    `)
  }
}
