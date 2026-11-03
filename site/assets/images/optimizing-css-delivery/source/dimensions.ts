import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'
import { deliveryIllustrations } from '../../../../content/guide/optimizing-css-delivery/illustrations'
// A matrix, not a sequence: columns change native membership; rows change browser capability.
// The omitted unused rule is visible in both right-hand cells, while runtime exists in both bottom cells.
export default { id: 'dimensions', render(theme: Theme) {
  const d = drawing(theme), f = deliveryIllustrations.dimensions
  const { text, sheet, label, rule, divider, mark, route } = d
  const css = (x: number, y: number, pruned: boolean) => sheet(x, y, undefined, undefined,
    label('Initial CSS') + rule + label('.report', 'code') + (pruned ? label('Unused rule removed', 'edge') : label('.report-debug', 'code')), 'center')
  return d.scene(f.title, f.alt, `
    ${text(312, 36, 'PRESERVE NATIVE', 'eyebrow', 'center')}${text(563, 36, 'PRUNE NATIVE', 'eyebrow', 'center')}
    ${divider(436, 70, 415)}
    ${text(48, 123, 'Static', 'title')}${css(312, 85, false)}${css(563, 85, true)}
    ${text(312, 213, 'No browser generation', 'edge', 'center')}${text(563, 213, 'No browser generation', 'edge', 'center')}
    ${route('M48 250H671', { arrow: false })}
    ${text(48, 299, 'Progressive', 'title')}${css(312, 277, false)}${css(563, 277, true)}
    ${mark(312, 399, 'cpu', 'Later utilities', 'center')}${mark(563, 399, 'cpu', 'Later utilities', 'center')}
    ${text(360, 448, 'Native filtering does not choose the rendering mode', 'note', 'center')}
  `)
} }
