import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Equal key names are not equal thresholds or query targets.
// Widths are measured at one scale (8 scene px/rem); intrinsic heights carry no measurement claim.
export default {
  id: 'condition-domains',
  render(theme: Theme) {
    const { text, queryScopes, scene } = drawing(theme)
    const figure = referenceIllustrations['condition-domains']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      ${queryScopes(360, 88, figure.viewportRem * 8, figure.containerRem * 8, l)}
      ${text(360, 402, l.scale, 'edge', 'center')}
      ${text(360, 428, l.units, 'note', 'center')}
    `)
  }
}
