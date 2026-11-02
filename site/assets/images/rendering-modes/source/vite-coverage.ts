import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

/** Compare available class evidence, not elapsed time. The empty HTML artifact is the causal gap. */
export default {
  id: 'vite-coverage',
  render(theme: Theme) {
    const { sheet, label, row, icon, text, route, scene } = drawing(theme)
    const l = deliveryIllustrations['vite-coverage'].labels
    const heading = (name: string, content: string) => row(icon('fileCode') + label(name)) + content
    return scene(deliveryFlow('vite-coverage').title, deliveryFlowDescription('vite-coverage'), `
      ${text(132, 68, l.static, 'eyebrow', 'center')}
      ${text(360, 68, l.prerender, 'eyebrow', 'center')}
      ${text(588, 68, l.runtime, 'eyebrow', 'center')}

      ${sheet(132, 102, undefined, undefined, heading(l.source, label(l.blue, 'code') + label(l.neutral, 'code')), 'center')}
      ${sheet(360, 102, undefined, undefined, heading(l.html, label(l.mount, 'code') + label(l.mountEnd, 'code')), 'center')}
      ${sheet(588, 102, undefined, undefined, heading(l.dom, label(l.button, 'code') + label(l.buttonClass, 'code') + label(l.buttonEnd, 'code')), 'center')}

      ${route('M132 214V274')}
      ${route('M360 214V274')}
      ${route('M588 240V274')}

      ${sheet(132, 280, undefined, undefined, heading(l.css, label(l.blueRule, 'code') + label(l.neutralRule, 'code')), 'center')}
      ${sheet(360, 280, undefined, undefined, heading(l.css, label(l.empty, 'note')), 'center')}
      ${sheet(588, 280, undefined, undefined, heading(l.css, label(l.blueRule, 'code')), 'center')}
      ${text(132, 408, l.sourceResult, 'note', 'center')}
      ${text(360, 408, l.htmlResult, 'note', 'center')}
      ${text(588, 408, l.domResult, 'note', 'center')}
    `)
  }
}
