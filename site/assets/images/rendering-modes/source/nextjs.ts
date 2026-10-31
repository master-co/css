import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'nextjs',
  render(theme: Theme) {
    const { p, text, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.nextjs.labels
    const page = (x: number, title: string, label: string) => `
      <path d="M${x + 10} 65H${x + 198}L${x + 220} 87V153Q${x + 220} 163 ${x + 210} 163H${x + 10}Q${x} 163 ${x} 153V75Q${x} 65 ${x + 10} 65Z" fill="url(#surface)" stroke="url(#edge)" filter="url(#shadow)"/>
      <path d="M${x + 198} 66V82Q${x + 198} 87 ${x + 203} 87H${x + 219}" fill="none" stroke="${p.edgeBottom}"/>
      ${text(x + 18, 105, title, 20, p.ink, 500)}
      ${text(x + 18, 136, label, 18, p.muted)}
    `
    const content = `
      ${text(148, 38, l.build, 20, p.ink, 500, 'text-anchor="middle"')}
      ${text(448, 38, l.request, 20, p.ink, 500, 'text-anchor="middle"')}
      ${page(38, l.static, l.staticHTML)}
      ${page(338, l.dynamic, l.dynamicHTML)}
      ${line('M148 177V201', 'marker-end="url(#arrow)"')}
      ${line('M448 177V201', 'marker-end="url(#arrow)"')}
      ${surface(38, 215, 220, 64)}
      ${text(56, 241, l.adapter, 20, p.ink, 500)}
      ${text(56, 266, l.css, 18, p.muted)}
      ${text(448, 239, l.outside, 18, p.muted, 400, 'text-anchor="middle"')}
      ${text(448, 264, l.boundary, 18, p.muted, 400, 'text-anchor="middle"')}
      ${line('M148 293V315', 'marker-end="url(#arrow)"')}
      ${line('M448 287V315', 'marker-end="url(#arrow)"')}
      ${text(148, 344, l.initial, 20, p.ink, 500, 'text-anchor="middle"')}
      ${text(448, 344, l.runtime, 20, p.ink, 500, 'text-anchor="middle"')}
      ${text(148, 372, l.ready, 18, p.muted, 400, 'text-anchor="middle"')}
      ${text(448, 372, l.generate, 18, p.muted, 400, 'text-anchor="middle"')}
    `
    return svg(600, 400, deliveryFlow('nextjs').title, deliveryFlowDescription('nextjs'), content, 0)
  }
}
