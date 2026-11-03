import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'
import { deliveryIllustrations } from '../../../../content/guide/optimizing-css-delivery/illustrations'
// Parallel evidence converges at one acceptance gate; no path represents elapsed time.
// Actual artifacts on the left and user states on the right distinguish bytes from behavior.
export default { id: 'verification', render(theme: Theme) {
  const d = drawing(theme), f = deliveryIllustrations.verification
  const { text, sheet, row, icon, label, rule, route, mark, chip } = d
  return d.scene(f.title, f.alt, `
    ${text(191, 40, 'DELIVERY EVIDENCE', 'eyebrow', 'center')}${text(529, 40, 'BEHAVIOR EVIDENCE', 'eyebrow', 'center')}
    ${sheet(191, 81, undefined, undefined, row(icon('fileCode') + label('Production output')) + rule + label('Overview → common CSS', 'code') + label('Reports → common + feature', 'code'), 'center')}
    ${sheet(529, 81, undefined, undefined, row(icon('window') + label('Reports in the browser')) + rule + label('Waiting → ready', 'body') + label('Keyboard → focus outline', 'body'), 'center')}
    ${text(191, 224, 'Bytes · files · imports · cache', 'note', 'center')}${text(529, 224, 'States · themes · widths', 'note', 'center')}
    ${route('M191 259V298H330V337')}${route('M529 259V298H390V337')}
    ${chip(294, 343, undefined, 'check', 'Both verified')}
    ${route('M360 378V409')}
    ${mark(360, 424, 'file', 'Save the project budget', 'center')}
  `)
} }
