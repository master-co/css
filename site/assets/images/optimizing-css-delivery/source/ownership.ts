import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'
import { deliveryIllustrations } from '../../../../content/guide/optimizing-css-delivery/illustrations'
// Matched import graphs: repeated rule identities show the unnecessary delivery.
// Equal page artifacts compare membership, never byte sizes or selector scope.
export default { id: 'ownership', render(theme: Theme) {
  const d = drawing(theme), f = deliveryIllustrations.ownership
  const { text, sheet, row, icon, label, rule, route, divider } = d
  const page = (x: number, title: string, report: boolean) => sheet(x, 281, undefined, undefined,
    row(icon('file') + label(title)) + rule + label('.site-nav', 'code') + (report ? label('.report', 'code') : label('No report rules', 'edge')), 'center')
  return d.scene(f.title, f.alt, `
    ${text(180, 50, 'COMMON FEATURE IMPORT', 'eyebrow', 'center')}
    ${text(540, 50, 'FEATURE-OWNED IMPORT', 'eyebrow', 'center')}
    ${divider(360, 48, 426)}
    ${sheet(180, 91, undefined, undefined, row(icon('fileCode') + label('main.js')) + rule + label('style.css + reports.css', 'code'), 'center')}
    ${route('M180 176V217H95V277')}${route('M180 217H270V277')}
    ${page(95, 'Overview', true)}${page(270, 'Reports', true)}
    ${sheet(540, 91, undefined, undefined, row(icon('fileCode') + label('main.js')) + rule + label('style.css', 'code'), 'center')}
    ${route('M540 176V195H445V277')}${route('M540 195H560V335H568')}${route('M625 255V277')}
    ${page(445, 'Overview', false)}${page(625, 'Reports', true)}
    ${text(625, 214, 'reports.js', 'code', 'center')}
    ${text(625, 237, '+ reports.css', 'edge', 'center')}
    ${text(180, 408, 'Feature rules reach both pages', 'note', 'center')}
    ${text(540, 408, 'Same navigation · local feature', 'note', 'center')}
  `)
} }
