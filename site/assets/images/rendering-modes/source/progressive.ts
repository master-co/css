import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

/** Initial delivery crosses into the browser; the conditional engine path stays inside it. */
export default {
  id: 'progressive',
  render(theme: Theme) {
    const { p, text, rect, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.progressive.labels
    return svg(600, 400, deliveryFlow('progressive').title, deliveryFlowDescription('progressive'), `
      ${text(58, 94, l.host, 20, p.muted, 500)}
      <path d="M68 120H168L190 142V264Q190 274 180 274H68Q58 274 58 264V130Q58 120 68 120Z" fill="url(#surface)" stroke="url(#edge)" filter="url(#shadow)"/>
      <path d="M168 121V137Q168 142 173 142H189" fill="none" stroke="${p.edgeBottom}"/>
      ${text(72, 158, l.html, 20, p.ink, 500)}
      ${rect(72, 181, 88, 4, 2, p.blockStrong)}
      ${rect(72, 199, 72, 4, 2, p.block)}
      <path d="M59 222H189V264Q189 273 180 273H68Q59 273 59 264Z" fill="${p.inset}"/>
      <path d="M59 222H189" stroke="${p.line}"/>
      ${text(72, 256, l.inline, 20, p.ink, 500)}
      ${line('M204 178H224', 'marker-end="url(#arrow)"')}

      ${surface(238, 80, 300, 248, 10)}
      ${rect(239, 81, 298, 36, 9, p.chrome)}
      ${rect(239, 99, 298, 18, 0, p.chrome)}
      <path d="M239 117H537" stroke="${p.line}"/>
      ${[254, 264, 274].map(x => `<circle cx="${x}" cy="99" r="2" fill="${p.quiet}"/>`).join('')}
      ${text(294, 107, l.browser, 20, p.ink, 500)}

      ${rect(258, 137, 172, 62, 5, p.window, `stroke="${p.line}"`)}
      ${rect(272, 150, 90, 6, 3, p.blockStrong)}
      ${rect(272, 168, 128, 4, 2, p.block)}
      ${rect(272, 182, 44, 8, 3, p.button)}
      ${line('M370 211V219', 'stroke-dasharray="3 5"')}
      ${text(370, 239, l.trigger, 20, p.ink, 500, 'text-anchor="middle"')}
      ${text(370, 263, l.condition, 18, p.muted, 400, 'text-anchor="middle"')}
      ${line('M370 274V283', 'stroke-dasharray="3 5" marker-end="url(#arrow)"')}

      <g transform="translate(268 290)" fill="none" stroke="${p.quiet}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
        <rect width="22" height="22" rx="3"/>
        <rect x="6" y="6" width="10" height="10" rx="1"/>
        <path d="M6-4v4m10-4v4M6 22v4m10-4v4M-4 6h4m-4 10h4M22 6h4m-4 10h4"/>
      </g>
      ${text(304, 309, l.engine, 20, p.ink, 500)}
      ${line('M482 302H488Q500 302 500 290V176H444', 'marker-end="url(#arrow)"')}
      ${text(484, 152, l.output, 18, p.muted, 400, 'text-anchor="middle"')}
    `, 0)
  }
}
