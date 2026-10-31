import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'runtime',
  render(theme: Theme) {
    const { p, text, rect, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.runtime.labels
    return svg(600, 400, deliveryFlow('runtime').title, deliveryFlowDescription('runtime'), `
      <g transform="translate(0 24)">
      ${text(62, 92, l.dom, 20, p.muted, 500)}
      ${line('M62 114V246Q62 264 80 264H336Q356 264 356 244V214', 'marker-end="url(#arrow)"')}
      ${line('M62 145H76M62 211H76')}
      ${surface(88, 114, 198, 66, 8)}
      ${text(102, 141, l.heading, 20, p.ink, 500)}
      ${text(102, 167, l.candidate, 18, p.muted)}
      ${surface(88, 194, 72, 36, 7)}
      ${text(102, 220, l.paragraph, 20, p.muted)}

      ${surface(326, 136, 60, 64, 9)}
      <g transform="translate(343 155)" fill="none" stroke="${p.quiet}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <rect width="26" height="26" rx="4"/>
        <rect x="7" y="7" width="12" height="12" rx="2"/>
        <path d="M7-5v5m12-5v5M7 26v5m12-5v5M-5 7h5m-5 12h5M26 7h5m-5 12h5"/>
      </g>
      ${text(356, 92, l.engine, 20, p.ink, 500, 'text-anchor="middle"')}

      ${text(498, 92, l.rules, 20, p.ink, 500, 'text-anchor="middle"')}
      ${rect(450, 120, 96, 118, 8, p.inset, `stroke="${p.line}"`)}
      ${surface(444, 114, 108, 118, 8)}
      ${[138, 162, 186, 210].map((y, i) => rect(462, y, i % 2 ? 52 : 70, 4, 2, p.blockStrong, 'opacity=".65"')).join('')}
      ${line('M400 168H430', 'marker-end="url(#arrow)"')}
      ${text(498, 274, l.insert, 18, p.muted, 400, 'text-anchor="middle"')}
      </g>
    `, 0)
  }
}
