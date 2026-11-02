import { generatePresetCSS } from '../../../../common/generate-preset-css'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// Exact function anatomy selects two rendered text specimens. This is a value
// lookup contract, leaving the Guide's whole-card composition and workflow there.
export default {
  id: 'role-value-selection',
  render(theme: Theme) {
    const { text, codeParts, roleSelection, leader, scene } = drawing(theme)
    const figure = referenceIllustrations['role-value-selection']
    const l = figure.labels
    const css = generatePresetCSS([l.class, l.surface])
    return scene(figure.title, figure.alt, `
      <style>${css}</style>
      ${text(360, 58, l.class, 'code', 'center')}
      ${text(360, 100, l.declaration, 'code', 'center')}
      ${codeParts(360, 158, [
        { value: 'light-dark(' }, { id: 'light-value', value: l.lightValue, tone: 'blue' },
        { value: ', ' }, { id: 'dark-value', value: l.darkValue, tone: 'violet' }, { value: ')' }
      ])}
      ${leader('light-value', 'light-scheme', 218, 'blue')}
      ${leader('dark-value', 'dark-scheme', 218, 'violet')}
      ${roleSelection(204, 260, 'light', l.light, l.sample, l.surface, 'blue')}
      ${roleSelection(516, 260, 'dark', l.dark, l.sample, l.surface, 'violet')}
      ${text(360, 416, l.selection, 'note', 'center')}
    `)
  }
}
