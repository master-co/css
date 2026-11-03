import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'
import { deliveryIllustrations } from '../../../../content/guide/optimizing-css-delivery/illustrations'
// Two source-evidence lanes. The lower path deliberately bypasses filtering.
// Literal names are evidence; neither lane is a timeline of DOM reachability.
export default { id: 'evidence', render(theme: Theme) {
  const d = drawing(theme), f = deliveryIllustrations.evidence
  const { text, sheet, row, icon, label, rule, route, chip } = d
  return d.scene(f.title, f.alt, `
    ${text(48, 46, 'BOUNDED SOURCE', 'eyebrow')}
    ${sheet(48, 79, undefined, undefined, row(icon('code') + label('Markup + state map')) + rule + label('report', 'code') + label('report-idle', 'code') + label('report-ready', 'code'))}
    ${route('M245 152H285')}${chip(291, 136, undefined, 'filter', 'Prune')}${route('M384 152H427')}
    ${sheet(433, 79, undefined, undefined, row(icon('fileCode') + label('States retained')) + rule + label('[data-state="ready"]', 'code') + label(':focus-visible', 'code') + label('Idle + ready rules', 'note'))}
    ${text(360, 258, 'A class match retains its selector branch', 'body', 'center')}
    ${text(48, 311, 'UNBOUNDED SOURCE', 'eyebrow')}
    ${text(48, 350, 'CMS class names: unknown', 'code')}
    ${route('M263 361H311', { dashed: true })}${chip(317, 345, undefined, 'fileCode', 'Preserve')}${route('M433 361H480')}
    ${text(491, 350, 'Native rules remain', 'title')}
    ${text(360, 425, 'Keep this file with the route that can render CMS content', 'note', 'center')}
  `)
} }
