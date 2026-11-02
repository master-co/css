import { aiIllustration as figure } from '../../../../content/guide/ai-coding/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// A cascade comparison, not a workflow: two actual rules compete for one property.
// Equal artifact treatment keeps validity distinct from precedence; the specimen measures the winner.
export default {
  id: 'generated-and-computed',
  render(theme: Theme) {
    const { scene, sheet, row, icon, label, text, route, rule, spacingControl } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${sheet(199, 64, undefined, undefined, `
        ${row(icon('layers') + label(l.utility))}${rule}
        ${label('@layer utilities {', 'code')}
        <div style="padding-left:12px">${label('.p-md {', 'code')}</div>
        <div style="padding-left:24px">${label('padding: var(--spacing-md);', 'code')}</div>
        <div style="padding-left:12px">${label('}', 'code')}</div>
        ${label('}', 'code')}
      `, 'center')}
      ${sheet(530, 88, undefined, undefined, `
        ${row(icon('fileCode') + label(l.native))}${rule}
        ${label('.notice {', 'code')}
        <div style="padding-left:12px">${label('padding: 8px;', 'code')}</div>
        ${label('}', 'code')}
      `, 'center')}
      ${text(199, 270, l.loser, 'note', 'center')}
      ${text(530, 270, l.winner, 'note', 'center')}
      ${route('M199 302V357H297', { arrow: false, dashed: true })}
      ${route('M530 302V357H423')}
      ${text(360, 298, l.result, 'code', 'center')}
      ${spacingControl(360, 338, l.sample, 8, '8px', true)}
      ${text(360, 418, l.computed, 'title', 'center')}
      ${text(360, 449, l.assumption, 'edge', 'center')}
    `)
  }
}
