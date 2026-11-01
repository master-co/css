import { lintIllustration as figure } from '../../../../content/guide/code-linting/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Two outcomes: an equivalent edit versus a value whose intended role is unknown to the tool.
export default {
  id: 'fix-and-review',
  render(theme: Theme) {
    const { scene, sheet, label, text, route } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${text(66, 63, l.automatic, 'title')}
      ${sheet(66, 106, undefined, undefined, label(l.before, 'code'))}
      ${route('M225 130H438')}
      ${text(350, 105, l.fix, 'note', 'center')}
      ${sheet(462, 106, undefined, undefined, label(l.after, 'code'))}
      <i class="divider" style="left:66px;top:220px;width:588px;height:1px"></i>
      ${text(66, 259, l.review, 'title')}
      ${sheet(66, 302, undefined, undefined, label(l.raw, 'code'))}
      ${text(66, 382, l.policy, 'note')}
      ${route('M235 326H420', { arrow: false })}
      ${text(450, 302, l.unchanged, 'title')}
      ${text(450, 338, l.choose, 'note')}
      ${text(450, 362, l.allow, 'note')}
    `)
  }
}
