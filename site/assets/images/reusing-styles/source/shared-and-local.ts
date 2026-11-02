import { reuseIllustration } from '../../../../content/guide/reusing-styles/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'shared-and-local',
  render(theme: Theme) {
    const { sheet, row, icon, label, text, spacingControl, route, scene } = drawing(theme)
    const l = reuseIllustration.labels
    return scene(reuseIllustration.title, reuseIllustration.alt, `
      ${sheet(360, 62, undefined, undefined,
        row(icon('layers') + label(l.component))
        + label(l.componentClass, 'code'), 'center')}

      ${route('M360 133V184', { arrow: false })}
      ${route('M360 184H228Q220 184 220 192V248')}
      ${route('M360 184H492Q500 184 500 192V248')}
      ${text(360, 208, l.shared, 'edge', 'center')}

      ${spacingControl(220, 250, l.button, 16, l.firstPadding)}
      ${spacingControl(500, 250, l.button, 24, l.secondPadding, true)}
      ${text(220, 344, l.firstMarkup, 'code', 'center')}
      ${text(500, 344, l.secondMarkup, 'code', 'center')}
      ${text(220, 378, l.firstResult, 'note', 'center')}
      ${text(500, 378, l.secondResult, 'note', 'center')}
    `)
  }
}
