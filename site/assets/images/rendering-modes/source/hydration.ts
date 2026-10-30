import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../../../../utils/delivery-flows'
import { drawing, type Theme } from './materials'

export default {
  id: 'hydration',
  render(theme: Theme) {
    const { p, text, rect, line, surface, svg } = drawing(theme)
    const l = deliveryIllustrations.hydration.labels
    return svg(600, 400, deliveryFlow('hydration').title, deliveryFlowDescription('hydration'), `
      ${text(62, 90, l.existing, 20, p.ink, 500)}
      ${rect(68, 116, 144, 84, 8, p.inset, `stroke="${p.line}"`)}
      ${surface(62, 110, 156, 84, 8)}
      ${[131, 153, 175].map((y, i) => rect(80, y, 112 - i * 23, 4, 2, p.blockStrong, 'opacity=".65"')).join('')}

      <path d="M346 62H518L538 82V102Q538 110 530 110H346Q338 110 338 102V70Q338 62 346 62Z" fill="url(#surface)" stroke="url(#edge)" filter="url(#shadow)"/>
      <path d="M518 63V77Q518 82 523 82H537" fill="none" stroke="${p.edgeBottom}"/>
      ${text(352, 96, l.manifest, 20, p.ink, 500)}
      ${line('M438 122V136', 'marker-end="url(#arrow)"')}
      <g transform="translate(340 154)" fill="none" stroke="${p.quiet}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
        <rect width="22" height="22" rx="3"/>
        <rect x="6" y="6" width="10" height="10" rx="1"/>
        <path d="M6-4v4m10-4v4M6 22v4m10-4v4M-4 6h4m-4 10h4M22 6h4m-4 10h4"/>
      </g>
      ${text(376, 173, l.replay, 20, p.ink, 500)}

      ${line('M140 212V222H196', 'marker-end="url(#arrow)"')}
      ${line('M438 190V222H380', 'marker-end="url(#arrow)"')}
      <path d="M288 174L366 222L288 270L210 222Z" fill="url(#surface)" stroke="url(#edge)" filter="url(#shadow)"/>
      ${text(288, 230, l.compare, 20, p.ink, 500, 'text-anchor="middle"')}

      ${line('M288 282V302')}
      ${line('M288 302H142V320', 'marker-end="url(#arrow)"')}
      ${line('M288 302H438V320', 'marker-end="url(#arrow)"')}
      ${text(142, 289, l.match, 18, p.muted, 400, 'text-anchor="middle"')}
      ${text(438, 289, l.mismatch, 18, p.muted, 400, 'text-anchor="middle"')}
      <g transform="translate(74 346)" fill="none" stroke="${p.route}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle r="11"/><path d="m-5 0 3 3 7-7"/></g>
      <g transform="translate(370 346)" fill="none" stroke="${p.route}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9-5a11 11 0 1 0 1 9M9-12v7H2"/></g>
      ${text(96, 354, l.adopt, 20, p.ink, 500)}
      ${text(392, 354, l.rebuild, 20, p.ink, 500)}
    `, 0)
  }
}
