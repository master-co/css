import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'scanning',
  render(theme: Theme) {
    const { p, text, rect, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.scanning.labels
    return svg(600, 400, deliveryFlow('scanning').title, deliveryFlowDescription('scanning'), `
      <path d="M44 42H230L258 70V170Q258 180 248 180H44Q34 180 34 170V52Q34 42 44 42Z" fill="url(#surface)" stroke="url(#edge)" filter="url(#shadow)"/>
      <path d="M230 43V65Q230 70 235 70H257" fill="none" stroke="${p.edgeBottom}"/>
      ${text(54, 80, l.source, 20, p.ink, 500)}
      ${text(54, 120, l.redSource, 18, p.muted)}
      ${text(54, 150, l.greenSource, 18, p.muted)}
      ${line('M146 194V224', 'marker-end="url(#arrow)"')}
      ${text(166, 216, l.extract, 18, p.muted)}

      ${text(54, 262, l.candidates, 20, p.ink, 500)}
      ${text(54, 296, l.red, 18, p.muted)}
      ${text(54, 326, l.green, 18, p.muted)}
      ${line('M204 299H336', 'marker-end="url(#arrow)"')}
      ${text(270, 279, l.resolve, 18, p.muted, 400, 'text-anchor="middle"')}

      ${surface(352, 60, 212, 98, 8)}
      ${text(370, 99, l.definitions, 20, p.ink, 500)}
      ${text(370, 131, l.context, 18, p.muted)}
      ${line('M458 172V228', 'marker-end="url(#arrow)"')}

      ${rect(360, 252, 198, 100, 8, p.inset, `stroke="${p.line}"`)}
      ${surface(352, 244, 212, 100, 8)}
      ${text(370, 279, l.output, 20, p.ink, 500)}
      ${rect(370, 299, 166, 4, 2, p.blockStrong)}
      ${rect(370, 317, 128, 4, 2, p.blockStrong)}
    `, 0)
  }
}
